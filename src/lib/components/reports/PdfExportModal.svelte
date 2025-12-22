<script lang="ts">
	/**
	 * PdfExportModal component for generating and downloading PDF reports.
	 * Allows users to select date range and preview report info before generating.
	 */
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';
	import type { CheckIn, PlanPayload, PatientProfile } from '$lib/db/index';
	import { getCheckInsByDateRange } from '$lib/db/checkIns';
	import {
		generatePdfReport,
		downloadPdf,
		generateFilename,
		formatDateRange,
		type DateRange
	} from '$lib/reports/pdfGenerator';

	type QuickOption = 'last7' | 'last30' | 'custom';

	interface Props {
		open: boolean;
		actionPlanId: string;
		profile: PatientProfile;
		planPayload: PlanPayload;
		/** Pre-filled date range from reports page filters */
		initialStartDate?: Date | null;
		initialEndDate?: Date | null;
		onClose: () => void;
	}

	let {
		open,
		actionPlanId,
		profile,
		planPayload,
		initialStartDate = null,
		initialEndDate = null,
		onClose
	}: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	// Use a plain variable for focusTrap - NOT $state - to avoid triggering effects when we modify it
	let focusTrap: FocusTrap | null = null;

	// Form state
	let selectedOption: QuickOption = $state('last7');
	let customStartDate: string = $state('');
	let customEndDate: string = $state('');

	// Loading and error states
	let loading: boolean = $state(false);
	let error: string | null = $state(null);

	// Preview data
	let previewCheckIns: CheckIn[] = $state([]);
	let previewLoading: boolean = $state(false);

	// Helper functions for date calculations (immutable Date creation)
	function createEndOfToday(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	}

	function createStartOfDaysAgo(daysAgo: number): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 0, 0, 0, 0);
	}

	// Calculate date range based on selected option
	function getDateRange(): DateRange {
		if (selectedOption === 'last7') {
			return { start: createStartOfDaysAgo(6), end: createEndOfToday() };
		}

		if (selectedOption === 'last30') {
			return { start: createStartOfDaysAgo(29), end: createEndOfToday() };
		}

		// Custom date range
		const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : createEndOfToday();
		const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : createEndOfToday();
		return { start, end };
	}

	// Load preview when date range changes
	async function loadPreview() {
		if (!actionPlanId) return;

		previewLoading = true;
		error = null;

		try {
			const range = getDateRange();
			previewCheckIns = await getCheckInsByDateRange(actionPlanId, range.start, range.end);
		} catch (err) {
			console.error('Failed to load preview:', err);
			error = 'Failed to load check-ins. Please try again.';
		} finally {
			previewLoading = false;
		}
	}

	// Handle PDF generation
	async function handleGenerate() {
		if (previewCheckIns.length === 0) {
			error = 'No check-ins to export in the selected date range.';
			return;
		}

		loading = true;
		error = null;

		try {
			const dateRange = getDateRange();
			const blob = await generatePdfReport({
				checkIns: previewCheckIns,
				profile,
				planPayload,
				dateRange
			});

			const filename = generateFilename(dateRange);
			downloadPdf(blob, filename);

			onClose();
		} catch (err) {
			console.error('Failed to generate PDF:', err);
			error = 'Failed to generate PDF. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Initialize with pre-filled dates if provided
	function initializeDates() {
		if (initialStartDate && initialEndDate) {
			selectedOption = 'custom';
			customStartDate = formatDateForInput(initialStartDate);
			customEndDate = formatDateForInput(initialEndDate);
		} else {
			selectedOption = 'last7';
			customStartDate = '';
			customEndDate = '';
		}
	}

	function formatDateForInput(date: Date): string {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Track whether we've initialized for the current open session
	// Using plain variables to avoid reactivity issues
	let hasInitializedForSession = false;
	let prevOption: QuickOption | null = null;
	let prevStartDate: string | null = null;
	let prevEndDate: string | null = null;

	// Effect to handle modal open - only runs initialization once per session
	$effect(() => {
		if (open && !hasInitializedForSession) {
			hasInitializedForSession = true;
			initializeDates();
			loadPreview();
			// Capture initial values after initialization
			prevOption = selectedOption;
			prevStartDate = customStartDate;
			prevEndDate = customEndDate;
		} else if (!open && hasInitializedForSession) {
			hasInitializedForSession = false;
			prevOption = null;
			prevStartDate = null;
			prevEndDate = null;
		}
	});

	// Separate effect to handle date changes while modal is open
	$effect(() => {
		// Only track changes if modal is open and we've already initialized
		if (!open || !hasInitializedForSession) return;

		const currentOption = selectedOption;
		const currentStartDate = customStartDate;
		const currentEndDate = customEndDate;

		// Check if values have changed from what we last tracked
		const optionChanged = prevOption !== null && currentOption !== prevOption;
		const startChanged = prevStartDate !== null && currentStartDate !== prevStartDate;
		const endChanged = prevEndDate !== null && currentEndDate !== prevEndDate;

		if (optionChanged || startChanged || endChanged) {
			loadPreview();
		}

		// Update tracking values
		prevOption = currentOption;
		prevStartDate = currentStartDate;
		prevEndDate = currentEndDate;
	});

	// Separate effect for focus trap management
	$effect(() => {
		if (open && modalElement) {
			focusTrap = createFocusTrap(modalElement, {
				onEscape: onClose
			});
			focusTrap.activate();
		}

		return () => {
			if (focusTrap) {
				focusTrap.deactivate();
				focusTrap = null;
			}
		};
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleBackdropKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Derived values
	let todayFormatted = formatDateForInput(new Date());
	let dateRange = $derived(getDateRange());
	let dateRangeText = $derived(formatDateRange(dateRange.start, dateRange.end));
	let checkInCount = $derived(previewCheckIns.length);
	let canGenerate = $derived(checkInCount > 0 && !loading && !previewLoading);
</script>

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeyDown}
		role="presentation"
	>
		<div
			bind:this={modalElement}
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			aria-describedby="modal-description"
		>
			<div class="modal-header">
				<svg
					class="pdf-icon"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<polyline
						points="14 2 14 8 20 8"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<line
						x1="12"
						y1="18"
						x2="12"
						y2="12"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<line
						x1="9"
						y1="15"
						x2="12"
						y2="12"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<line
						x1="15"
						y1="15"
						x2="12"
						y2="12"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<h2 id="modal-title">Create PDF Report</h2>
			</div>

			<div id="modal-description" class="modal-body">
				<p class="intro-text">Generate a downloadable report of your check-in history.</p>

				<!-- Date Range Selection -->
				<fieldset class="date-range-fieldset">
					<legend class="sr-only">Select date range</legend>

					<div class="quick-options">
						<label class="option-label">
							<input
								type="radio"
								name="dateRange"
								value="last7"
								bind:group={selectedOption}
								class="sr-only"
							/>
							<span class="option-button" class:selected={selectedOption === 'last7'}>
								Last 7 days
							</span>
						</label>

						<label class="option-label">
							<input
								type="radio"
								name="dateRange"
								value="last30"
								bind:group={selectedOption}
								class="sr-only"
							/>
							<span class="option-button" class:selected={selectedOption === 'last30'}>
								Last 30 days
							</span>
						</label>

						<label class="option-label">
							<input
								type="radio"
								name="dateRange"
								value="custom"
								bind:group={selectedOption}
								class="sr-only"
							/>
							<span class="option-button" class:selected={selectedOption === 'custom'}>
								Custom
							</span>
						</label>
					</div>

					{#if selectedOption === 'custom'}
						<div class="custom-dates">
							<div class="date-field">
								<label for="startDate">Start date</label>
								<input
									type="date"
									id="startDate"
									bind:value={customStartDate}
									max={customEndDate || todayFormatted}
								/>
							</div>
							<div class="date-field">
								<label for="endDate">End date</label>
								<input
									type="date"
									id="endDate"
									bind:value={customEndDate}
									min={customStartDate}
									max={todayFormatted}
								/>
							</div>
						</div>
					{/if}
				</fieldset>

				<!-- Preview Info -->
				<div class="preview-info" aria-live="polite">
					{#if previewLoading}
						<p class="preview-text loading">Loading...</p>
					{:else if checkInCount === 0}
						<p class="preview-text empty">No check-ins found in this date range.</p>
					{:else}
						<p class="preview-text">
							This report will include <strong>{checkInCount}</strong>
							check-in{checkInCount !== 1 ? 's' : ''} from <strong>{dateRangeText}</strong>.
						</p>
					{/if}
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="error-message" role="alert">
						<svg
							class="error-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
							<line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" />
						</svg>
						{error}
					</div>
				{/if}
			</div>

			<div class="modal-actions">
				<button type="button" class="btn btn-outline" onclick={onClose} disabled={loading}>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleGenerate}
					disabled={!canGenerate}
				>
					{#if loading}
						<span class="loading-spinner" aria-hidden="true"></span>
						Generating...
					{:else}
						Create PDF
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 100;
	}

	.modal {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 28rem;
		width: 100%;
		box-shadow: var(--shadow-lg);
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal:focus {
		outline: none;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.pdf-icon {
		color: var(--color-primary);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.modal h2 {
		font-size: var(--font-size-xl);
		margin: 0;
	}

	.modal-body {
		margin-bottom: var(--space-6);
	}

	.intro-text {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
	}

	/* Date Range Fieldset */
	.date-range-fieldset {
		border: none;
		padding: 0;
		margin: 0 0 var(--space-4);
	}

	.quick-options {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.option-label {
		cursor: pointer;
	}

	.option-button {
		display: inline-block;
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.option-button:hover {
		background-color: var(--color-gray-50);
	}

	.option-button.selected {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-white);
	}

	.option-label:focus-within .option-button {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.custom-dates {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}

	.date-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.date-field label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	.date-field input[type='date'] {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		width: 100%;
	}

	.date-field input[type='date']:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.15);
	}

	/* Preview Info */
	.preview-info {
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.preview-text {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.preview-text.loading {
		color: var(--color-text-muted);
	}

	.preview-text.empty {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.preview-text strong {
		color: var(--color-primary);
	}

	/* Error Message */
	.error-message {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.error-icon {
		flex-shrink: 0;
	}

	/* Modal Actions */
	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		min-height: 44px;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		color: var(--color-text);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-50);
	}

	.btn-outline:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-primary {
		background-color: var(--color-primary);
		border: 1px solid var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Loading Spinner */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: var(--color-white);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}

		.option-button {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.modal {
			border: 2px solid currentColor;
		}

		.option-button.selected {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.custom-dates {
			flex-direction: column;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}
	}
</style>
