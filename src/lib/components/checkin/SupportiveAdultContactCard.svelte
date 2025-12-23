<script lang="ts">
	interface SupportiveAdult {
		id: string;
		name: string;
		type: string;
		typeDescription?: string;
		contactInfo: string;
		isPrimary: boolean;
	}

	interface Props {
		adults: SupportiveAdult[];
		selectedAdultId?: string | null;
		onSelect: (adultId: string | null) => void;
		optional?: boolean;
		/** Color variant: 'green' | 'yellow' | 'red' */
		variant?: 'green' | 'yellow' | 'red';
		/** Section heading text */
		heading?: string;
	}

	let {
		adults,
		selectedAdultId = null,
		onSelect,
		optional = false,
		variant = 'green',
		heading = 'Talk to a supportive adult'
	}: Props = $props();

	// Sort adults with primary first
	const sortedAdults = $derived(
		[...adults].sort((a, b) => {
			if (a.isPrimary && !b.isPrimary) return -1;
			if (!a.isPrimary && b.isPrimary) return 1;
			return 0;
		})
	);

	function getPhoneNumber(contactInfo: string): string | null {
		const phoneMatch = contactInfo.match(/[\d\-+() ]{7,}/);
		if (phoneMatch) {
			return phoneMatch[0].replace(/[\s\-()]/g, '');
		}
		return null;
	}

	function handleSelectAdult(adultId: string) {
		if (selectedAdultId === adultId) {
			onSelect(null);
		} else {
			onSelect(adultId);
		}
	}
</script>

{#if sortedAdults.length > 0}
	<section class="supportive-adult-section variant-{variant}" aria-labelledby="adults-heading">
		<h2 id="adults-heading" class="section-title">{heading}</h2>
		{#if optional}
			<p class="section-hint">Optional - you can skip this step</p>
		{/if}
		<div class="adults-select-list" role="group" aria-label="Select a supportive adult to contact">
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
								Call {adult.name}
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
								Message {adult.name}
							</a>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.supportive-adult-section {
		margin-bottom: var(--space-6);
	}

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-gray-900);
		margin: 0 0 var(--space-2) 0;
	}

	.section-hint {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0 0 var(--space-3) 0;
	}

	/* Variant colors for section title */
	.variant-green .section-title {
		color: #2e7d32;
	}

	.variant-yellow .section-title {
		color: #f57f17;
	}

	.variant-red .section-title {
		color: #c62828;
	}

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

	/* Variant colors for selected state */
	.variant-green .adult-select-card.selected {
		border-color: #2e7d32;
		background-color: #e8f5e9;
	}

	.variant-yellow .adult-select-card.selected {
		border-color: #f9a825;
		background-color: #fffde7;
	}

	.variant-red .adult-select-card.selected {
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
		outline: 3px solid var(--color-accent);
		outline-offset: -3px;
	}

	/* Variant focus colors */
	.variant-green .adult-select-button:focus-visible {
		outline-color: #66bb6a;
	}

	.variant-yellow .adult-select-button:focus-visible {
		outline-color: #f9a825;
	}

	.variant-red .adult-select-button:focus-visible {
		outline-color: #e57373;
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

	/* Variant colors for selected indicator */
	.variant-green .adult-select-card.selected .select-indicator {
		border-color: #2e7d32;
		background-color: #2e7d32;
	}

	.variant-yellow .adult-select-card.selected .select-indicator {
		border-color: #f9a825;
		background-color: #f9a825;
	}

	.variant-red .adult-select-card.selected .select-indicator {
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
		border-radius: var(--radius-full, 9999px);
	}

	/* Variant colors for primary badge */
	.variant-green .primary-badge {
		background-color: #e8f5e9;
		color: #2e7d32;
	}

	.variant-yellow .primary-badge {
		background-color: #fff9c4;
		color: #92400e;
	}

	.variant-red .primary-badge {
		background-color: #ffebee;
		color: #c62828;
	}

	.adult-type {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Contact Actions */
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

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.adult-select-card,
		.select-indicator,
		.contact-action-btn {
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
	}
</style>
