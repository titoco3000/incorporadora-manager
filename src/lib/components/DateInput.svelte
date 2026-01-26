<script lang="ts">
    import type { DateString } from '$lib/types/DateString';
    import { untrack } from 'svelte';

    interface Props {
        initialDate?: DateString | null;
        onDateChange?: (date: DateString | null) => void;
    }

    let { initialDate, onDateChange }: Props = $props();

    let day = $state('');
    let month = $state('');
    let year = $state('');

    // Sync internal state ONLY when initialDate changes from above
    $effect(() => {
        const incoming = initialDate;
        untrack(() => {
            if (incoming) {
                const [y, m, d] = incoming.split('-');
                day = d || '';
                month = m || '';
                year = y || '';
            }
        });
    });

    let dayRef = $state<HTMLInputElement | null>(null);
    let monthRef = $state<HTMLInputElement | null>(null);
    let yearRef = $state<HTMLInputElement | null>(null);

    // Validation logic
    const validDateString = $derived.by((): DateString | null => {
        if (!day || !month || year.length < 4) return null;
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);
        const dateCheck = new Date(y, m - 1, d);
        
        const isValid = dateCheck.getFullYear() === y && 
                        dateCheck.getMonth() === m - 1 && 
                        dateCheck.getDate() === d;

        if (!isValid) return null;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` as DateString;
    });

    // Notify parent ONLY when the user leaves the component
    function handleBlur(e: FocusEvent) {
        // Use relatedTarget to check if focus moved to another input in the SAME component
        const container = e.currentTarget as HTMLElement;
        setTimeout(() => {
            if (!container.contains(document.activeElement)) {
                // User has left the entire component
                onDateChange?.(validDateString);
            }
        }, 0);
    }

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

<div class="date-container" onfocusout={handleBlur}>
    <input
        bind:this={dayRef}
        value={day}
        oninput={(e) => handleInput(e, 'day')}
        type="text"
        inputmode="numeric"
        placeholder="DD"
        maxlength="2"
    />
    <span class="sep" class:invalid={!validDateString && year.length === 4}>/</span>
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
    <span class="sep" class:invalid={!validDateString && year.length === 4}>/</span>
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
