import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AboutSection from './AboutSection.svelte';

describe('AboutSection', () => {
	it('renders section heading', async () => {
		render(AboutSection);

		const heading = page.getByRole('heading', { name: 'About' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('renders link to About page', async () => {
		render(AboutSection);

		const link = page.getByRole('link', { name: /About the Well-Being Action Plan/i });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('href', '/about');
	});

	it('shows link description', async () => {
		render(AboutSection);

		const description = page.getByText('Learn more about this tool and how to use it');
		await expect.element(description).toBeInTheDocument();
	});

	it('displays app version', async () => {
		render(AboutSection);

		const versionLabel = page.getByText('App Version');
		const versionValue = page.getByText('0.0.1');

		await expect.element(versionLabel).toBeInTheDocument();
		await expect.element(versionValue).toBeInTheDocument();
	});

	it('shows partnership note', async () => {
		render(AboutSection);

		const partnerText = page.getByText('Created in partnership with');
		await expect.element(partnerText).toBeInTheDocument();
	});

	it('shows partner name', async () => {
		render(AboutSection);

		const partnerName = page.getByText(
			"Golisano Children's Hospital at the University of Vermont Medical Center"
		);
		await expect.element(partnerName).toBeInTheDocument();
	});

	it('has aria-labelledby on section', async () => {
		const { container } = render(AboutSection);

		const section = container.querySelector('section[aria-labelledby="about-heading"]');
		expect(section).not.toBeNull();
	});

	it('link has proper text structure', async () => {
		const { container } = render(AboutSection);

		const linkLabel = container.querySelector('.link-label');
		expect(linkLabel?.textContent).toBe('About the Well-Being Action Plan');
	});
});
