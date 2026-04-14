<script lang="ts">
	let {
		value = $bindable(),
		decimalSeparator = ',',
		thousandsSeparator = '.',
		...restProps
	} = $props<{
		value: number | null;
		decimalSeparator?: string;
		thousandsSeparator?: string;
	}>();

	let inputEl: HTMLInputElement;
	let displayValue = $state('');

	function formatNumber(intPart: string, decPart: string | null): string {
		// Add thousands separators to integer part
		const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
		if (decPart !== null) {
			return formatted + decimalSeparator + decPart;
		}
		return formatted;
	}

	function parseDisplay(display: string): { intPart: string; decPart: string | null } {
		const sepIdx = display.indexOf(decimalSeparator);
		if (sepIdx === -1) {
			return {
				intPart: display.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), ''),
				decPart: null
			};
		}
		const intRaw = display.slice(0, sepIdx).replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
		const decRaw = display.slice(sepIdx + 1);
		return { intPart: intRaw, decPart: decRaw };
	}

	function updateValue(intPart: string, decPart: string | null) {
		if (intPart === '' && decPart === null) {
			value = null;
			return;
		}
		const numStr = intPart + (decPart !== null ? '.' + decPart : '');
		value = numStr === '' ? null : parseFloat(numStr);
	}

	function handleKeydown(e: KeyboardEvent) {
		const input = e.currentTarget as HTMLInputElement;
		const key = e.key;
		const selStart = input.selectionStart ?? 0;
		const selEnd = input.selectionEnd ?? 0;

		// Allow control keys
		if (
			e.ctrlKey ||
			e.metaKey ||
			['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key)
		)
			return;

		// Block non-numeric, non-separator, non-control keys
		const isDigit = /^\d$/.test(key);
		const isDecSep = key === decimalSeparator || key === '.';
		const isBackspace = key === 'Backspace';
		const isDelete = key === 'Delete';
		const isMinus = key === '-';

		if (!isDigit && !isDecSep && !isBackspace && !isDelete && !isMinus) {
			e.preventDefault();
			return;
		}

		e.preventDefault();

		let display = input.value;
		let cursor = selStart;

		// Handle selection deletion first
		if (selStart !== selEnd && (isBackspace || isDelete)) {
			// Remove selected range, stripping thousand separators from removed chars
			display = display.slice(0, selStart) + display.slice(selEnd);
			cursor = selStart;
			// clean and reformat
			const { intPart, decPart } = parseDisplay(display);
			const newDisplay = formatNumber(intPart || '0', decPart);
			displayValue =
				newDisplay === '0' && decPart === null
					? ''
					: intPart === '' && decPart === null
						? ''
						: newDisplay;
			updateValue(intPart, decPart);
			// set cursor
			requestAnimationFrame(() => {
				inputEl.setSelectionRange(cursor, cursor);
			});
			return;
		}

		// Handle digit input
		if (isDigit) {
			// Remove selected text
			if (selStart !== selEnd) {
				display = display.slice(0, selStart) + display.slice(selEnd);
				cursor = selStart;
			}

			const { intPart, decPart } = parseDisplay(display);
			const isInDecimal = decPart !== null && cursor > display.indexOf(decimalSeparator);

			let newIntPart = intPart;
			let newDecPart = decPart;

			if (isInDecimal) {
				// Position in decimal section
				const decSepPosInDisplay = display.indexOf(decimalSeparator);
				const posInDec = cursor - decSepPosInDisplay - 1;

				if (decPart!.length < 2) {
					// Just insert
					newDecPart = decPart!.slice(0, posInDec) + key + decPart!.slice(posInDec);
				} else {
					// Slide: insert digit, shift decimal right (i.e. move one digit to int)
					const fullDec = decPart!.slice(0, posInDec) + key + decPart!.slice(posInDec);
					// fullDec is now 3 chars, move last char becomes trailing - actually:
					// "adding extra digits to decimal after 2, move separator one space"
					// So: insert digit into dec, take first digit of dec and append to int
					newDecPart = fullDec.slice(0, 2);
					newIntPart = intPart + fullDec[0];
					// Actually re-read: "move the separator one space" means the decimal point moves right
					// insert at position, then trim to 2 keeping inserted digit
					// Let's redo: insert key at posInDec in decPart, giving 3-char string
					// move separator right: intPart gains first dec digit, dec = remaining 2
					const inserted = decPart!.slice(0, posInDec) + key + decPart!.slice(posInDec);
					newIntPart = intPart + inserted[0];
					newDecPart = inserted.slice(1, 3);
				}
			} else {
				// In integer part
				// Find position in raw integer
				const rawCursorInInt = countDigitsBefore(display, cursor, thousandsSeparator);
				newIntPart = intPart.slice(0, rawCursorInInt) + key + intPart.slice(rawCursorInInt);
			}

			const newDisplay = formatNumber(newIntPart, newDecPart);
			displayValue = newDisplay;
			updateValue(newIntPart, newDecPart);

			// Compute new cursor position
			requestAnimationFrame(() => {
				if (isInDecimal) {
					const decSepPos = inputEl.value.indexOf(decimalSeparator);
					const posInDec = cursor - display.indexOf(decimalSeparator) - 1;
					inputEl.setSelectionRange(decSepPos + posInDec + 2, decSepPos + posInDec + 2);
				} else {
					const rawPos = countDigitsBefore(display, cursor, thousandsSeparator) + 1;
					const newCursor = rawToDisplayPos(inputEl.value, rawPos, thousandsSeparator);
					inputEl.setSelectionRange(newCursor, newCursor);
				}
			});
			return;
		}

		// Handle decimal separator
		if (isDecSep) {
			if (selStart !== selEnd) {
				display = display.slice(0, selStart) + display.slice(selEnd);
				cursor = selStart;
			}
			const existing = display.indexOf(decimalSeparator);
			if (existing === -1) {
				// No decimal yet — insert it
				const { intPart } = parseDisplay(display);
				const rawPos = countDigitsBefore(display, cursor, thousandsSeparator);
				const newInt = intPart.slice(0, rawPos);
				const leftover = intPart.slice(rawPos);
				// Everything after cursor becomes decimal
				const newDisplay = formatNumber(newInt || '0', leftover.slice(0, 2));
				displayValue = newDisplay;
				updateValue(newInt || '0', leftover.slice(0, 2));
				requestAnimationFrame(() => {
					const pos = inputEl.value.indexOf(decimalSeparator) + 1;
					inputEl.setSelectionRange(pos, pos);
				});
			} else {
				// Already has decimal — move cursor to after decimal sep
				requestAnimationFrame(() => {
					inputEl.setSelectionRange(existing + 1, existing + 1);
				});
			}
			return;
		}

		// Handle Backspace
		if (isBackspace) {
			if (cursor === 0) return;

			const charBefore = display[cursor - 1];

			if (charBefore === thousandsSeparator) {
				// Delete the digit before the thousands separator
				const digitPos = cursor - 2;
				if (digitPos < 0) return;
				display = display.slice(0, digitPos) + display.slice(digitPos + 1);
			} else if (charBefore === decimalSeparator) {
				// Remove decimal separator, merging dec into int
				const { intPart, decPart } = parseDisplay(display);
				const newDisplay = formatNumber(intPart, null);
				displayValue = newDisplay;
				updateValue(intPart, null);
				requestAnimationFrame(() => {
					const pos = newDisplay.length - (decPart?.length ?? 0);
					inputEl.setSelectionRange(pos, pos);
				});
				return;
			} else {
				display = display.slice(0, cursor - 1) + display.slice(cursor);
			}

			const { intPart, decPart } = parseDisplay(display);
			const newDisplay =
				intPart === '' && decPart === null ? '' : formatNumber(intPart || '0', decPart);
			displayValue = newDisplay;
			updateValue(intPart, decPart);
			requestAnimationFrame(() => {
				const rawPos = Math.max(0, countDigitsBefore(display, cursor - 1, thousandsSeparator));
				const newCursor = rawToDisplayPos(inputEl.value, rawPos, thousandsSeparator);
				inputEl.setSelectionRange(newCursor, newCursor);
			});
			return;
		}

		// Handle Delete
		if (isDelete) {
			if (cursor >= display.length) return;

			const charAt = display[cursor];

			if (charAt === thousandsSeparator) {
				// Delete the digit after the thousands separator
				const digitPos = cursor + 1;
				if (digitPos >= display.length) return;
				display = display.slice(0, digitPos) + display.slice(digitPos + 1);
			} else if (charAt === decimalSeparator) {
				// Remove decimal separator
				const { intPart, decPart } = parseDisplay(display);
				const newDisplay = formatNumber(intPart, null);
				displayValue = newDisplay;
				updateValue(intPart, null);
				requestAnimationFrame(() => {
					inputEl.setSelectionRange(cursor, cursor);
				});
				return;
			} else {
				display = display.slice(0, cursor) + display.slice(cursor + 1);
			}

			const { intPart, decPart } = parseDisplay(display);
			const newDisplay =
				intPart === '' && decPart === null ? '' : formatNumber(intPart || '0', decPart);
			displayValue = newDisplay;
			updateValue(intPart, decPart);
			requestAnimationFrame(() => {
				const rawPos = countDigitsBefore(display, cursor, thousandsSeparator);
				const newCursor = rawToDisplayPos(inputEl.value, rawPos, thousandsSeparator);
				inputEl.setSelectionRange(newCursor, newCursor);
			});
			return;
		}

		// Handle minus (only at start)
		if (isMinus) {
			if (cursor === 0) {
				const hasMinus = display.startsWith('-');
				if (!hasMinus) {
					displayValue = '-' + display;
				}
				// toggle? let's just add if not there
				requestAnimationFrame(() => {
					inputEl.setSelectionRange(1, 1);
				});
			}
		}
	}

	// Count how many raw digits appear before displayPos, ignoring thousand separators
	function countDigitsBefore(display: string, displayPos: number, sep: string): number {
		let count = 0;
		for (let i = 0; i < displayPos; i++) {
			if (display[i] !== sep) count++;
		}
		return count;
	}

	// Given raw digit position (0-indexed), find display position
	function rawToDisplayPos(display: string, rawPos: number, sep: string): number {
		let count = 0;
		for (let i = 0; i <= display.length; i++) {
			if (count === rawPos) return i;
			if (i < display.length && display[i] !== sep) count++;
		}
		return display.length;
	}

	function handleBlur() {
		if (displayValue === '') return;
		const { intPart, decPart } = parseDisplay(displayValue);
		if (decPart === null) {
			// No decimal at all — add ",00"
			displayValue = formatNumber(intPart, '00');
		} else if (decPart.length === 0) {
			// Separator present but no digits after it
			displayValue = formatNumber(intPart, '00');
		} else if (decPart.length === 1) {
			// Only one decimal digit — pad with a zero
			displayValue = formatNumber(intPart, decPart + '0');
		}
		// If already 2 digits, nothing to do
	}

	$effect(() => {
		// 1. Prioritize clearing the visual value, regardless of focus
		if (value === null || value === undefined || value === '') {
			displayValue = '';
			return;
		}

		// 2. Now prevent formatting while the user is actively typing
		if (document.activeElement === inputEl) return;

		// 3. Format the incoming data
		const str = value.toString();
		const dotIdx = str.indexOf('.');
		if (dotIdx === -1) {
			displayValue = formatNumber(str, null);
		} else {
			displayValue = formatNumber(str.slice(0, dotIdx), str.slice(dotIdx + 1, dotIdx + 3));
		}
	});
</script>

<input
	bind:this={inputEl}
	type="text"
	inputmode="decimal"
	value={displayValue}
	onkeydown={handleKeydown}
	onblur={handleBlur}
	{...restProps}
/>

<style>
	input {
		display: block;
		height: 100%;
		width: 100%;
		min-width: 0;
		background-color: transparent;
		border: none;
		outline: none;
	}
</style>
