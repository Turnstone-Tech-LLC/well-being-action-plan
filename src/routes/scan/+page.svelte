<script lang="ts">
	import { goto } from '$app/navigation';

	let accessCode = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (accessCode.trim()) {
			goto(`/access/${encodeURIComponent(accessCode.trim())}`);
		}
	}
</script>

<svelte:head>
	<title>Load Your Plan | Well-Being Action Plan</title>
	<meta name="description" content="Enter your access code to load your Well-Being Action Plan" />
</svelte:head>

<section class="scan-page">
	<div class="container">
		<h1>Load Your Plan</h1>

		<div class="scanner-placeholder">
			<div class="camera-icon">
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
						d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
					/>
					<circle cx="12" cy="13" r="4" />
				</svg>
			</div>
			<p>QR scanner coming soon</p>
		</div>

		<div class="divider">
			<span>or enter your code</span>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="access-code">Access Code</label>
				<input
					type="text"
					id="access-code"
					bind:value={accessCode}
					placeholder="Enter your access code"
					autocomplete="off"
				/>
			</div>
			<button type="submit" class="btn btn-primary" disabled={!accessCode.trim()}>
				Load My Plan
			</button>
		</form>
	</div>
</section>

<style>
	.scan-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
	}

	.container {
		max-width: 24rem;
		width: 100%;
		text-align: center;
	}

	h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-8);
	}

	.scanner-placeholder {
		background-color: var(--color-bg-subtle);
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		padding: var(--space-10);
		margin-bottom: var(--space-6);
	}

	.camera-icon {
		color: var(--color-gray-400);
		margin-bottom: var(--space-3);
	}

	.scanner-placeholder p {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.divider {
		display: flex;
		align-items: center;
		margin-bottom: var(--space-6);
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--color-gray-300);
	}

	.divider span {
		padding: 0 var(--space-4);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	form {
		text-align: left;
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: var(--space-2);
		color: var(--color-text);
	}

	.form-group input {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	form .btn {
		width: 100%;
	}

	form .btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
