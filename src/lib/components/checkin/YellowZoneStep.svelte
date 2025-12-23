<script lang="ts">
	import { announce } from '$lib/a11y';

	interface SupportiveAdult {
		id: string;
		name: string;
		type: string;
		typeDescription?: string;
		contactInfo: string;
		isPrimary: boolean;
	}

	interface HelpMethod {
		id: string;
		title: string;
		description: string;
	}

	interface Skill {
		id: string;
		title: string;
		description: string;
		category: string;
	}

	interface Props {
		adults: SupportiveAdult[];
		helpMethods: HelpMethod[];
		skills: Skill[];
		onComplete: (
			selectedAdultIds: string[],
			selectedMethodIds: string[],
			feelingNotes?: string,
			customHelpRequest?: string,
			contactedAdultId?: string,
			contactedAdultName?: string,
			greenSkillsShown?: string[]
		) => void;
	}

	let { adults, helpMethods, skills, onComplete }: Props = $props();

	// State
	let feelingNotes: string = $state('');
	let customHelpRequest: string = $state('');
	let selectedAdultId: string | null = $state(null);
	let selectedMethodIds: string[] = $state([]);
	let selectedSkillIds: string[] = $state([]);

	// Sort adults with primary first
	const sortedAdults = $derived(
		[...adults].sort((a, b) => {
			if (a.isPrimary && !b.isPrimary) return -1;
			if (!a.isPrimary && b.isPrimary) return 1;
			return 0;
		})
	);

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

	function handleSelectAdult(adultId: string) {
		if (selectedAdultId === adultId) {
			selectedAdultId = null;
		} else {
			selectedAdultId = adultId;
		}
	}

	function handleToggleMethod(methodId: string) {
		if (selectedMethodIds.includes(methodId)) {
			selectedMethodIds = selectedMethodIds.filter((id) => id !== methodId);
		} else {
			selectedMethodIds = [...selectedMethodIds, methodId];
		}
	}

	function isMethodSelected(methodId: string): boolean {
		return selectedMethodIds.includes(methodId);
	}

	function handleToggleSkill(skillId: string) {
		if (selectedSkillIds.includes(skillId)) {
			selectedSkillIds = selectedSkillIds.filter((id) => id !== skillId);
		} else {
			selectedSkillIds = [...selectedSkillIds, skillId];
		}
	}

	function isSkillSelected(skillId: string): boolean {
		return selectedSkillIds.includes(skillId);
	}

	function handleDone() {
		const selectedAdult = getSelectedAdult();

		let message = 'Saving check-in';
		if (selectedAdult) {
			message += ` with ${selectedAdult.name} as your supportive adult`;
		}
		if (selectedMethodIds.length > 0) {
			message += ` and ${selectedMethodIds.length} help method${selectedMethodIds.length > 1 ? 's' : ''}`;
		}
		if (selectedSkillIds.length > 0) {
			message += ` and ${selectedSkillIds.length} coping skill${selectedSkillIds.length > 1 ? 's' : ''}`;
		}
		announce(message);

		onComplete(
			selectedAdult ? [selectedAdult.id] : [],
			selectedMethodIds,
			feelingNotes.trim() || undefined,
			customHelpRequest.trim() || undefined,
			selectedAdult?.id,
			selectedAdult?.name,
			selectedSkillIds.length > 0 ? selectedSkillIds : undefined
		);
	}
</script>

<div class="yellow-zone-step">
	<header class="step-header">
		<h1 class="step-title">It's okay to need support</h1>
		<p class="step-subtitle">Let's work through this together.</p>
	</header>

	<div class="step-content">
		<!-- Section 1: Feeling Notes -->
		<section class="section" aria-labelledby="feelings-heading">
			<h2 id="feelings-heading" class="section-title">I'm feeling this way because...</h2>
			<p class="section-description">
				My coping skills are not helping enough. I feel sad, upset, stressed, or worried most of the
				day, most days of the week.
			</p>
			<textarea
				id="feeling-notes"
				class="feeling-textarea"
				placeholder="Share what's been going on..."
				bind:value={feelingNotes}
				rows="4"
				aria-describedby="feeling-notes-hint"
			></textarea>
			<p id="feeling-notes-hint" class="hint-text">
				Optional - share as much or as little as you'd like
			</p>
		</section>

		<!-- Section 2: Continue with Green Zone Skills -->
		{#if skills.length > 0}
			<section class="section green-skills-section" aria-labelledby="green-skills-heading">
				<h2 id="green-skills-heading" class="section-title">Continue with your coping skills</h2>
				<p class="section-description">
					Remember, the Yellow Zone doesn't mean abandoning what works. Select which skills you
					used:
				</p>
				<div class="skills-list" role="group" aria-label="Select coping skills you used">
					{#each skills as skill (skill.id)}
						{@const selected = isSkillSelected(skill.id)}
						<button
							type="button"
							class="skill-item"
							class:selected
							onclick={() => handleToggleSkill(skill.id)}
							aria-pressed={selected}
						>
							<span class="skill-checkbox" aria-hidden="true">
								{#if selected}
									<svg viewBox="0 0 24 24" fill="currentColor">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
									</svg>
								{/if}
							</span>
							<span class="skill-title">{skill.title}</span>
						</button>
					{/each}
				</div>
				{#if selectedSkillIds.length > 0}
					<p class="selection-count">
						{selectedSkillIds.length} skill{selectedSkillIds.length === 1 ? '' : 's'} selected
					</p>
				{/if}
			</section>
		{/if}

		<!-- Section 3: Ask for Help -->
		<section class="section ask-help-section" aria-labelledby="ask-help-heading">
			<h2 id="ask-help-heading" class="section-title">
				When I feel this way, I will continue my coping skills above, check in with my supportive
				adult, and ask for:
			</h2>

			{#if helpMethods.length > 0}
				<div class="help-methods-list" role="group" aria-label="Select help you're asking for">
					{#each helpMethods as method (method.id)}
						{@const selected = isMethodSelected(method.id)}
						<button
							type="button"
							class="help-method-item"
							class:selected
							onclick={() => handleToggleMethod(method.id)}
							aria-pressed={selected}
						>
							<span class="help-checkbox" aria-hidden="true">
								{#if selected}
									<svg viewBox="0 0 24 24" fill="currentColor">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
									</svg>
								{/if}
							</span>
							<span class="help-text">{method.title}</span>
						</button>
					{/each}
				</div>
				{#if selectedMethodIds.length > 0}
					<p class="selection-count">
						{selectedMethodIds.length} type{selectedMethodIds.length === 1 ? '' : 's'} of help selected
					</p>
				{/if}
			{/if}

			<div class="custom-ask-container">
				<label for="custom-help-request" class="custom-ask-label">
					Today, I specifically want to ask for help with...
				</label>
				<input
					type="text"
					id="custom-help-request"
					class="custom-ask-input"
					placeholder="What's one thing you need help with right now?"
					bind:value={customHelpRequest}
					maxlength="200"
				/>
				<p class="hint-text">Optional - this helps your supportive adult know what you need</p>
			</div>
		</section>

		<!-- Section 4: Supportive Adult Selection with Contact Actions -->
		{#if sortedAdults.length > 0}
			<section class="section adults-section" aria-labelledby="adults-heading">
				<h2 id="adults-heading" class="section-title">Check in with your supportive adult</h2>
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

		<p class="encouragement">Remember, your supportive adult wants to help.</p>
	</div>

	<footer class="step-footer">
		<button type="button" class="done-button" onclick={handleDone}> I've reached out </button>
	</footer>
</div>

<style>
	.yellow-zone-step {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--nav-height) - 120px);
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.step-header {
		text-align: center;
		margin-bottom: var(--space-6);
		padding: var(--space-4);
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
		border-radius: var(--radius-xl);
		border: 2px solid #ffca28;
	}

	.step-title {
		font-size: var(--font-size-2xl);
		color: #f57f17;
		margin: 0 0 var(--space-2) 0;
	}

	.step-subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		margin: 0;
	}

	.step-content {
		flex: 1;
		margin-bottom: var(--space-6);
	}

	.section {
		margin-bottom: var(--space-6);
	}

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-gray-900);
		margin: 0 0 var(--space-1) 0;
	}

	.section-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
	}

	/* Feeling Notes */
	.feeling-textarea {
		width: 100%;
		padding: var(--space-3);
		font-size: var(--font-size-base);
		font-family: inherit;
		color: var(--color-text);
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		resize: vertical;
		min-height: 100px;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.feeling-textarea:focus {
		outline: none;
		border-color: #ffca28;
		box-shadow: 0 0 0 3px rgba(255, 202, 40, 0.2);
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

	/* Green Skills Section */
	.green-skills-section {
		padding: var(--space-4);
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		border-radius: var(--radius-lg);
		border: 2px solid #81c784;
	}

	.green-skills-section .section-title {
		color: #2e7d32;
	}

	.skills-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.skill-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border-radius: var(--radius-md);
		border: 2px solid var(--color-gray-300);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.skill-item:hover {
		border-color: #81c784;
	}

	.skill-item:focus-visible {
		outline: 3px solid #81c784;
		outline-offset: 2px;
	}

	.skill-item.selected {
		border-color: #2e7d32;
		background-color: #e8f5e9;
	}

	.skill-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		min-width: 20px;
		border: 2px solid var(--color-gray-300);
		border-radius: 4px;
		background-color: var(--color-white);
		color: var(--color-white);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.skill-item.selected .skill-checkbox {
		border-color: #2e7d32;
		background-color: #2e7d32;
	}

	.skill-checkbox svg {
		width: 14px;
		height: 14px;
	}

	.skill-title {
		font-size: var(--font-size-sm);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	/* Ask for Help Section */
	.ask-help-section {
		padding: var(--space-4);
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
		border-radius: var(--radius-lg);
		border: 2px solid #ffca28;
	}

	.ask-help-section .section-title {
		color: #f57f17;
		font-size: var(--font-size-base);
		font-weight: 600;
		line-height: 1.5;
	}

	.help-methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.help-method-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border-radius: var(--radius-md);
		border: 2px solid var(--color-gray-300);
		cursor: pointer;
		text-align: left;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.help-method-item:hover {
		border-color: #ffca28;
	}

	.help-method-item:focus-visible {
		outline: 3px solid #f9a825;
		outline-offset: 2px;
	}

	.help-method-item.selected {
		border-color: #f9a825;
		background-color: #fffde7;
	}

	.help-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		min-width: 20px;
		border: 2px solid var(--color-gray-300);
		border-radius: 4px;
		background-color: var(--color-white);
		color: var(--color-white);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.help-method-item.selected .help-checkbox {
		border-color: #f9a825;
		background-color: #f9a825;
	}

	.help-checkbox svg {
		width: 14px;
		height: 14px;
	}

	.help-text {
		font-size: var(--font-size-sm);
		color: var(--color-gray-800);
	}

	.selection-count {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0 0;
		font-style: italic;
	}

	.custom-ask-container {
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px dashed #ffca28;
	}

	.custom-ask-label {
		display: block;
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: #92400e;
		margin-bottom: var(--space-2);
	}

	.custom-ask-input {
		width: 100%;
		padding: var(--space-3);
		font-size: var(--font-size-base);
		font-family: inherit;
		color: var(--color-text);
		background-color: var(--color-white);
		border: 2px solid #ffca28;
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.custom-ask-input:focus {
		outline: none;
		border-color: #f9a825;
		box-shadow: 0 0 0 3px rgba(249, 168, 37, 0.2);
	}

	.custom-ask-input::placeholder {
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Supportive Adults */
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
		border-color: #f9a825;
		background-color: #fffde7;
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
		outline: 3px solid #f9a825;
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
		border-color: #f9a825;
		background-color: #f9a825;
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
		background-color: #fff9c4;
		color: #92400e;
		border-radius: var(--radius-full, 9999px);
	}

	.adult-type {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Contact Actions (same style as red zone) */
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

	.encouragement {
		text-align: center;
		font-size: var(--font-size-base);
		color: #f57f17;
		font-style: italic;
		padding: var(--space-4);
		background: #fffde7;
		border-radius: var(--radius-lg);
		margin-top: var(--space-4);
	}

	.step-footer {
		display: flex;
		justify-content: center;
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

	.done-button {
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-white);
		background-color: #f9a825;
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		min-width: 200px;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.done-button:hover {
		background-color: #f57f17;
		box-shadow: var(--shadow-md);
	}

	.done-button:focus-visible {
		outline: 3px solid #f9a825;
		outline-offset: 2px;
	}

	.done-button:active {
		transform: scale(0.98);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.yellow-zone-step {
			padding: var(--space-4) var(--space-3);
		}

		.step-title {
			font-size: var(--font-size-xl);
		}

		.done-button {
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
		.custom-ask-input,
		.done-button {
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

		.done-button {
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

		.done-button {
			border: 2px solid currentColor;
		}
	}
</style>
