<script lang="ts">
	import { announce } from '$lib/a11y';
	import CrisisButton from './CrisisButton.svelte';

	interface CrisisResource {
		id: string;
		name: string;
		contact: string;
		contactType: string;
		description: string;
	}

	interface SupportiveAdult {
		id: string;
		name: string;
		type: string;
		typeDescription?: string;
		contactInfo: string;
		isPrimary: boolean;
	}

	interface Props {
		crisisResources?: CrisisResource[];
		supportiveAdults: SupportiveAdult[];
		onComplete: (
			feelingNotes?: string,
			contactedAdultId?: string,
			contactedAdultName?: string
		) => void;
	}

	let { crisisResources = [], supportiveAdults, onComplete }: Props = $props();

	// State for feeling notes and selected adult
	let feelingNotes: string = $state('');
	let selectedAdultId: string | null = $state(null);

	// Default crisis resources if none provided
	const defaultCrisisResources: CrisisResource[] = [
		{
			id: 'default-988',
			name: 'Call 988',
			contact: '988',
			contactType: 'call',
			description: 'National Suicide Prevention Lifeline'
		},
		{
			id: 'default-741741',
			name: 'Text 741741',
			contact: '741741',
			contactType: 'text',
			description: 'Crisis Text Line'
		}
	];

	const effectiveCrisisResources = $derived(
		crisisResources.length > 0 ? crisisResources : defaultCrisisResources
	);

	// Sort adults with primary first
	const sortedAdults = $derived(
		[...supportiveAdults].sort((a, b) => {
			if (a.isPrimary && !b.isPrimary) return -1;
			if (!a.isPrimary && b.isPrimary) return 1;
			return 0;
		})
	);

	function handleSelectAdult(adultId: string) {
		if (selectedAdultId === adultId) {
			selectedAdultId = null;
		} else {
			selectedAdultId = adultId;
		}
	}

	function getSelectedAdult(): SupportiveAdult | null {
		if (!selectedAdultId) return null;
		return sortedAdults.find((a) => a.id === selectedAdultId) ?? null;
	}

	function getPhoneNumber(contactInfo: string): string | null {
		const phoneMatch = contactInfo.match(/[\d\-+() ]{7,}/);
		if (phoneMatch) {
			return phoneMatch[0].replace(/[\s\-()]/g, '');
		}
		return null;
	}

	function handleComplete() {
		const selectedAdult = getSelectedAdult();
		announce('Check-in saved. You did the right thing by reaching out.');
		onComplete(feelingNotes.trim() || undefined, selectedAdult?.id, selectedAdult?.name);
	}
</script>

<div class="red-zone-response" role="main" aria-labelledby="response-heading">
	<header class="response-header">
		<h1 id="response-heading" class="response-title">You're not alone</h1>
		<p class="response-subtitle">Help is available right now.</p>
	</header>

	<div class="response-content">
		<!-- Crisis Resources Section -->
		<section class="section crisis-section" aria-labelledby="crisis-heading">
			<h2 id="crisis-heading" class="visually-hidden">Crisis Resources</h2>
			<div class="crisis-buttons">
				{#each effectiveCrisisResources as resource (resource.id)}
					<CrisisButton
						label={resource.name}
						description={resource.description}
						contact={resource.contact}
						contactType={resource.contactType === 'text' ? 'text' : 'call'}
						icon={resource.contactType === 'text' ? 'message' : 'phone'}
					/>
				{/each}
			</div>
		</section>

		<!-- Supportive Adults Section -->
		{#if sortedAdults.length > 0}
			<section class="section adults-section" aria-labelledby="adults-heading">
				<h2 id="adults-heading" class="section-title">Who are you reaching out to?</h2>
				<div
					class="adults-select-list"
					role="group"
					aria-label="Select a supportive adult to contact"
				>
					{#each sortedAdults as adult (adult.id)}
						{@const isSelected = selectedAdultId === adult.id}
						{@const phoneNumber = getPhoneNumber(adult.contactInfo)}
						<div class="adult-select-card" class:selected={isSelected}>
							<button
								type="button"
								class="adult-select-button"
								onclick={() => handleSelectAdult(adult.id)}
								aria-pressed={isSelected}
							>
								<span class="select-indicator" aria-hidden="true">
									{#if isSelected}
										<svg viewBox="0 0 24 24" fill="currentColor">
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									{/if}
								</span>
								<div class="adult-info">
									<span class="adult-name">
										{adult.name}
										{#if adult.isPrimary}
											<span class="primary-badge" aria-label="Primary contact">Primary</span>
										{/if}
									</span>
									<span class="adult-type">{adult.typeDescription || adult.type}</span>
								</div>
							</button>

							{#if isSelected && phoneNumber}
								<div class="contact-actions">
									<a
										href="tel:{phoneNumber}"
										class="contact-action-btn contact-action-call"
										aria-label="Call {adult.name}"
									>
										<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
											<path
												d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
											/>
										</svg>
										Call
									</a>
									<a
										href="sms:{phoneNumber}"
										class="contact-action-btn contact-action-message"
										aria-label="Message {adult.name}"
									>
										<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
											<path
												d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
											/>
										</svg>
										Message
									</a>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Feeling Notes Section (after crisis resources and adults) -->
		<section class="section feelings-section" aria-labelledby="feelings-heading">
			<h2 id="feelings-heading" class="section-title">What's going on?</h2>
			<label for="feeling-notes" class="feeling-label"> I'm feeling this way because... </label>
			<textarea
				id="feeling-notes"
				class="feeling-textarea"
				placeholder="It's okay to share what's on your mind..."
				bind:value={feelingNotes}
				rows="3"
				aria-describedby="feeling-notes-hint"
			></textarea>
			<p id="feeling-notes-hint" class="hint-text">Optional - getting help is what matters most</p>
		</section>

		<!-- Reassuring Message -->
		<div class="reassurance" aria-live="polite">
			<p class="reassurance-text">It takes courage to ask for help.</p>
			<p class="reassurance-text">Your feelings are valid, and support is here for you.</p>
		</div>
	</div>

	<footer class="response-footer">
		<button type="button" class="complete-button" onclick={handleComplete}>
			I've reached out
		</button>
		<a href="/app" class="secondary-action"> I'm okay now </a>
	</footer>
</div>

<style>
	.red-zone-response {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--nav-height) - 120px);
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.response-header {
		text-align: center;
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
		border-radius: var(--radius-xl);
		border: 2px solid #ef9a9a;
	}

	.response-title {
		font-size: var(--font-size-2xl);
		color: #c62828;
		margin: 0 0 var(--space-2) 0;
	}

	.response-subtitle {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin: 0;
	}

	.response-content {
		flex: 1;
		margin-bottom: var(--space-6);
	}

	.section {
		margin-bottom: var(--space-6);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-gray-700);
		margin: 0 0 var(--space-3) 0;
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
		border-width: 0;
	}

	/* Crisis Buttons */
	.crisis-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Supportive Adults - Selectable Cards */
	.adults-select-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.adult-select-card {
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color 0.15s ease;
	}

	.adult-select-card:hover {
		border-color: var(--color-gray-300);
	}

	.adult-select-card.selected {
		border-color: #c62828;
		background-color: #ffebee;
	}

	.adult-select-button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.adult-select-button:focus-visible {
		outline: 3px solid #e57373;
		outline-offset: -3px;
	}

	.select-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		min-width: 28px;
		border: 2px solid var(--color-gray-300);
		border-radius: 50%;
		background-color: var(--color-white);
		color: var(--color-white);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.adult-select-card.selected .select-indicator {
		border-color: #c62828;
		background-color: #c62828;
	}

	.select-indicator svg {
		width: 16px;
		height: 16px;
	}

	.adult-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.adult-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 500;
		color: var(--color-gray-900);
	}

	.primary-badge {
		font-size: var(--font-size-xs);
		font-weight: 600;
		padding: 2px 8px;
		background-color: #ffebee;
		color: #c62828;
		border-radius: var(--radius-full, 9999px);
	}

	.adult-type {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Contact Actions (Message/Call buttons) */
	.contact-actions {
		display: flex;
		gap: var(--space-3);
		padding: 0 var(--space-4) var(--space-4);
	}

	.contact-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		flex: 1;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.contact-action-btn svg {
		width: 18px;
		height: 18px;
	}

	.contact-action-call {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.contact-action-call:hover {
		background-color: #004d41;
	}

	.contact-action-message {
		background-color: var(--color-white);
		color: var(--color-primary);
		border: 2px solid var(--color-primary);
	}

	.contact-action-message:hover {
		background-color: var(--color-gray-50);
	}

	.contact-action-btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.contact-action-btn:active {
		transform: scale(0.98);
	}

	/* Feeling Notes */
	.feelings-section {
		background-color: var(--color-white);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-gray-200);
	}

	.feeling-label {
		display: block;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}

	.feeling-textarea {
		width: 100%;
		padding: var(--space-3);
		font-size: var(--font-size-base);
		font-family: inherit;
		color: var(--color-text);
		background-color: var(--color-gray-50);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		resize: vertical;
		min-height: 80px;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.feeling-textarea:focus {
		outline: none;
		border-color: #c62828;
		box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1);
		background-color: var(--color-white);
	}

	.feeling-textarea::placeholder {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.hint-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0 0;
		font-style: italic;
	}

	/* Reassurance */
	.reassurance {
		text-align: center;
		padding: var(--space-4);
		background: #fff8e1;
		border-radius: var(--radius-lg);
		border: 1px solid #ffe082;
	}

	.reassurance-text {
		font-size: var(--font-size-base);
		color: var(--color-gray-700);
		margin: 0;
		line-height: 1.6;
	}

	.reassurance-text + .reassurance-text {
		margin-top: var(--space-2);
	}

	/* Footer */
	.response-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) 0;
		position: sticky;
		bottom: 0;
		background: linear-gradient(
			to top,
			var(--color-gray-50) 0%,
			var(--color-gray-50) 60%,
			transparent 100%
		);
	}

	.complete-button {
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-white);
		background-color: #c62828;
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		min-width: 200px;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.complete-button:hover {
		background-color: #b71c1c;
		box-shadow: var(--shadow-md);
	}

	.complete-button:focus-visible {
		outline: 3px solid #e57373;
		outline-offset: 2px;
	}

	.complete-button:active {
		transform: scale(0.98);
	}

	.secondary-action {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		text-decoration: underline;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-2);
	}

	.secondary-action:hover {
		color: var(--color-gray-700);
	}

	.secondary-action:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.red-zone-response {
			padding: var(--space-4) var(--space-3);
		}

		.response-title {
			font-size: var(--font-size-xl);
		}

		.complete-button {
			width: 100%;
			max-width: 300px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.adult-select-card,
		.select-indicator,
		.contact-action-btn,
		.feeling-textarea,
		.complete-button {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.adult-select-button {
			min-height: 56px;
		}

		.select-indicator {
			width: 32px;
			height: 32px;
			min-width: 32px;
		}

		.select-indicator svg {
			width: 20px;
			height: 20px;
		}

		.contact-action-btn {
			min-height: 48px;
		}

		.complete-button {
			min-height: 56px;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.adult-select-card {
			border: 2px solid currentColor;
		}

		.adult-select-card.selected {
			outline: 3px solid highlight;
		}

		.select-indicator {
			border: 2px solid currentColor;
		}

		.contact-action-btn {
			border: 2px solid currentColor;
		}

		.complete-button {
			border: 2px solid currentColor;
		}
	}
</style>
