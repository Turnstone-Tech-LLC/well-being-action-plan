import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CheckIn, PlanPayload, PatientProfile } from '$lib/db/index';
import { getZoneInfo } from '$lib/db/checkIns';

/**
 * Date range for the report.
 */
export interface DateRange {
	start: Date;
	end: Date;
}

/**
 * Summary statistics for the report.
 */
export interface ReportSummary {
	total: number;
	byZone: { green: number; yellow: number; red: number };
	topStrategies: Array<{ id: string; title: string; count: number }>;
}

/**
 * Options for PDF generation.
 */
export interface PdfGeneratorOptions {
	checkIns: CheckIn[];
	profile: PatientProfile;
	planPayload: PlanPayload;
	dateRange: DateRange;
}

/**
 * Format a date for display in the report.
 */
export function formatDate(date: Date): string {
	return new Date(date).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Format a date range for display in the report.
 */
export function formatDateRange(start: Date, end: Date): string {
	const startDate = new Date(start);
	const endDate = new Date(end);

	// If same year, don't repeat the year
	if (startDate.getFullYear() === endDate.getFullYear()) {
		const startStr = startDate.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric'
		});
		const endStr = endDate.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
		return `${startStr} - ${endStr}`;
	}

	return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Calculate summary statistics from check-ins.
 */
export function calculateReportSummary(
	checkIns: CheckIn[],
	planPayload: PlanPayload
): ReportSummary {
	const byZone = { green: 0, yellow: 0, red: 0 };
	const strategyCounts: Record<string, number> = {};

	for (const checkIn of checkIns) {
		// Count by zone
		byZone[checkIn.zone]++;

		// Count strategies used
		for (const strategyId of checkIn.strategiesUsed) {
			strategyCounts[strategyId] = (strategyCounts[strategyId] || 0) + 1;
		}
	}

	// Build top strategies list
	const topStrategies = Object.entries(strategyCounts)
		.map(([id, count]) => {
			const skill = planPayload.skills.find((s) => s.id === id);
			return {
				id,
				title: skill?.title || 'Unknown skill',
				count
			};
		})
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return {
		total: checkIns.length,
		byZone,
		topStrategies
	};
}

/**
 * Get check-in details for the table.
 */
function getCheckInDetails(checkIn: CheckIn, planPayload: PlanPayload): string {
	const details: string[] = [];

	// Add strategies used (green zone behavior)
	if (checkIn.strategiesUsed.length > 0) {
		const strategies = checkIn.strategiesUsed
			.map((id) => {
				const skill = planPayload.skills.find((s) => s.id === id);
				return skill?.title || 'Unknown';
			})
			.join(', ');
		details.push(`Coping skills: ${strategies}`);
	}

	// Add supportive adults contacted (yellow zone behavior)
	if (checkIn.supportiveAdultsContacted.length > 0) {
		const adults = checkIn.supportiveAdultsContacted
			.map((id) => {
				const adult = planPayload.supportiveAdults.find((a) => a.id === id);
				return adult?.name || 'Unknown';
			})
			.join(', ');
		details.push(`Contacted: ${adults}`);
	}

	// Add help methods selected (yellow zone behavior)
	if (checkIn.helpMethodsSelected.length > 0) {
		const methods = checkIn.helpMethodsSelected
			.map((id) => {
				const method = planPayload.helpMethods.find((m) => m.id === id);
				return method?.title || 'Unknown';
			})
			.join(', ');
		details.push(`Help methods: ${methods}`);
	}

	// Red zone message
	if (checkIn.zone === 'red') {
		details.push('Reached out for help');
	}

	// Notes
	if (checkIn.notes) {
		details.push(`Notes: ${checkIn.notes}`);
	}

	return details.join('\n') || '-';
}

/**
 * Generate a PDF report from check-in data.
 * Returns a Blob containing the PDF.
 */
export async function generatePdfReport(options: PdfGeneratorOptions): Promise<Blob> {
	const { checkIns, profile, planPayload, dateRange } = options;

	// Create PDF document (A4 size)
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();

	// Calculate summary
	const summary = calculateReportSummary(checkIns, planPayload);

	// Colors
	const primaryColor: [number, number, number] = [0, 89, 76]; // UVM Catamount Green
	const textColor: [number, number, number] = [51, 51, 51];
	const mutedColor: [number, number, number] = [107, 114, 128];
	const greenColor: [number, number, number] = [34, 197, 94];
	const yellowColor: [number, number, number] = [234, 179, 8];
	const redColor: [number, number, number] = [239, 68, 68];

	let yPosition = 20;

	// === HEADER ===
	doc.setFontSize(20);
	doc.setTextColor(...primaryColor);
	doc.text('Well-Being Check-In Report', pageWidth / 2, yPosition, { align: 'center' });

	yPosition += 10;
	doc.setFontSize(12);
	doc.setTextColor(...textColor);
	doc.text(profile.displayName, pageWidth / 2, yPosition, { align: 'center' });

	yPosition += 8;
	doc.setFontSize(10);
	doc.setTextColor(...mutedColor);
	doc.text(formatDateRange(dateRange.start, dateRange.end), pageWidth / 2, yPosition, {
		align: 'center'
	});

	yPosition += 6;
	doc.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: 'center' });

	yPosition += 15;

	// === SUMMARY SECTION ===
	doc.setFontSize(14);
	doc.setTextColor(...primaryColor);
	doc.text('Summary', 20, yPosition);

	yPosition += 8;

	// Total check-ins
	doc.setFontSize(10);
	doc.setTextColor(...textColor);
	doc.text(`Total check-ins: ${summary.total}`, 25, yPosition);

	yPosition += 12;

	// Zone breakdown section
	doc.setFontSize(12);
	doc.setTextColor(...primaryColor);
	doc.text('Zone Breakdown', 25, yPosition);

	yPosition += 8;

	// Green zone
	doc.setFontSize(10);
	doc.setFillColor(...greenColor);
	doc.circle(30, yPosition - 2, 3, 'F');
	doc.setTextColor(...textColor);
	doc.text(`Green Zone (Feeling good): ${summary.byZone.green}`, 37, yPosition);

	yPosition += 7;

	// Yellow zone
	doc.setFillColor(...yellowColor);
	doc.circle(30, yPosition - 2, 3, 'F');
	doc.text(`Yellow Zone (Needed support): ${summary.byZone.yellow}`, 37, yPosition);

	yPosition += 7;

	// Red zone
	doc.setFillColor(...redColor);
	doc.circle(30, yPosition - 2, 3, 'F');
	doc.text(`Red Zone (Reached out): ${summary.byZone.red}`, 37, yPosition);

	yPosition += 12;

	// Top coping skills
	if (summary.topStrategies.length > 0) {
		doc.setFontSize(12);
		doc.setTextColor(...primaryColor);
		doc.text('Most Used Coping Skills', 25, yPosition);

		yPosition += 8;

		doc.setFontSize(10);
		doc.setTextColor(...textColor);

		for (let i = 0; i < summary.topStrategies.length; i++) {
			const strategy = summary.topStrategies[i];
			const timesText = strategy.count === 1 ? 'time' : 'times';
			doc.text(`${i + 1}. ${strategy.title} (${strategy.count} ${timesText})`, 30, yPosition);
			yPosition += 6;
		}

		yPosition += 6;
	}

	// === CHECK-IN HISTORY ===
	yPosition += 5;
	doc.setFontSize(14);
	doc.setTextColor(...primaryColor);
	doc.text('Check-In History', 20, yPosition);

	yPosition += 5;

	// Prepare table data
	const tableData = checkIns.map((checkIn) => {
		const date = new Date(checkIn.createdAt);
		const dateStr = date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		const timeStr = date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});

		const zoneInfo = getZoneInfo(checkIn.zone);
		const details = getCheckInDetails(checkIn, planPayload);

		return [`${dateStr}\n${timeStr}`, zoneInfo.label, details];
	});

	// Draw table using autoTable
	autoTable(doc, {
		startY: yPosition,
		head: [['Date & Time', 'Zone', 'Details']],
		body: tableData,
		headStyles: {
			fillColor: primaryColor,
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			fontSize: 10
		},
		bodyStyles: {
			fontSize: 9,
			textColor: textColor,
			cellPadding: 4
		},
		columnStyles: {
			0: { cellWidth: 35 },
			1: { cellWidth: 30 },
			2: { cellWidth: 'auto' }
		},
		alternateRowStyles: {
			fillColor: [248, 249, 250]
		},
		didDrawCell: (data) => {
			// Color-code the zone column
			if (data.section === 'body' && data.column.index === 1) {
				const zoneText = data.cell.raw as string;
				if (zoneText.includes('good')) {
					doc.setTextColor(...greenColor);
				} else if (zoneText.includes('support')) {
					doc.setTextColor(...yellowColor);
				} else if (zoneText.includes('out')) {
					doc.setTextColor(...redColor);
				}
			}
		},
		margin: { left: 20, right: 20 }
	});

	// === FOOTER ===
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		const pageHeight = doc.internal.pageSize.getHeight();

		doc.setFontSize(8);
		doc.setTextColor(...mutedColor);

		// Left side - app name
		doc.text('Generated from Well-Being Action Plan', 20, pageHeight - 15);

		// Center - partnership
		doc.text(
			"Created in partnership with UVM Children's Hospital",
			pageWidth / 2,
			pageHeight - 15,
			{
				align: 'center'
			}
		);

		// Right side - page number
		doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });

		// Privacy note
		doc.setFontSize(7);
		doc.text(
			'This report was generated locally and not stored on any server.',
			pageWidth / 2,
			pageHeight - 10,
			{ align: 'center' }
		);
	}

	// Return as Blob
	return doc.output('blob');
}

/**
 * Trigger download of the PDF report.
 */
export function downloadPdf(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Generate a default filename for the report.
 */
export function generateFilename(dateRange: DateRange): string {
	const startStr = new Date(dateRange.start).toISOString().split('T')[0];
	const endStr = new Date(dateRange.end).toISOString().split('T')[0];
	return `wellbeing-report-${startStr}-to-${endStr}.pdf`;
}
