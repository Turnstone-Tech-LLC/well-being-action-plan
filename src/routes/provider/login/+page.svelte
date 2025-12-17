<svelte:head>
	<title>Provider Login | Well-Being Action Plan</title>
	<meta name="description" content="Provider login for Well-Being Action Plan" />
</svelte:head>

<section class="login-page">
	<div class="container">
		<h1>Provider Login</h1>
		<p class="description">
			Sign in to manage and distribute Well-Being Action Plans to your patients.
		</p>

		<form class="login-form">
			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="provider@example.com"
					autocomplete="email"
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="Enter your password"
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="btn btn-primary btn-full"> Sign In </button>
		</form>

		<p class="help-text">Contact your administrator if you need access.</p>
	</div>
</section>

<style>
	.login-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
		background-color: var(--color-bg-subtle);
	}

	.container {
		max-width: 24rem;
		width: 100%;
		background-color: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
	}

	h1 {
		color: var(--color-primary);
		text-align: center;
		margin-bottom: var(--space-2);
	}

	.description {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-8);
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-weight: 500;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.form-group input {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-group input::placeholder {
		color: var(--color-gray-400);
	}

	.btn-full {
		width: 100%;
		margin-top: var(--space-2);
	}

	.help-text {
		text-align: center;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-6);
	}
</style>
