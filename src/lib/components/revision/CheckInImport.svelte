<script lang="ts">
	import type { CheckInSummary } from '$lib/server/types';
	import {
		extractCheckInSummary,
		validateFileForImport,
		validateFileSize,
		type PdfExtractionResult
	} from '$lib/reports/pdfExtractor';

	type ImportState = 'idle' | 'processing' | 'success' | 'error' | 'manual-required';

	interface Props {
		/** Callback when summary is successfully imported */
		onImport: (summary: CheckInSummary) => void;
		/** Existing summary if already imported (for re-editing) */
		existingSummary?: CheckInSummary | null;
		/** Callback to show manual entry form */
		onManualEntry?: () => void;
	}

	let { onImport, existingSummary = null, onManualEntry }: Props = $props();

	let importState = $state<ImportState>(existingSummary ? 'success' : 'idle');
	let errorMessages = $state<string[]>([]);
	let warningMessages = $state<string[]>([]);
	let selectedFile: File | null = $state(null);
	let isDragOver = $state(false);
	let fileInputRef: HTMLInputElement | null = $state(null);
	let extractionResult = $state<PdfExtractionResult | null>(null);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		const file = event.dataTransfer?.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	async function processFile(file: File) {
		selectedFile = file;
		errorMessages = [];
		warningMessages = [];

		// Validate file size
		const sizeValidation = validateFileSize(file);
		if (!sizeValidation.valid) {
			errorMessages = [sizeValidation.message || 'File is too large.'];
			importState = 'error';
			return;
		}

		// Validate file type
		const typeValidation = validateFileForImport(file);
		if (!typeValidation.valid) {
			errorMessages = [typeValidation.message || 'Unsupported file type.'];
			importState = 'error';
			return;
		}

		// Handle image files - require manual entry
		if (typeValidation.type === 'image') {
			warningMessages = [typeValidation.message || 'Image files require manual data entry.'];
			importState = 'manual-required';
			return;
		}

		// Process PDF file
		importState = 'processing';

		try {
			const result = await extractCheckInSummary(file);
			extractionResult = result;

			if (result.success && result.summary) {
				onImport(result.summary);
				importState = 'success';
				if (result.warnings) {
					warningMessages = result.warnings;
				}
			} else {
				errorMessages = result.errors || ['Failed to extract data from PDF.'];
				if (result.warnings) {
					warningMessages = result.warnings;
				}
				importState = 'error';
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			errorMessages = [`Failed to process PDF: ${message}`];
			importState = 'error';
		}
	}

	function clearFile() {
		selectedFile = null;
		errorMessages = [];
		warningMessages = [];
		extractionResult = null;
		importState = 'idle';
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function handleManualEntry() {
		if (onManualEntry) {
			onManualEntry();
		}
	}

	function handleRetry() {
		clearFile();
	}

	const hasFile = $derived(selectedFile !== null);
	const confidenceLabel = $derived(
		extractionResult?.confidence === 'high'
			? 'High confidence'
			: extractionResult?.confidence === 'medium'
				? 'Medium confidence'
				: 'Low confidence'
	);
</script>

<div class="import-container">
	{#if importState === 'success' && existingSummary}
		<!-- Already imported - show summary indicator -->
		<div class="import-success" role="status">
			<div class="success-indicator">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				<span>Check-in summary imported</span>
			</div>
			<button type="button" class="btn btn-outline btn-sm" onclick={clearFile}>
				Import Different File
			</button>
		</div>
	{:else if importState === 'processing'}
		<!-- Processing state -->
		<div class="processing-state" role="status" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<p>Extracting check-in data...</p>
		</div>
	{:else if importState === 'manual-required'}
		<!-- Image file - needs manual entry -->
		<div class="manual-required">
			<div class="warning-icon" aria-hidden="true">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<p class="warning-text">
				Image files cannot be automatically processed. Please enter the check-in data manually.
			</p>
			<div class="action-buttons">
				{#if onManualEntry}
					<button type="button" class="btn btn-primary" onclick={handleManualEntry}>
						Enter Manually
					</button>
				{/if}
				<button type="button" class="btn btn-outline" onclick={clearFile}> Try PDF Instead </button>
			</div>
		</div>
	{:else if importState === 'error'}
		<!-- Error state -->
		<div class="error-state">
			<div class="error-icon" aria-hidden="true">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
			</div>
			{#if errorMessages.length > 0}
				<ul class="error-list" role="alert">
					{#each errorMessages as message, i (i)}
						<li>{message}</li>
					{/each}
				</ul>
			{/if}
			<div class="action-buttons">
				<button type="button" class="btn btn-outline" onclick={handleRetry}> Try Again </button>
				{#if onManualEntry}
					<button type="button" class="btn btn-primary" onclick={handleManualEntry}>
						Enter Manually
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Upload area -->
		<div
			class="upload-area"
			class:drag-over={isDragOver}
			class:has-file={hasFile}
			role="region"
			aria-label="File upload drop zone"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			{#if selectedFile}
				<div class="selected-file">
					<div class="file-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
					</div>
					<span class="file-name">{selectedFile.name}</span>
					<button type="button" class="clear-file" onclick={clearFile} aria-label="Remove file">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			{:else}
				<div class="upload-icon" aria-hidden="true">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
						/>
					</svg>
				</div>
				<p class="upload-text" id="upload-instructions">
					Drag and drop your check-in report (PDF), or
				</p>
				<label class="btn btn-outline file-select-btn">
					<span>Choose File</span>
					<input
						bind:this={fileInputRef}
						type="file"
						accept=".pdf,application/pdf,image/png,image/jpeg"
						class="visually-hidden"
						onchange={handleFileSelect}
						aria-describedby="upload-instructions"
					/>
				</label>
				<p class="file-hint">Accepts PDF files. Images (PNG, JPEG) require manual entry.</p>
			{/if}
		</div>
	{/if}

	<!-- Warning messages -->
	{#if warningMessages.length > 0 && importState !== 'manual-required'}
		<div class="warning-message" role="status">
			{#each warningMessages as message, i (i)}
				<p>{message}</p>
			{/each}
		</div>
	{/if}

	<!-- Confidence indicator for successful extraction -->
	{#if importState === 'success' && extractionResult}
		<div
			class="confidence-indicator"
			class:high={extractionResult.confidence === 'high'}
			class:medium={extractionResult.confidence === 'medium'}
			class:low={extractionResult.confidence === 'low'}
		>
			<span class="confidence-dot" aria-hidden="true"></span>
			{confidenceLabel} extraction from {extractionResult.source}
		</div>
	{/if}
</div>

<style>
	.import-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.upload-area {
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		text-align: center;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.upload-area:has(.file-select-btn:focus-within) {
		border-color: var(--color-primary);
		background-color: var(--color-bg-subtle);
	}

	.upload-area.drag-over {
		border-color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.upload-area.has-file {
		border-style: solid;
		background-color: var(--color-bg-subtle);
	}

	.upload-icon {
		color: var(--color-gray-400);
		margin-bottom: var(--space-4);
	}

	.upload-text {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.file-hint {
		margin-top: var(--space-3);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.file-select-btn {
		cursor: pointer;
	}

	.selected-file {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.file-icon {
		color: var(--color-primary);
	}

	.file-name {
		font-weight: 500;
		color: var(--color-text);
		word-break: break-all;
	}

	.clear-file {
		background: none;
		border: none;
		padding: var(--space-1);
		cursor: pointer;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.clear-file:hover {
		color: var(--color-text);
		background-color: var(--color-gray-200);
	}

	.processing-state {
		text-align: center;
		padding: var(--space-8);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-lg);
	}

	.processing-state p {
		margin-top: var(--space-4);
		color: var(--color-text-muted);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-gray-200);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		margin: 0 auto;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.import-success {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		background-color: rgba(0, 89, 76, 0.05);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-lg);
	}

	.success-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-primary);
		font-weight: 500;
	}

	.manual-required,
	.error-state {
		text-align: center;
		padding: var(--space-6);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-lg);
	}

	.warning-icon {
		color: var(--color-yellow-600, #ca8a04);
		margin-bottom: var(--space-3);
	}

	.warning-text {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.error-icon {
		color: #dc2626;
		margin-bottom: var(--space-3);
	}

	.error-list {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-4) 0;
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.error-list li {
		margin-bottom: var(--space-1);
	}

	.action-buttons {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}

	.warning-message {
		padding: var(--space-3);
		background-color: #fef3c7;
		border: 1px solid #fcd34d;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		color: #92400e;
	}

	.warning-message p {
		margin: 0;
	}

	.confidence-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.confidence-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.confidence-indicator.high .confidence-dot {
		background-color: var(--color-primary);
	}

	.confidence-indicator.medium .confidence-dot {
		background-color: #ca8a04;
	}

	.confidence-indicator.low .confidence-dot {
		background-color: #dc2626;
	}

	.visually-hidden {
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

	.btn-sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--font-size-sm);
	}
</style>
