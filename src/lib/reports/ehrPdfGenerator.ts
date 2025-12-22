import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CheckIn, PlanPayload, PatientProfile } from '$lib/db/index';
import { formatDate, formatDateRange, type DateRange } from './pdfGenerator';
import { calculateZoneDistribution, calculateSkillFrequency } from './aggregations';

/**
 * Options for EHR PDF generation.
 */
export interface EhrPdfOptions {
	checkIns: CheckIn[];
	profile: PatientProfile;
	planPayload: PlanPayload;
	dateRange: DateRange;
	/** Optional last visit date for context */
	lastVisitDate?: Date | null;
	/** Provider name for the report header */
	providerName?: string;
}

/**
 * Generate an EHR-compatible PDF report.
 * View 3 of the Three-View Architecture.
 *
 * Format designed for:
 * - Professional appearance suitable for EHR attachment
 * - Single page preferred, two pages maximum
 * - Complete action plan content matching WBAP 2.0 card layout
 * - Engagement summary in text format (not charts)
 * - Clear margins for EHR scanning/attachment
 */
export async function generateEhrPdf(options: EhrPdfOptions): Promise<Blob> {
	const { checkIns, profile, planPayload, dateRange, lastVisitDate, providerName } = options;

	// Create PDF document (Letter size for US medical records)
	const doc = new jsPDF({
		format: 'letter',
		unit: 'mm'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 20;
	const contentWidth = pageWidth - margin * 2;

	// Colors - UVM brand
	const primaryColor: [number, number, number] = [0, 89, 76]; // Catamount Green
	// Note: UVM Gold [255, 199, 44] available for future use
	const textColor: [number, number, number] = [33, 33, 33];
	const mutedColor: [number, number, number] = [107, 114, 128];
	const greenZone: [number, number, number] = [0, 89, 76];
	const yellowZone: [number, number, number] = [202, 138, 4];
	const redZone: [number, number, number] = [185, 28, 28];

	let yPos = margin;

	// === HEADER ===
	// UVM Children's Hospital header bar
	doc.setFillColor(...primaryColor);
	doc.rect(0, 0, pageWidth, 15, 'F');

	doc.setFontSize(11);
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.text("UVM Children's Hospital - Well-Being Action Plan", margin, 10);

	yPos = 25;

	// Patient information box
	doc.setDrawColor(...primaryColor);
	doc.setLineWidth(0.5);
	doc.rect(margin, yPos, contentWidth, 22, 'S');

	doc.setFontSize(10);
	doc.setTextColor(...textColor);
	doc.setFont('helvetica', 'bold');
	doc.text('Patient Name:', margin + 3, yPos + 6);
	doc.setFont('helvetica', 'normal');
	doc.text(profile.displayName, margin + 35, yPos + 6);

	doc.setFont('helvetica', 'bold');
	doc.text('Report Date:', margin + 3, yPos + 12);
	doc.setFont('helvetica', 'normal');
	doc.text(formatDate(new Date()), margin + 35, yPos + 12);

	doc.setFont('helvetica', 'bold');
	doc.text('Date Range:', margin + 3, yPos + 18);
	doc.setFont('helvetica', 'normal');
	doc.text(formatDateRange(dateRange.start, dateRange.end), margin + 35, yPos + 18);

	if (providerName) {
		doc.setFont('helvetica', 'bold');
		doc.text('Provider:', pageWidth / 2 + 10, yPos + 6);
		doc.setFont('helvetica', 'normal');
		doc.text(providerName, pageWidth / 2 + 35, yPos + 6);
	}

	yPos += 28;

	// === CURRENT ACTION PLAN ===
	doc.setFontSize(12);
	doc.setTextColor(...primaryColor);
	doc.setFont('helvetica', 'bold');
	doc.text('Current Action Plan', margin, yPos);

	yPos += 6;

	// Green Zone Section
	doc.setFillColor(...greenZone);
	doc.rect(margin, yPos, contentWidth, 6, 'F');
	doc.setFontSize(10);
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.text('GREEN ZONE - Feeling Good', margin + 3, yPos + 4.5);

	yPos += 8;

	doc.setTextColor(...textColor);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);

	// Happy when / Happy because
	if (planPayload.happyWhen) {
		doc.setFont('helvetica', 'bold');
		doc.text('I feel happy when:', margin + 3, yPos + 4);
		doc.setFont('helvetica', 'normal');
		const happyWhenLines = doc.splitTextToSize(planPayload.happyWhen, contentWidth - 50);
		doc.text(happyWhenLines, margin + 45, yPos + 4);
		yPos += Math.max(6, happyWhenLines.length * 4);
	}

	if (planPayload.happyBecause) {
		doc.setFont('helvetica', 'bold');
		doc.text("I can tell I'm happy because:", margin + 3, yPos + 4);
		doc.setFont('helvetica', 'normal');
		const happyBecauseLines = doc.splitTextToSize(planPayload.happyBecause, contentWidth - 65);
		doc.text(happyBecauseLines, margin + 60, yPos + 4);
		yPos += Math.max(6, happyBecauseLines.length * 4);
	}

	// Coping skills
	if (planPayload.skills.length > 0) {
		yPos += 2;
		doc.setFont('helvetica', 'bold');
		doc.text('Selected Coping Skills:', margin + 3, yPos + 4);
		yPos += 6;
		doc.setFont('helvetica', 'normal');

		const skillsList = planPayload.skills
			.sort((a, b) => a.displayOrder - b.displayOrder)
			.map((s) => `\u2022 ${s.title}`)
			.join('    ');

		const skillsLines = doc.splitTextToSize(skillsList, contentWidth - 6);
		doc.text(skillsLines, margin + 3, yPos + 4);
		yPos += skillsLines.length * 4 + 2;
	}

	yPos += 4;

	// Yellow Zone Section
	doc.setFillColor(...yellowZone);
	doc.rect(margin, yPos, contentWidth, 6, 'F');
	doc.setFontSize(10);
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.text('YELLOW ZONE - Need Support', margin + 3, yPos + 4.5);

	yPos += 8;

	doc.setTextColor(...textColor);
	doc.setFontSize(9);

	// Help methods
	if (planPayload.helpMethods.length > 0) {
		doc.setFont('helvetica', 'bold');
		doc.text('Ways I can ask for help:', margin + 3, yPos + 4);
		yPos += 6;
		doc.setFont('helvetica', 'normal');

		for (const method of planPayload.helpMethods.sort((a, b) => a.displayOrder - b.displayOrder)) {
			doc.text(`\u2022 ${method.title}`, margin + 6, yPos + 4);
			yPos += 4;
		}
	}

	// Supportive adults
	if (planPayload.supportiveAdults.length > 0) {
		yPos += 2;
		doc.setFont('helvetica', 'bold');
		doc.text('Supportive Adults:', margin + 3, yPos + 4);
		yPos += 6;
		doc.setFont('helvetica', 'normal');

		for (const adult of planPayload.supportiveAdults.sort(
			(a, b) => a.displayOrder - b.displayOrder
		)) {
			const adultText = adult.contactInfo
				? `\u2022 ${adult.name} (${adult.type}) - ${adult.contactInfo}`
				: `\u2022 ${adult.name} (${adult.type})`;
			doc.text(adultText, margin + 6, yPos + 4);
			yPos += 4;
		}
	}

	yPos += 4;

	// Red Zone Section
	doc.setFillColor(...redZone);
	doc.rect(margin, yPos, contentWidth, 6, 'F');
	doc.setFontSize(10);
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.text('RED ZONE - Crisis Resources', margin + 3, yPos + 4.5);

	yPos += 8;

	doc.setTextColor(...textColor);
	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');

	// Crisis resources (static)
	if (planPayload.crisisResources.length > 0) {
		for (const resource of planPayload.crisisResources.sort(
			(a, b) => a.displayOrder - b.displayOrder
		)) {
			doc.setFont('helvetica', 'bold');
			doc.text(`\u2022 ${resource.name}:`, margin + 6, yPos + 4);
			doc.setFont('helvetica', 'normal');
			doc.text(
				resource.contact,
				margin + 6 + doc.getTextWidth(`\u2022 ${resource.name}: `),
				yPos + 4
			);
			yPos += 4;
		}
	} else {
		doc.text('\u2022 988 Suicide & Crisis Lifeline: Call or text 988', margin + 6, yPos + 4);
		yPos += 4;
		doc.text('\u2022 Crisis Text Line: Text HOME to 741741', margin + 6, yPos + 4);
		yPos += 4;
		doc.text('\u2022 Emergency: Call 911', margin + 6, yPos + 4);
		yPos += 4;
	}

	yPos += 8;

	// === ENGAGEMENT SUMMARY ===
	// Check if we need a new page
	if (yPos > pageHeight - 80) {
		doc.addPage();
		yPos = margin;
	}

	doc.setFontSize(12);
	doc.setTextColor(...primaryColor);
	doc.setFont('helvetica', 'bold');
	doc.text('Engagement Summary', margin, yPos);

	yPos += 6;

	// Calculate summary using shared aggregation utilities
	const zoneDistribution = calculateZoneDistribution(checkIns);
	const topSkills = calculateSkillFrequency(checkIns, planPayload, 3);
	const total = zoneDistribution.total;

	doc.setFontSize(9);
	doc.setTextColor(...textColor);
	doc.setFont('helvetica', 'normal');

	// Text-based engagement summary (as per spec - no charts)
	const lastVisitText = lastVisitDate ? formatDate(lastVisitDate) : formatDate(dateRange.start);

	doc.text(
		`Since ${lastVisitText}, ${profile.displayName} has checked in ${total} time${total !== 1 ? 's' : ''}.`,
		margin + 3,
		yPos + 4
	);
	yPos += 6;

	doc.text(
		`Zone distribution: ${zoneDistribution.green.percent}% green, ${zoneDistribution.yellow.percent}% yellow, ${zoneDistribution.red.percent}% red`,
		margin + 3,
		yPos + 4
	);
	yPos += 6;

	if (topSkills.length > 0) {
		const topSkillNames = topSkills.map((s) => s.title);
		doc.text(`Most used coping skills: ${topSkillNames.join(', ')}`, margin + 3, yPos + 4);
		yPos += 6;
	}

	// Check-in details table (condensed)
	if (checkIns.length > 0) {
		yPos += 4;

		doc.setFontSize(10);
		doc.setTextColor(...primaryColor);
		doc.setFont('helvetica', 'bold');
		doc.text('Recent Check-Ins', margin, yPos);
		yPos += 2;

		const tableData = checkIns.slice(0, 10).map((checkIn) => {
			const date = new Date(checkIn.createdAt).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: '2-digit'
			});
			const zone =
				checkIn.zone === 'green' ? 'Green' : checkIn.zone === 'yellow' ? 'Yellow' : 'Red';
			const skills =
				checkIn.strategiesUsed.length > 0
					? checkIn.strategiesUsed
							.map((id) => planPayload.skills.find((s) => s.id === id)?.title)
							.filter(Boolean)
							.join(', ')
					: '-';
			return [date, zone, skills];
		});

		autoTable(doc, {
			startY: yPos,
			head: [['Date', 'Zone', 'Coping Skills Used']],
			body: tableData,
			headStyles: {
				fillColor: primaryColor,
				textColor: [255, 255, 255],
				fontStyle: 'bold',
				fontSize: 8
			},
			bodyStyles: {
				fontSize: 8,
				textColor: textColor,
				cellPadding: 2
			},
			columnStyles: {
				0: { cellWidth: 25 },
				1: { cellWidth: 20 },
				2: { cellWidth: 'auto' }
			},
			alternateRowStyles: {
				fillColor: [248, 249, 250]
			},
			margin: { left: margin, right: margin },
			tableWidth: contentWidth
		});
	}

	// === FOOTER ===
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);

		// Footer line
		doc.setDrawColor(...mutedColor);
		doc.setLineWidth(0.25);
		doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

		doc.setFontSize(7);
		doc.setTextColor(...mutedColor);
		doc.setFont('helvetica', 'normal');

		// Left: App name
		doc.text('Generated by WBAP App', margin, pageHeight - 13);

		// Center: Hospital
		doc.text("UVM Children's Hospital", pageWidth / 2, pageHeight - 13, { align: 'center' });

		// Right: Page number
		doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 13, { align: 'right' });

		// Version and timestamp
		const timestamp = new Date().toISOString();
		doc.setFontSize(6);
		doc.text(`Report ID: ${timestamp} | v1.0`, margin, pageHeight - 9);
	}

	return doc.output('blob');
}

/**
 * Generate filename for EHR PDF.
 */
export function generateEhrFilename(profile: PatientProfile, dateRange: DateRange): string {
	const patientName = profile.displayName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
	const endDate = new Date(dateRange.end).toISOString().split('T')[0];
	return `wbap-ehr-${patientName}-${endDate}.pdf`;
}
