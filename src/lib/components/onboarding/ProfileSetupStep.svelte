<script lang="ts">
	import { generateA11yId } from '$lib/a11y';

	interface Props {
		initialName?: string;
		onContinue: (displayName: string) => void;
		onBack?: () => void;
	}

	let { initialName = '', onContinue, onBack }: Props = $props();

	let displayName = $state(initialName);
	let inputError = $state('');
	let inputTouched = $state(false);

	const inputId = generateA11yId('display-name');
	const errorId = generateA11yId('display-name-error');
	const helpId = generateA11yId('display-name-help');

	function validateName(name: string): string {
		const trimmed = name.trim();
		if (!trimmed) {
			return 'Please enter a name or nickname';
		}
		if (trimmed.length > 50) {
			return 'Name must be 50 characters or less';
		}
		return '';
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		displayName = target.value;
		if (inputTouched) {
			inputError = validateName(displayName);
		}
	}

	function handleBlur() {
		inputTouched = true;
		inputError = validateName(displayName);
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		inputTouched = true;
		const error = validateName(displayName);
		inputError = error;

		if (!error) {
			onContinue(displayName.trim());
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit(event);
		}
	}
</script>

<div class="profile-setup-step">
	<div class="header">
		<div class="icon" aria-hidden="true">
			<svg
				width="64"
				height="64"
				viewBox="0 0 64 64"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" fill="none" />
				<circle cx="32" cy="24" r="8" stroke="currentColor" stroke-width="2" fill="none" />
				<path
					d="M16 48c0-8.8 7.2-16 16-16s16 7.2 16 16"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</div>
		<h1>Let's personalize your experience</h1>
	</div>

	<form class="profile-form" onsubmit={handleSubmit}>
		<div class="form-group">
			<label for={inputId} class="form-label"> What should we call you? </label>
			<input
				type="text"
				id={inputId}
				class="form-input"
				class:has-error={inputError && inputTouched}
				placeholder="First name or nickname"
				value={displayName}
				oninput={handleInput}
				onblur={handleBlur}
				onkeydown={handleKeyDown}
				aria-describedby="{helpId} {inputError ? errorId : ''}"
				aria-invalid={inputError && inputTouched ? 'true' : undefined}
				autocomplete="given-name"
				maxlength="50"
			/>
			{#if inputError && inputTouched}
				<p id={errorId} class="form-error" role="alert">
					{inputError}
				</p>
			{/if}
			<p id={helpId} class="form-help">This is how you'll be greeted on your dashboard.</p>
		</div>

		<div class="privacy-note" role="note">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" />
				<path
					d="M7 11V7a5 5 0 0 1 10 0v4"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<span>This stays on your device and is just for you.</span>
		</div>

		<div class="button-group">
			{#if onBack}
				<button type="button" class="btn btn-outline back-btn" onclick={onBack}> Back </button>
			{/if}
			<button type="submit" class="btn btn-primary continue-btn" disabled={!displayName.trim()}>
				Continue
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M5 12h14M12 5l7 7-7 7"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	</form>
</div>

<style>
	.profile-setup-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-8) var(--space-4);
		max-width: 32rem;
		margin: 0 auto;
		text-align: center;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.icon {
		color: var(--color-primary);
	}

	h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		line-height: 1.3;
	}

	.profile-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-align: left;
	}

	.form-label {
		font-size: var(--font-size-lg);
		font-weight: 500;
		color: var(--color-gray-800);
	}

	.form-input {
		padding: var(--space-4);
		font-size: var(--font-size-lg);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input.has-error {
		border-color: #dc2626;
	}

	.form-input.has-error:focus {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.form-input::placeholder {
		color: var(--color-gray-400);
	}

	.form-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.form-help {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.privacy-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.privacy-note svg {
		flex-shrink: 0;
	}

	.button-group {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}

	.back-btn {
		min-width: 100px;
		padding: var(--space-4) var(--space-6);
	}

	.continue-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 180px;
		justify-content: center;
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
	}

	.continue-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		.profile-setup-step {
			padding: var(--space-6) var(--space-3);
		}

		h1 {
			font-size: var(--font-size-xl);
		}

		.button-group {
			flex-direction: column-reverse;
			width: 100%;
		}

		.back-btn,
		.continue-btn {
			width: 100%;
		}
	}
</style>
