import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ZoneSelector from './ZoneSelector.svelte';

describe('ZoneSelector', () => {
	it('renders all three zone cards', async () => {
		render(ZoneSelector, {
			onZoneSelect: vi.fn()
		});

		const greenCard = page.getByRole('button', { name: /I'm feeling good/i });
		const yellowCard = page.getByRole('button', { name: /I'm struggling/i });
		const redCard = page.getByRole('button', { name: /I need help now/i });

		await expect.element(greenCard).toBeInTheDocument();
		await expect.element(yellowCard).toBeInTheDocument();
		await expect.element(redCard).toBeInTheDocument();
	});

	it('displays correct subtitles for each zone', async () => {
		render(ZoneSelector, {
			onZoneSelect: vi.fn()
		});

		const greenCard = page.getByRole('button', { name: /I'm feeling good/i });
		const yellowCard = page.getByRole('button', { name: /I'm struggling/i });
		const redCard = page.getByRole('button', { name: /I need help now/i });

		await expect.element(greenCard).toHaveTextContent('I am feeling happy most of the day/week!');
		await expect
			.element(yellowCard)
			.toHaveTextContent(
				'My coping skills are not helping enough. I feel sad, upset, stressed, or worried most of the day, most days of the week.'
			);
		await expect
			.element(redCard)
			.toHaveTextContent('I feel unsafe or am thinking about hurting myself.');
	});

	it('calls onZoneSelect with "green" when green zone is clicked', async () => {
		const onZoneSelect = vi.fn();

		render(ZoneSelector, {
			onZoneSelect
		});

		const greenCard = page.getByRole('button', { name: /I'm feeling good/i });
		await userEvent.click(greenCard);

		expect(onZoneSelect).toHaveBeenCalledOnce();
		expect(onZoneSelect).toHaveBeenCalledWith('green');
	});

	it('calls onZoneSelect with "yellow" when yellow zone is clicked', async () => {
		const onZoneSelect = vi.fn();

		render(ZoneSelector, {
			onZoneSelect
		});

		const yellowCard = page.getByRole('button', { name: /I'm struggling/i });
		await userEvent.click(yellowCard);

		expect(onZoneSelect).toHaveBeenCalledOnce();
		expect(onZoneSelect).toHaveBeenCalledWith('yellow');
	});

	it('calls onZoneSelect with "red" when red zone is clicked', async () => {
		const onZoneSelect = vi.fn();

		render(ZoneSelector, {
			onZoneSelect
		});

		const redCard = page.getByRole('button', { name: /I need help now/i });
		await userEvent.click(redCard);

		expect(onZoneSelect).toHaveBeenCalledOnce();
		expect(onZoneSelect).toHaveBeenCalledWith('red');
	});

	it('shows selected state for the selected zone', async () => {
		render(ZoneSelector, {
			selectedZone: 'yellow',
			onZoneSelect: vi.fn()
		});

		const yellowCard = page.getByRole('button', { name: /I'm struggling/i });
		await expect.element(yellowCard).toHaveAttribute('aria-pressed', 'true');

		const greenCard = page.getByRole('button', { name: /I'm feeling good/i });
		await expect.element(greenCard).toHaveAttribute('aria-pressed', 'false');

		const redCard = page.getByRole('button', { name: /I need help now/i });
		await expect.element(redCard).toHaveAttribute('aria-pressed', 'false');
	});

	it('has proper group role for accessibility', async () => {
		const { container } = render(ZoneSelector, {
			onZoneSelect: vi.fn()
		});

		const group = container.querySelector('[role="group"]');
		expect(group).not.toBeNull();
		expect(group?.getAttribute('aria-label')).toBe("Select how you're feeling");
	});

	it('displays emojis for each zone', async () => {
		const { container } = render(ZoneSelector, {
			onZoneSelect: vi.fn()
		});

		const emojis = container.querySelectorAll('.zone-emoji');
		expect(emojis.length).toBe(3);

		const emojiTexts = Array.from(emojis).map((el) => el.textContent);
		expect(emojiTexts).toContain('😊');
		expect(emojiTexts).toContain('😟');
		expect(emojiTexts).toContain('😢');
	});
});
