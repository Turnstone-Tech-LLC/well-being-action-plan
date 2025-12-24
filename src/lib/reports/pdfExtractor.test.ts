/**
 * Tests for PDF extraction utilities.
 */
import { describe, it, expect } from 'vitest';
import { validateFileForImport, validateFileSize, MAX_FILE_SIZE } from './pdfExtractor';

describe('pdfExtractor', () => {
	describe('validateFileForImport', () => {
		it('validates PDF files as valid', () => {
			const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
			const result = validateFileForImport(pdfFile);

			expect(result.valid).toBe(true);
			expect(result.type).toBe('pdf');
		});

		it('validates PDF files by extension when mime type is wrong', () => {
			const pdfFile = new File([''], 'test.pdf', { type: 'application/octet-stream' });
			const result = validateFileForImport(pdfFile);

			expect(result.valid).toBe(true);
			expect(result.type).toBe('pdf');
		});

		it('validates PNG files as image type requiring manual entry', () => {
			const pngFile = new File([''], 'test.png', { type: 'image/png' });
			const result = validateFileForImport(pngFile);

			expect(result.valid).toBe(true);
			expect(result.type).toBe('image');
			expect(result.message).toContain('manual');
		});

		it('validates JPEG files as image type requiring manual entry', () => {
			const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
			const result = validateFileForImport(jpegFile);

			expect(result.valid).toBe(true);
			expect(result.type).toBe('image');
		});

		it('rejects unsupported file types', () => {
			const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
			const result = validateFileForImport(txtFile);

			expect(result.valid).toBe(false);
			expect(result.type).toBe('unsupported');
		});

		it('rejects files with unsupported extensions', () => {
			const docFile = new File([''], 'test.docx', { type: 'application/msword' });
			const result = validateFileForImport(docFile);

			expect(result.valid).toBe(false);
			expect(result.type).toBe('unsupported');
		});
	});

	describe('validateFileSize', () => {
		it('accepts files under the size limit', () => {
			const smallFile = new File(['small content'], 'test.pdf', { type: 'application/pdf' });
			const result = validateFileSize(smallFile);

			expect(result.valid).toBe(true);
		});

		it('rejects files over the size limit', () => {
			// Create a mock file object with a large size
			const largeFile = {
				size: MAX_FILE_SIZE + 1,
				name: 'large.pdf',
				type: 'application/pdf'
			} as File;

			const result = validateFileSize(largeFile);

			expect(result.valid).toBe(false);
			expect(result.message).toContain('too large');
		});

		it('accepts files exactly at the size limit', () => {
			const exactFile = {
				size: MAX_FILE_SIZE,
				name: 'exact.pdf',
				type: 'application/pdf'
			} as File;

			const result = validateFileSize(exactFile);

			expect(result.valid).toBe(true);
		});
	});

	describe('MAX_FILE_SIZE', () => {
		it('is set to 10MB', () => {
			expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
		});
	});
});
