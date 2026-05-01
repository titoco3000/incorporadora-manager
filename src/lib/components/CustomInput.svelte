<script lang="ts">
	import type { CustomInputType } from './../types/CustomInput.ts';
	import type { Company, Building, TransactionType } from '$lib/types/api';
	import { api } from '$lib/api';
	import ValueInput from './ValueInput.svelte';
	import DateInput from './DateInput.svelte';
	import type { DateString } from '$lib/types/DateString';

	let {
		type,
		value = $bindable(),
		disabled = false,
		placeholder = '',
		required = false,
		emptyLabel = '--',
		id,
		style,
		optionStyle,
		...rest
	} = $props<{
		type: CustomInputType;
		value: any;
		disabled?: boolean;
		placeholder?: string;
		required?: boolean;
		emptyLabel?: string;
		id?: string;
		style?: string;
		optionStyle?: string;
		[key: string]: any;
	}>();

	let dropdownContainerRef = $state<HTMLDivElement>();

	let companies = $state<Company[]>([]);
	let suppliers = $state<Company[]>([]);
	let clients = $state<Company[]>([]);
	let buildings = $state<Building[]>([]);
	let transactionTypes = $state<TransactionType[]>([]);

	let isDropdownOpen = $state(false);
	let filterText = $state('');
	let dropdownRef = $state<HTMLDivElement>();

	$effect(() => {
		if (
			[
				'supplier',
				'company',
				'client',
				'building',
				'transactionType',
				'expenseTransactionType',
				'incomeTransactionType'
			].includes(type)
		) {
			fetchOptions(type);
		}
	});

	function floatDropdown(node: HTMLElement, referenceNode: HTMLElement | undefined) {
		if (!referenceNode) return;

		document.body.appendChild(node);

		function updatePosition() {
			if (!referenceNode) return;
			const rect = referenceNode.getBoundingClientRect();

			node.style.position = 'fixed';
			node.style.top = `${rect.bottom}px`;
			node.style.left = `${rect.left}px`;
			node.style.width = `${rect.width}px`;
			node.style.zIndex = '9999';
		}

		updatePosition();

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return {
			destroy() {
				window.removeEventListener('scroll', updatePosition, true);
				window.removeEventListener('resize', updatePosition);
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	const fetchOptions = async (type: string) => {
		try {
			if (type === 'supplier') {
				suppliers = await api.companies.get({ isSupplier: true });
			} else if (type === 'client') {
				clients = await api.clients.get();
			} else if (type === 'company') {
				companies = await api.companies.get();
			} else if (type === 'building') {
				buildings = await api.buildings.get();
			} else if (
				['transactionType', 'expenseTransactionType', 'incomeTransactionType'].includes(type)
			) {
				transactionTypes = await api.transactionTypes.get();
			}
		} catch (e) {
			console.error('Error loading data:', e);
		}
	};

	function handleInput(e: Event | DateString | null) {
		if (e instanceof Event) {
			const target = e.target as HTMLInputElement | HTMLTextAreaElement;

			let rawValue: string | boolean = target.value;

			if (type === 'cnpj') {
				rawValue = formatCnpj(rawValue);
				target.value = rawValue;
			} else if (type == 'bool') rawValue = target.value === 'on';

			value = rawValue;
		} else {
			value = e;
		}
	}

	function formatCnpj(val: string): string {
		const numbers = val.replace(/\D/g, '').slice(0, 14);
		return numbers
			.replace(/^(\d{2})(\d)/, '$1.$2')
			.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
			.replace(/\.(\d{3})(\d)/, '.$1/$2')
			.replace(/(\d{4})(\d)/, '$1-$2');
	}

	let baseOptions = $derived(
		type === 'client'
			? clients
			: type === 'supplier'
				? suppliers
				: type === 'company'
					? companies
					: type === 'building'
						? buildings
						: type === 'incomeTransactionType'
							? transactionTypes.filter((i) => !i.isExpense)
							: type === 'expenseTransactionType'
								? transactionTypes.filter((i) => i.isExpense)
								: type === 'transactionType'
									? transactionTypes
									: []
	);

	let sortedOptions = $derived.by(() => {
		if (!filterText) return baseOptions;

		const query = filterText.toLowerCase();

		return [...baseOptions].sort((a, b) => {
			const textA = (a.name || a.id).toString().toLowerCase();
			const textB = (b.name || b.id).toString().toLowerCase();

			// Assign a score based on how close the match is
			const getScore = (text: string) => {
				if (text === query) return 3; // Exact match
				if (text.startsWith(query)) return 2; // Starts with the typed text
				if (text.includes(query)) return 1; // Contains the typed text somewhere
				return 0; // Doesn't match at all
			};

			const scoreA = getScore(textA);
			const scoreB = getScore(textB);

			// Sort by score descending (highest score first)
			if (scoreA !== scoreB) {
				return scoreB - scoreA;
			}

			// If the scores are tied, fall back to alphabetical sorting
			return textA.localeCompare(textB);
		});
	});

	const getSelectedId = () => {
		return value !== null && typeof value === 'object' && 'id' in value ? value.id : value;
	};

	$effect(() => {
		if (!isDropdownOpen && baseOptions.length > 0) {
			const searchId = getSelectedId();
			const selected = baseOptions.find((o) => o.id == searchId);

			if (selected) {
				filterText = selected.name;

				const isPrimitiveOrNull = typeof value !== 'object' || value === null;

				if (isPrimitiveOrNull || value.id != selected.id) {
					value = selected;
				}
			} else if (!value) {
				filterText = '';
			}
		}
	});

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
				isDropdownOpen = false;

				// Revert filter text to currently selected value if they click away
				const searchId = getSelectedId();
				const selected = baseOptions.find((o) => o.id == searchId);
				filterText = selected?.name || '';
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function selectOption(opt: any, optName: string) {
		value = opt;
		filterText = optName;
		isDropdownOpen = false;
	}

	function handleBlur() {
		setTimeout(() => {
			isDropdownOpen = false;

			const searchId = getSelectedId();
			const selected = baseOptions.find((o) => o.id == searchId);
			filterText = selected?.name || '';
		}, 300);
	}
</script>

{#if type === 'obs'}
	<textarea
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
		autocomplete="off"
		{...rest}
		bind:value
		oninput={handleInput}
	></textarea>
{:else if ['supplier', 'company', 'building', 'transactionType', 'incomeTransactionType', 'expenseTransactionType', 'client'].includes(type)}
	<div class="dropdown-container" bind:this={dropdownContainerRef}>
		<input
			{id}
			{disabled}
			{required}
			{placeholder}
			{style}
			autocomplete="off"
			bind:value={filterText}
			onfocus={() => (isDropdownOpen = true)}
			oninput={() => (isDropdownOpen = true)}
			onblur={handleBlur}
			{...rest}
		/>

		{#if isDropdownOpen}
			<div class="dropdown-list" use:floatDropdown={dropdownContainerRef}>
				{#if !required}
					<button onclick={() => selectOption(null, '')} style={optionStyle} class="empty-option">
						{emptyLabel || ''}
					</button>
				{/if}
				{#each sortedOptions as option}
					<button
						onclick={() => selectOption(option, option.name)}
						style={optionStyle}
						class:selected={getSelectedId() == option.id}
					>
						{option.name || option.id}
					</button>
				{/each}

				{#if sortedOptions.length === 0}
					<li class="no-options">No options found</li>
				{/if}
			</div>
		{/if}
	</div>
{:else if type == 'bool'}
	<input
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
		autocomplete="off"
		{...rest}
		bind:checked={value}
		type="checkbox"
		oninput={handleInput}
	/>
{:else if type == 'value'}
	<ValueInput
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
		autocomplete="off"
		{...rest}
		bind:value
		oninput={handleInput}
	/>
{:else if type === 'date'}
	<DateInput bind:value {id} {disabled} {required} {placeholder} {style} {...rest} />
{:else}
	<input
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
		autocomplete="off"
		{...rest}
		bind:value
		type={type === 'number' ? 'number' : 'text'}
		step={type === 'number' ? 0.1 : undefined}
		oninput={handleInput}
	/>
{/if}

<style>
	textarea,
	input {
		display: block;
		height: 100%;
		width: 100%;
		min-width: 0;
		background-color: transparent;
		border: none;
		outline: none;
	}

	textarea:focus,
	input:focus {
		outline: 2px solid yellow;
		border-radius: 5px;
		background-color: var(--bg-color-4);
	}

	.dropdown-container {
		position: relative;
		height: 100%;
		width: 100%;
	}

	.dropdown-list {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
		background: Canvas;
		color: CanvasText;
		border-top: none;
		max-height: 200px;
		z-index: 100;
		overflow: hidden auto;
	}

	.dropdown-list button {
		padding: 6px 8px;
		width: 100%;
		text-align: left;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dropdown-list button:hover {
		background: Highlight;
		color: HighlightText;
	}

	.dropdown-list button.selected {
		opacity: 0.5;
	}

	.no-options {
		color: GrayText;
		cursor: default !important;
	}

	.dropdown-list button.empty-option {
		font-style: italic;
		color: GrayText;
	}
	.dropdown-list button.empty-option:hover {
		color: HighlightText;
	}
</style>
