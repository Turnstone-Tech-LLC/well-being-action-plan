<script lang="ts">
	import { generateA11yId } from '$lib/a11y';

	interface Props {
		patientNickname: string;
		onContinue: () => void;
		onNicknameChange: (value: string) => void;
	}

	let { patientNickname, onContinue, onNicknameChange }: Props = $props();

	// Local state for the input
	let nickname = $state(patientNickname);

	// ID for accessibility
	const nicknameDescId = generateA11yId('nickname-desc');

	// Sync changes to parent
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		nickname = target.value;
		onNicknameChange(nickname);
	}

	function handleContinue() {
		onContinue();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleContinue();
		}
	}
</script>

<div class="basic-info-step">
	<div class="step-header">
		<h2>Create Action Plan</h2>
		<p class="step-description">
			Start by adding a nickname for this patient. This is for your reference only and won't be
			visible on the action plan.
		</p>
	</div>

	<div class="form-content">
		<div class="form-group">
			<label for="patient-nickname" class="form-label">
				Patient Nickname
				<span class="optional">(optional)</span>
			</label>
			<input
				type="text"
				id="patient-nickname"
				value={nickname}
				oninput={handleInput}
				onkeydown={handleKeydown}
				class="form-input"
				aria-describedby={nicknameDescId}
				placeholder="e.g., Emma R."
				maxlength="100"
			/>
			<p id={nicknameDescId} class="help-text">
				A short identifier to help you recognize this action plan later.
			</p>
		</div>
	</div>

	<div class="step-actions">
		<a href="/provider" class="btn btn-outline">Cancel</a>
		<button type="button" class="btn btn-primary" onclick={handleContinue}>
			Continue
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
				/>
			</svg>
		</button>
	</div>
</div>

<style>
	.basic-info-step {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.step-header {
		text-align: center;
	}

	.step-header h2 {
		margin-bottom: var(--space-2);
	}

	.step-description {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
		max-width: 32rem;
		margin: 0 auto;
	}

	.form-content {
		max-width: 24rem;
		margin: 0 auto;
		width: 100%;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-weight: 500;
		color: var(--color-text);
		font-size: var(--font-size-sm);
	}

	.optional {
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.form-input {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-input::placeholder {
		color: var(--color-gray-400);
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.help-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.step-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		padding-top: var(--space-4);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		font-weight: 500;
		font-size: var(--font-size-base);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}

		.form-input {
			min-height: 44px;
		}
	}
</style>
