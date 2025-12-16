<script lang="ts">
	const sections = [
		{ id: 'what-is-wbap', label: 'What is WBAP?' },
		{ id: 'traffic-light', label: 'Traffic Light Framework' },
		{ id: 'who-is-it-for', label: 'Who is it for?' },
		{ id: 'privacy', label: 'Your Privacy' },
		{ id: 'history', label: 'History' }
	];
</script>

<svelte:head>
	<title>About | Well-Being Action Plan</title>
	<meta
		name="description"
		content="Learn about the Well-Being Action Plan, a conversation guide for school-aged youth about emotional well-being."
	/>
</svelte:head>

<div class="about-page">
	<aside class="section-nav">
		<nav aria-label="Page sections">
			<ul>
				{#each sections as section}
					<li>
						<a href="#{section.id}">{section.label}</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>

	<article class="content">
		<header class="page-header">
			<h1>About the Well-Being Action Plan</h1>
			<p class="lead">
				A conversation guide for school-aged youth about emotional well-being.
			</p>
		</header>

		<section id="what-is-wbap" class="section">
			<h2>What is the Well-Being Action Plan?</h2>
			<p>
				A conversation guide for school-aged youth about emotional well-being. It's not a
				diagnostic or screening tool — it helps identify coping skills and when to seek additional
				support.
			</p>
			<p>
				The WBAP is designed for time-limited settings like routine well-child visits. It gives
				youth and families an action-plan framework they can refer to after the visit.
			</p>
			<div class="callout callout-info">
				<strong>Important:</strong> Youth with positive mental health screens (PHQ-9, GAD-7, PSC-17)
				or who identify as being in the Yellow or Red Zone should complete a safety plan beyond WBAP.
				This tool is not intended for youth in acute distress.
			</div>
		</section>

		<section id="traffic-light" class="section">
			<h2>The Traffic Light Framework</h2>
			<p>
				The WBAP uses a traffic light metaphor to help youth identify how they're feeling and what
				support they might need.
			</p>

			<div class="zone zone-green">
				<h3>Green Zone — "I am feeling happy most of the day/week!"</h3>
				<p>
					Helps youth identify what it means to be happy and what they do to maintain their sense of
					well-being. This includes coping skills like movement, sleep, creative activities, and
					spending time with supportive people.
				</p>
				<p>
					The Green Zone also identifies supportive adults the patient can talk to when needed.
				</p>
			</div>

			<div class="zone zone-yellow">
				<h3>Yellow Zone — "Check In"</h3>
				<p class="zone-quote">
					"My coping skills are not helping enough. I feel sad, upset, stressed, or worried most of
					the day, most days of the week."
				</p>
				<p>
					Helps youth express what they want to happen when they're struggling to return to the
					Green Zone. Options include asking for help identifying emotions, learning more coping
					skills, or connecting with a counselor or doctor.
				</p>
			</div>

			<div class="zone zone-red">
				<h3>Red Zone — "Reach Out!"</h3>
				<p class="zone-quote">"I feel unsafe or am thinking about hurting myself."</p>
				<p>
					Provides crisis resources for immediate support. This is not a suicide safety plan — youth
					in this zone should ask for help right now from a supportive adult.
				</p>
				<div class="crisis-resources">
					<h4>Crisis Resources</h4>
					<ul>
						<li>
							<strong>Crisis Text Line:</strong>
							<a href="sms:741741">741741</a>
						</li>
						<li>
							<strong>National Suicide Prevention Line:</strong>
							<a href="tel:988">988</a>
						</li>
					</ul>
				</div>
			</div>
		</section>

		<section id="who-is-it-for" class="section">
			<h2>Who is it for?</h2>
			<ul class="feature-list">
				<li>School-aged children and teens during routine well-child visits</li>
				<li>Can also be used by providers and mentors in school settings</li>
				<li>
					Designed for collaborative completion — youth and provider work together to fill it out
				</li>
				<li>Plain language appropriate to the youth's age</li>
			</ul>
		</section>

		<section id="privacy" class="section">
			<h2>Your Privacy</h2>
			<ul class="feature-list">
				<li>Your action plan stays on your device</li>
				<li>No personal health information is stored on servers</li>
				<li>You control your data — clear it anytime with one tap</li>
				<li>Access codes let you reload your plan on a new device without creating an account</li>
			</ul>
		</section>

		<section id="history" class="section">
			<h2>History & Development</h2>
			<p>
				Developed by <strong>Dr. Andrea Green</strong> at Golisano Children's Hospital at the
				University of Vermont Medical Center.
			</p>
			<p>
				Refined with feedback from over 240 youth in Vermont and Washington DC who provided input on
				the tool's design and language.
			</p>
			<p>
				The WBAP creates an opportunity for providers to role-model effective communication for all
				family members present. It helps normalize discussions about mental health and can help
				caregivers identify their own coping skills too.
			</p>
		</section>

		<section class="section download-section">
			<h2>Download the Resource</h2>
			<p>Get a printable version of the Well-Being Action Plan card.</p>
			<a href="/WellBeing Action Plan 2.0.pdf" download class="btn btn-primary download-btn">
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
					aria-hidden="true"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7,10 12,15 17,10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download Well-Being Action Plan (PDF)
			</a>
		</section>
	</article>
</div>

<style>
	.about-page {
		display: grid;
		grid-template-columns: 1fr;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
		gap: var(--space-8);
	}

	@media (min-width: 768px) {
		.about-page {
			grid-template-columns: 200px 1fr;
			padding: var(--space-12) var(--space-4);
		}
	}

	/* Section Navigation */
	.section-nav {
		display: none;
	}

	@media (min-width: 768px) {
		.section-nav {
			display: block;
			position: sticky;
			top: calc(var(--nav-height) + var(--space-8));
			height: fit-content;
		}
	}

	.section-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.section-nav li {
		margin-bottom: var(--space-2);
	}

	.section-nav a {
		display: block;
		padding: var(--space-2) var(--space-3);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		border-left: 2px solid var(--color-gray-200);
		transition: all 0.15s ease;
	}

	.section-nav a:hover {
		color: var(--color-primary);
		border-left-color: var(--color-primary);
		text-decoration: none;
	}

	/* Content */
	.content {
		min-width: 0;
	}

	.page-header {
		margin-bottom: var(--space-12);
	}

	.page-header h1 {
		margin-bottom: var(--space-4);
	}

	.lead {
		font-size: var(--font-size-xl);
		color: var(--color-text-muted);
	}

	/* Sections */
	.section {
		margin-bottom: var(--space-12);
		scroll-margin-top: calc(var(--nav-height) + var(--space-4));
	}

	.section h2 {
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-2);
		border-bottom: 2px solid var(--color-gray-200);
	}

	.section p {
		margin-bottom: var(--space-4);
		max-width: 65ch;
	}

	/* Callout */
	.callout {
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		margin: var(--space-6) 0;
	}

	.callout-info {
		background-color: var(--color-gray-100);
		border-left: 4px solid var(--color-primary);
	}

	/* Traffic Light Zones */
	.zone {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-6);
	}

	.zone h3 {
		margin-bottom: var(--space-3);
	}

	.zone p:last-of-type {
		margin-bottom: 0;
	}

	.zone-quote {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.zone-green {
		background-color: #e8f5e9;
		border-left: 4px solid #2e7d32;
	}

	.zone-green h3 {
		color: #1b5e20;
	}

	.zone-yellow {
		background-color: #fffde7;
		border-left: 4px solid #f9a825;
	}

	.zone-yellow h3 {
		color: #f57f17;
	}

	.zone-red {
		background-color: #ffebee;
		border-left: 4px solid #c62828;
	}

	.zone-red h3 {
		color: #b71c1c;
	}

	/* Crisis Resources */
	.crisis-resources {
		background-color: rgba(255, 255, 255, 0.7);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin-top: var(--space-4);
	}

	.crisis-resources h4 {
		margin-bottom: var(--space-2);
		color: #c62828;
	}

	.crisis-resources ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.crisis-resources li {
		margin-bottom: var(--space-2);
	}

	.crisis-resources a {
		color: #c62828;
		font-weight: 600;
	}

	/* Feature List */
	.feature-list {
		padding-left: var(--space-6);
	}

	.feature-list li {
		margin-bottom: var(--space-3);
		line-height: 1.6;
	}

	/* Download Section */
	.download-section {
		background-color: var(--color-bg-subtle);
		padding: var(--space-8);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.download-section h2 {
		border-bottom: none;
		padding-bottom: 0;
	}

	.download-section p {
		max-width: none;
		margin-bottom: var(--space-6);
	}

	.download-btn {
		gap: var(--space-2);
	}
</style>
