<script lang="ts">
	interface Props {
		/** Display label for the button */
		label: string;
		/** Secondary description text */
		description?: string;
		/** The contact value (phone number or short code) */
		contact: string;
		/** Type of contact: 'call' or 'text' */
		contactType: 'call' | 'text';
		/** Icon to display: 'phone' or 'message' */
		icon?: 'phone' | 'message';
	}

	let {
		label,
		description,
		contact,
		contactType,
		icon = contactType === 'call' ? 'phone' : 'message'
	}: Props = $props();

	const href = $derived(contactType === 'call' ? `tel:${contact}` : `sms:${contact}`);
</script>

<a {href} class="crisis-button" aria-label="{contactType === 'call' ? 'Call' : 'Text'} {label}">
	<span class="button-icon" aria-hidden="true">
		{#if icon === 'phone'}
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
				/>
			</svg>
		{/if}
	</span>
	<span class="button-content">
		<span class="button-label">{label}</span>
		{#if description}
			<span class="button-description">{description}</span>
		{/if}
	</span>
</a>

<style>
	.crisis-button {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
		border: 2px solid #ef9a9a;
		border-radius: var(--radius-xl);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		cursor: pointer;
		min-height: 80px;
	}

	.crisis-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: #e57373;
	}

	.crisis-button:focus-visible {
		outline: 3px solid #e57373;
		outline-offset: 2px;
	}

	.crisis-button:active {
		transform: scale(0.98);
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		min-width: 48px;
		background-color: #c62828;
		border-radius: 50%;
		color: var(--color-white);
	}

	.button-icon svg {
		width: 24px;
		height: 24px;
	}

	.button-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		text-align: left;
	}

	.button-label {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: #c62828;
	}

	.button-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.crisis-button {
			min-height: 88px;
			padding: var(--space-5);
		}

		.button-icon {
			width: 56px;
			height: 56px;
			min-width: 56px;
		}

		.button-icon svg {
			width: 28px;
			height: 28px;
		}
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.crisis-button {
			padding: var(--space-4);
		}

		.button-label {
			font-size: var(--font-size-lg);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.crisis-button {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.crisis-button {
			border: 2px solid currentColor;
		}

		.button-icon {
			border: 2px solid currentColor;
		}
	}
</style>
