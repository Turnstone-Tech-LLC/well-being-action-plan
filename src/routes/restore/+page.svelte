<svelte:head>
	<title>Restore Your Plan | Well-Being Action Plan</title>
	<meta name="description" content="Restore your Well-Being Action Plan from a backup" />
</svelte:head>

<section class="restore-page">
	<div class="container">
		<h1>Restore Your Plan</h1>
		<p class="description">
			Upload your encrypted backup file to restore your Well-Being Action Plan on this device.
		</p>

		<div class="upload-area">
			<div class="upload-icon">
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
			</div>
			<p class="upload-text">Drag and drop your backup file here, or</p>
			<label class="btn btn-primary">
				Choose File
				<input type="file" accept=".json,.wbap" class="visually-hidden" />
			</label>
		</div>

		<div class="info-box">
			<h3>About Backup Files</h3>
			<p>
				Your backup file contains your encrypted Well-Being Action Plan data. You'll need your
				recovery passphrase to decrypt and restore your plan.
			</p>
		</div>
	</div>
</section>

<style>
	.restore-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
	}

	.container {
		max-width: 32rem;
		width: 100%;
	}

	h1 {
		color: var(--color-primary);
		text-align: center;
		margin-bottom: var(--space-4);
	}

	.description {
		text-align: center;
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}

	.upload-area {
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		padding: var(--space-10);
		text-align: center;
		margin-bottom: var(--space-8);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.upload-area:hover {
		border-color: var(--color-primary);
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

	.info-box {
		background-color: var(--color-bg-subtle);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
	}

	.info-box h3 {
		font-size: var(--font-size-lg);
		color: var(--color-primary);
		margin-bottom: var(--space-2);
	}

	.info-box p {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
