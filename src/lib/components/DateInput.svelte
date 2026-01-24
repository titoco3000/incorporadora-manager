<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		initialDate?: Date | null;
		onDateChange?: (date: Date | null) => void;
	}

	let { initialDate, onDateChange }: Props = $props();

	let day = $state('');
	let month = $state('');
	let year = $state('');

	$effect(() => {
		const incoming = initialDate; 

		untrack(() => {
			if (incoming instanceof Date && !isNaN(incoming.getTime())) {
				const d = incoming.getDate().toString().padStart(2, '0');
				const m = (incoming.getMonth() + 1).toString().padStart(2, '0');
				const y = incoming.getFullYear().toString();

				const currentParsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
				if (incoming.getTime() !== currentParsed.getTime()) {
					day = d;
					month = m;
					year = y;
				}
			}
		});
	});

	let dayRef = $state<HTMLInputElement | null>(null);
	let monthRef = $state<HTMLInputElement | null>(null);
	let yearRef = $state<HTMLInputElement | null>(null);

	const validDate = $derived.by(() => {
		const d = parseInt(day);
		const m = parseInt(month) - 1; // JS months are 0-indexed
		const y = parseInt(year);

		if (!day || !month || year.length < 4) return null;

		const date = new Date(y, m, d);

		const isValid = date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;

		return isValid ? date : null;
	});

	// notify only when validity changes
	$effect(() => {
		const currentValidDate = validDate;
		untrack(() => {
			onDateChange?.(currentValidDate);
		});
	});

	// populate the starting value
	$effect(() => {
		if (initialDate instanceof Date && !isNaN(initialDate.getTime())) {
			day = initialDate.getDate().toString().padStart(2, '0');
			month = (initialDate.getMonth() + 1).toString().padStart(2, '0');
			year = initialDate.getFullYear().toString();
		}
	});

	function handleInput(e: Event, type: 'day' | 'month' | 'year') {
		const target = e.target as HTMLInputElement;
		const val = target.value.replace(/\D/g, '');

		if (type === 'day') {
			day = val;
			if (day.length >= 2) monthRef?.focus();
		} else if (type === 'month') {
			month = val;
			if (month.length >= 2) yearRef?.focus();
		} else {
			year = val;
		}
	}

	function handleKeyDown(e: KeyboardEvent, type: 'month' | 'year') {
		const target = e.target as HTMLInputElement;
		if (e.key === 'Backspace' && !target.value) {
			if (type === 'month') dayRef?.focus();
			if (type === 'year') monthRef?.focus();
		}
	}
</script>

<div class="date-container">
	<input
		bind:this={dayRef}
		value={day}
		oninput={(e) => handleInput(e, 'day')}
		type="text"
		inputmode="numeric"
		placeholder="DD"
		maxlength="2"
	/>
	<span class="sep" class:invalid={!validDate && year.length === 4}>/</span>
	<input
		bind:this={monthRef}
		value={month}
		oninput={(e) => handleInput(e, 'month')}
		onkeydown={(e) => handleKeyDown(e, 'month')}
		type="text"
		inputmode="numeric"
		placeholder="MM"
		maxlength="2"
	/>
	<span class="sep" class:invalid={!validDate && year.length === 4}>/</span>
	<input
		bind:this={yearRef}
		value={year}
		oninput={(e) => handleInput(e, 'year')}
		onkeydown={(e) => handleKeyDown(e, 'year')}
		type="text"
		inputmode="numeric"
		placeholder="YYYY"
		maxlength="4"
	/>
</div>

<style>
	.date-container {
		display: inline-flex;
		padding: 6px;
	}

	input {
		width: 35px;
		border: none;
		outline: none;
		text-align: center;
		font-family: monospace;
		font-size: 1rem;
		background-color: transparent;
	}

	input[placeholder='YYYY'] {
		width: 55px;
	}

	.sep {
		color: #d1d5db;
		font-weight: bold;
	}
	.invalid {
		color: #ef4444;
	}
</style>
