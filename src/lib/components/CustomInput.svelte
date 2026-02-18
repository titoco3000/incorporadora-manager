<script lang="ts">
	import type { CustomInputType } from './../types/CustomInput.ts';
	import type { Company, Building, TransactionType } from '$lib/types/api';
	import { api } from '$lib/api';

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
	let buildings = $state<Building[]>([]);
	let transactionTypes = $state<TransactionType[]>([]);

	let isDropdownOpen = $state(false);
	let filterText = $state('');
	let dropdownRef = $state<HTMLDivElement>();

	$effect(() => {
		if (['supplier', 'company', 'building', 'transactionType'].includes(type)) {
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
			} else if (type === 'company') {
				companies = await api.companies.get();
			} else if (type === 'building') {
				buildings = await api.buildings.get();
			} else if (type === 'transactionType') {
				transactionTypes = await api.transactionTypes.get();
			}
		} catch (e) {
			console.error('Error loading data:', e);
		}
	};

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement | HTMLTextAreaElement;
		let rawValue = target.value;

		if (type === 'cnpj') {
			rawValue = formatCnpj(rawValue);
			target.value = rawValue;
		}

		value = rawValue;
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
		type === 'supplier'
			? suppliers
			: type === 'company'
				? companies
				: type === 'building'
					? buildings
					: type === 'transactionType'
						? transactionTypes
						: []
	);

	let filteredOptions = $derived(
		baseOptions.filter((opt) => {
			const text = (opt.name || opt.id).toString().toLowerCase();
			return text.includes(filterText.toLowerCase());
		})
	);

	$effect(() => {
		if (!isDropdownOpen) {
			const selected = baseOptions.find((o) => o.id === value);
			if (selected) {
				filterText = selected.name;
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
				const selected = baseOptions.find((o) => o.id === value);
				filterText = selected?.name || '';
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function selectOption(optValue: any, optName: string) {
		value = optValue;
		filterText = optName;
		isDropdownOpen = false;
	}

	function handleBlur() {
		setTimeout(() => {
			isDropdownOpen = false;

			const selected = baseOptions.find((o) => o.id === value);
			filterText = selected?.name || '';
		}, 100);
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
{:else if ['supplier', 'company', 'building', 'transactionType'].includes(type)}
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
				{#each filteredOptions as option}
					<button
						onclick={() => selectOption(option.id, option.name)}
						style={optionStyle}
						class:selected={value === option.id}
					>
						{option.name || option.id}
					</button>
				{/each}
				{#if filteredOptions.length === 0}
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
		type={type === 'value' || type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
		step={type === 'value' ? 0.01 : type === 'number' ? 0.1 : undefined}
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
