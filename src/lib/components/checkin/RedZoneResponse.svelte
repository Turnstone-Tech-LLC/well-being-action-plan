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
		onComplete: () => void;
	}

	let { crisisResources = [], supportiveAdults, onComplete }: Props = $props();

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

	function handleComplete() {
		announce('Check-in saved. You did the right thing by reaching out.');
		onComplete();
	}

	function getContactHref(adult: SupportiveAdult): string | null {
		const contact = adult.contactInfo.trim();
		if (!contact) return null;

		// Check if it looks like a phone number
		const phoneMatch = contact.match(/[\d\-+() ]{7,}/);
		if (phoneMatch) {
			const cleaned = phoneMatch[0].replace(/[\s\-()]/g, '');
			return `tel:${cleaned}`;
		}

		// Check if it looks like an email
		if (contact.includes('@')) {
			return `mailto:${contact}`;
		}

		return null;
	}

	function getContactIcon(adult: SupportiveAdult): 'phone' | 'email' | null {
		const contact = adult.contactInfo.trim();
		if (!contact) return null;

		if (contact.match(/[\d\-+() ]{7,}/)) return 'phone';
		if (contact.includes('@')) return 'email';
		return null;
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
				<h2 id="adults-heading" class="section-title">Or reach out to your supportive adult:</h2>
				<ul class="adults-list" role="list">
					{#each sortedAdults as adult (adult.id)}
						{@const href = getContactHref(adult)}
						{@const icon = getContactIcon(adult)}
						<li class="adult-item">
							<div class="adult-info">
								<span class="adult-name">
									{adult.name}
									{#if adult.isPrimary}
										<span class="primary-badge" aria-label="Primary contact">Primary</span>
									{/if}
								</span>
								<span class="adult-type">{adult.typeDescription || adult.type}</span>
								{#if adult.contactInfo}
									<span class="adult-contact">{adult.contactInfo}</span>
								{/if}
							</div>
							{#if href}
								<a {href} class="contact-action" aria-label="Contact {adult.name}">
									{#if icon === 'phone'}
										<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
											<path
												d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
											/>
										</svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
											<path
												d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
											/>
										</svg>
									{/if}
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

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

	/* Supportive Adults */
	.adults-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.adult-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		transition: border-color 0.15s ease;
	}

	.adult-item:hover {
		border-color: var(--color-gray-300);
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

	.adult-contact {
		font-size: var(--font-size-sm);
		color: var(--color-gray-600);
	}

	.contact-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		min-width: 44px;
		background-color: #c62828;
		border-radius: 50%;
		color: var(--color-white);
		transition:
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.contact-action:hover {
		background-color: #b71c1c;
		transform: scale(1.05);
	}

	.contact-action:focus-visible {
		outline: 3px solid #e57373;
		outline-offset: 2px;
	}

	.contact-action:active {
		transform: scale(0.95);
	}

	.contact-action svg {
		width: 20px;
		height: 20px;
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
		.adult-item,
		.contact-action,
		.complete-button {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.adult-item {
			padding: var(--space-4);
			min-height: 56px;
		}

		.contact-action {
			width: 48px;
			height: 48px;
			min-width: 48px;
		}

		.contact-action svg {
			width: 24px;
			height: 24px;
		}

		.complete-button {
			min-height: 56px;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.adult-item {
			border: 2px solid currentColor;
		}

		.contact-action {
			border: 2px solid currentColor;
		}

		.complete-button {
			border: 2px solid currentColor;
		}
	}
</style>
