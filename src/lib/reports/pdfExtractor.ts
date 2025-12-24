/**
 * PDF extraction utilities for importing check-in summaries.
 *
 * This module handles extracting structured data from WBAP-generated PDFs,
 * with fallback to text extraction for older or modified PDFs.
 */

import { PDFDocument } from 'pdf-lib';
import type { CheckInSummary } from '$lib/server/types';
import { decodeMetadata, METADATA_PREFIX, type PdfCheckInMetadata } from './pdfMetadata';

/**
 * Confidence level for the extraction result.
 */
export type ExtractionConfidence = 'high' | 'medium' | 'low';

/**
 * Source of the extracted data.
 */
export type ExtractionSource = 'metadata' | 'text' | 'none';

/**
 * Result of PDF extraction attempt.
 */
export interface PdfExtractionResult {
	/** Whether extraction was successful */
	success: boolean;
	/** The extracted check-in summary, or null if extraction failed */
	summary: CheckInSummary | null;
	/** Source of the extracted data */
	source: ExtractionSource;
	/** Confidence level of the extraction */
	confidence: ExtractionConfidence;
	/** Error messages if extraction failed or had issues */
	errors?: string[];
	/** Warning messages for partial extraction */
	warnings?: string[];
}

/**
 * Extract check-in summary from a PDF file.
 *
 * First attempts to extract embedded metadata (high confidence).
 * Falls back to text extraction if metadata is not present (lower confidence).
 *
 * @param file The PDF file to extract from
 * @returns Extraction result with summary and confidence level
 */
export async function extractCheckInSummary(file: File): Promise<PdfExtractionResult> {
	try {
		// Validate file type
		if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
			return {
				success: false,
				summary: null,
				source: 'none',
				confidence: 'low',
				errors: ['File is not a PDF. Please upload a PDF file.']
			};
		}

		// Read file as ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Load PDF document
		const pdfDoc = await PDFDocument.load(arrayBuffer, {
			updateMetadata: false
		});

		// Try to extract from metadata first (most reliable)
		const metadataResult = await extractFromMetadata(pdfDoc);
		if (metadataResult.success) {
			return metadataResult;
		}

		// Fall back to text extraction
		const textResult = await extractFromText(pdfDoc);
		if (textResult.success) {
			return textResult;
		}

		// If both fail, return error
		return {
			success: false,
			summary: null,
			source: 'none',
			confidence: 'low',
			errors: [
				'Could not extract check-in data from this PDF.',
				'This may not be a WBAP-generated check-in report.',
				'You can enter the data manually instead.'
			]
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			summary: null,
			source: 'none',
			confidence: 'low',
			errors: [`Failed to read PDF file: ${message}`]
		};
	}
}

/**
 * Extract check-in summary from PDF metadata (keywords field).
 */
async function extractFromMetadata(pdfDoc: PDFDocument): Promise<PdfExtractionResult> {
	try {
		const keywords = pdfDoc.getKeywords();

		if (!keywords || !keywords.includes(METADATA_PREFIX)) {
			return {
				success: false,
				summary: null,
				source: 'none',
				confidence: 'low'
			};
		}

		const metadata = decodeMetadata(keywords);

		if (!metadata) {
			return {
				success: false,
				summary: null,
				source: 'none',
				confidence: 'low',
				errors: ['Found WBAP metadata but failed to decode it.']
			};
		}

		// Convert PDF metadata to CheckInSummary
		const summary = convertMetadataToSummary(metadata);

		return {
			success: true,
			summary,
			source: 'metadata',
			confidence: 'high'
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			summary: null,
			source: 'none',
			confidence: 'low',
			errors: [`Failed to extract metadata: ${message}`]
		};
	}
}

/**
 * Extract check-in summary from PDF text content (fallback).
 * This is a best-effort extraction for older PDFs without embedded metadata.
 */
async function extractFromText(pdfDoc: PDFDocument): Promise<PdfExtractionResult> {
	try {
		// Check if this looks like a WBAP PDF by examining properties
		const title = pdfDoc.getTitle();
		const author = pdfDoc.getAuthor();

		const isWbapPdf =
			title?.includes('Well-Being Action Plan') ||
			title?.includes('WBAP') ||
			author?.includes('WBAP');

		if (!isWbapPdf) {
			return {
				success: false,
				summary: null,
				source: 'none',
				confidence: 'low'
			};
		}

		// For now, we can't extract structured data from text without additional parsing
		// This is a placeholder for future text extraction functionality
		// The PDF content would need to be extracted and parsed with regex patterns

		return {
			success: false,
			summary: null,
			source: 'text',
			confidence: 'low',
			warnings: [
				'This appears to be a WBAP PDF, but it lacks embedded metadata.',
				'Text extraction is not yet supported.',
				'Please enter the data manually.'
			]
		};
	} catch {
		return {
			success: false,
			summary: null,
			source: 'none',
			confidence: 'low'
		};
	}
}

/**
 * Convert PDF metadata to CheckInSummary format.
 */
function convertMetadataToSummary(metadata: PdfCheckInMetadata): CheckInSummary {
	const { data } = metadata;

	return {
		dateRange: data.dateRange,
		totalCheckIns: data.totalCheckIns,
		zoneDistribution: data.zoneDistribution,
		topCopingSkills: data.topCopingSkills,
		feelingNotes: data.feelingNotes,
		adultsContacted: data.adultsContacted,
		importedAt: new Date().toISOString()
	};
}

/**
 * Validate that a file is an acceptable format for import.
 * Currently supports PDF only (v1). Images will show manual entry prompt.
 */
export function validateFileForImport(file: File): {
	valid: boolean;
	type: 'pdf' | 'image' | 'unsupported';
	message?: string;
} {
	const fileName = file.name.toLowerCase();
	const mimeType = file.type.toLowerCase();

	// PDF files
	if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
		return { valid: true, type: 'pdf' };
	}

	// Image files (PNG, JPEG) - valid but require manual entry
	if (
		mimeType.startsWith('image/') ||
		fileName.endsWith('.png') ||
		fileName.endsWith('.jpg') ||
		fileName.endsWith('.jpeg')
	) {
		return {
			valid: true,
			type: 'image',
			message: 'Image files require manual data entry. Please enter the check-in summary details.'
		};
	}

	// Unsupported file types
	return {
		valid: false,
		type: 'unsupported',
		message: 'Unsupported file type. Please upload a PDF, PNG, or JPEG file.'
	};
}

/**
 * Maximum file size for upload (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file size.
 */
export function validateFileSize(file: File): { valid: boolean; message?: string } {
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			message: `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
		};
	}
	return { valid: true };
}
