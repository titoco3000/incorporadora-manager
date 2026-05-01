<script lang="ts">
	import type { DateString } from '$lib/types/DateString';
	import { Calendar } from 'lucide-svelte';
	import { untrack } from 'svelte';

	let {
		value = $bindable(),
		id,
		disabled = false,
		required = false,
		placeholder,
		style
	} = $props<{
		value?: DateString;
		id?: string;
		disabled?: boolean;
		required?: boolean;
		placeholder?: string;
		style?: string;
	}>();

	let displayValue = $state('');
	let dateInput: HTMLInputElement;

	// Sync external value to internal displayValue ONLY when 'value' changes.
	$effect(() => {
		// Read 'value' outside untrack so the effect tracks it
		const currentVal = value;

		// Use untrack so typing in the input doesn't trigger this effect
		untrack(() => {
			if (currentVal) {
				const parts = currentVal.split('-');
				if (parts.length === 3) {
					const [y, m, d] = parts;
					const expected = `${d}/${m}/${y.slice(-2)}`;
					if (displayValue !== expected) {
						displayValue = expected;
					}
				}
			} else {
				displayValue = '';
			}
		});
	});

	// Strip non-numbers, format with slashes, and conditionally update
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;

		// Remove anything that isn't a digit
		let raw = target.value.replace(/[^\d]/g, '');
		raw = raw.slice(0, 6); // Max 6 digits for ddmmyy

		let formatted = '';
		if (raw.length > 0) formatted += raw.substring(0, 2);
		if (raw.length > 2) formatted += '/' + raw.substring(2, 4);
		if (raw.length > 4) formatted += '/' + raw.substring(4, 6);

		displayValue = formatted;

		// If all 6 digits are typed, verify and update the external value immediately
		if (raw.length === 6) {
			tryUpdateExternal(raw);
		} else if (raw.length === 0) {
			// Optional: immediately clear external value if input is completely emptied
			value = undefined;
		}
	}

	// Force-correct the internal state on blur
	function handleBlur() {
		let parts = displayValue.split('/');

		// If empty, clear the external value
		if (parts.length === 1 && !parts[0]) {
			value = undefined;
			return;
		}

		// Pad missing chunks with zeroes
		let d = (parts[0] || '').replace(/[^\d]/g, '').padStart(2, '0');
		let m = (parts[1] || '').replace(/[^\d]/g, '').padStart(2, '0');
		let y = (parts[2] || '').replace(/[^\d]/g, '');

		// Default year to current year if omitted, or pad single digits
		if (y.length === 0) y = new Date().getFullYear().toString().slice(-2);
		else if (y.length === 1) y = '0' + y;

		d = d.slice(0, 2);
		m = m.slice(0, 2);
		y = y.slice(0, 2);

		displayValue = `${d}/${m}/${y}`;
		const raw = d + m + y;

		const updated = tryUpdateExternal(raw);

		// If it resulted in an invalid date (e.g. 31/02/24), revert to the last valid date
		if (!updated) {
			if (value) {
				const [vy, vm, vd] = value.split('-');
				displayValue = `${vd}/${vm}/${vy.slice(-2)}`;
			} else {
				displayValue = '';
			}
		}
	}

	// Helper to validate calendar rules and commit the external bindable
	function tryUpdateExternal(raw: string): boolean {
		const d = parseInt(raw.substring(0, 2), 10);
		const m = parseInt(raw.substring(2, 4), 10);
		const y = parseInt(raw.substring(4, 6), 10) + 2000; // Base century set to 2000

		const dateObj = new Date(y, m - 1, d);

		// Validate leap years and month boundaries
		if (dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d) {
			const newExternalStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
			if (value !== newExternalStr) {
				value = newExternalStr;
			}
			return true;
		}
		return false;
	}

	function openPicker() {
		if (disabled) return;
		if (dateInput) {
			try {
				dateInput.showPicker();
			} catch (e) {
				dateInput.focus();
			}
		}
	}
</script>

<!-- Apply style prop to the outermost element -->
<label {style}>
	<div class="date-input-container">
		<div class="input-wrapper">
			<!-- Hide the mask if a placeholder is actively taking its place and input is empty -->
			{#if !placeholder || displayValue}
				<!-- Using &nbsp; forces the browser to render the spaces exactly so they align with the text -->
				<span class="mask" aria-hidden="true">&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;</span>
			{/if}

			<input
				type="text"
				{id}
				{disabled}
				{required}
				{placeholder}
				bind:value={displayValue}
				oninput={handleInput}
				onblur={handleBlur}
				maxlength="8"
			/>
		</div>

		<button
			type="button"
			class="picker-btn"
			onclick={openPicker}
			aria-label="Open date picker"
			{disabled}
		>
			<Calendar />
		</button>

		<!-- Hidden native date input that stays synced with the external value -->
		<input
			type="date"
			class="hidden-date"
			bind:this={dateInput}
			bind:value
			tabindex="-1"
			{disabled}
			{required}
		/>
	</div>
</label>

<style>
	label {
		width: 100%;
		display: flex;
		justify-content: center;
		cursor: text;
	}
	.date-input-container {
		display: inline-flex;
		align-items: stretch;
		gap: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		color: var(--text-color-1);
	}

	.input-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		border-radius: 4px;
		overflow: hidden;
	}

	.mask {
		position: absolute;
		left: 8px;
		pointer-events: none;
		letter-spacing: 2px;
		z-index: 0;
		user-select: none;
		font-size: 1rem;
	}

	input[type='text'] {
		position: relative;
		z-index: 1;
		background: transparent;
		border: none;
		outline: none;
		padding: 8px;
		font-family: inherit;
		font-size: 1rem;
		letter-spacing: 2px;
		width: 115px;
	}

	input[type='text']:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.picker-btn {
		background: none;
		border-radius: 4px;
		padding: 6px 10px;
		cursor: pointer;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.picker-btn:hover:not(:disabled) {
		color: white;
	}

	.picker-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.hidden-date {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}
</style>
