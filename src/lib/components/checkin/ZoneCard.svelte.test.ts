import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ZoneCard from './ZoneCard.svelte';

describe('ZoneCard', () => {
	it('renders title and subtitle correctly', async () => {
		render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			onSelect: vi.fn()
		});

		const button = page.getByRole('button', { name: /I'm feeling good/i });
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).toHaveTextContent("I'm happy most of the day");
	});

	it('renders emoji', async () => {
		const { container } = render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			onSelect: vi.fn()
		});

		const emojiElement = container.querySelector('.zone-emoji');
		expect(emojiElement?.textContent).toBe('😊');
	});

	it('applies correct zone class for green zone', async () => {
		const { container } = render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			onSelect: vi.fn()
		});

		const card = container.querySelector('.zone-card.zone-green');
		expect(card).not.toBeNull();
	});

	it('applies correct zone class for yellow zone', async () => {
		const { container } = render(ZoneCard, {
			zone: 'yellow',
			title: "I'm struggling",
			subtitle: "My coping skills aren't helping enough",
			emoji: '😟',
			onSelect: vi.fn()
		});

		const card = container.querySelector('.zone-card.zone-yellow');
		expect(card).not.toBeNull();
	});

	it('applies correct zone class for red zone', async () => {
		const { container } = render(ZoneCard, {
			zone: 'red',
			title: 'I need help now',
			subtitle: 'I feel unsafe',
			emoji: '😢',
			onSelect: vi.fn()
		});

		const card = container.querySelector('.zone-card.zone-red');
		expect(card).not.toBeNull();
	});

	it('calls onSelect when clicked', async () => {
		const onSelect = vi.fn();

		render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			onSelect
		});

		const button = page.getByRole('button', { name: /I'm feeling good/i });
		await userEvent.click(button);

		expect(onSelect).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledWith('green');
	});

	it('calls onSelect when Enter key is pressed', async () => {
		const onSelect = vi.fn();

		render(ZoneCard, {
			zone: 'yellow',
			title: "I'm struggling",
			subtitle: "My coping skills aren't helping enough",
			emoji: '😟',
			onSelect
		});

		const button = page.getByRole('button', { name: /I'm struggling/i });
		await button.element().focus();
		await userEvent.keyboard('{Enter}');

		expect(onSelect).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledWith('yellow');
	});

	it('calls onSelect when Space key is pressed', async () => {
		const onSelect = vi.fn();

		render(ZoneCard, {
			zone: 'red',
			title: 'I need help now',
			subtitle: 'I feel unsafe',
			emoji: '😢',
			onSelect
		});

		const button = page.getByRole('button', { name: /I need help now/i });
		await button.element().focus();
		await userEvent.keyboard(' ');

		expect(onSelect).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledWith('red');
	});

	it('has aria-pressed attribute set correctly when not selected', async () => {
		render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			selected: false,
			onSelect: vi.fn()
		});

		const button = page.getByRole('button', { name: /I'm feeling good/i });
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
	});

	it('has aria-pressed attribute set correctly when selected', async () => {
		render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			selected: true,
			onSelect: vi.fn()
		});

		const button = page.getByRole('button', { name: /I'm feeling good/i });
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
	});

	it('applies selected class when selected', async () => {
		const { container } = render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			selected: true,
			onSelect: vi.fn()
		});

		const card = container.querySelector('.zone-card.selected');
		expect(card).not.toBeNull();
	});

	it('has aria-describedby pointing to subtitle', async () => {
		render(ZoneCard, {
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊',
			onSelect: vi.fn()
		});

		const button = page.getByRole('button', { name: /I'm feeling good/i });
		await expect.element(button).toHaveAttribute('aria-describedby', 'zone-green-desc');
	});
});
