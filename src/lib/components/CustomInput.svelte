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
		id?: string;
		style?: string;
		optionStyle?: string;
		[key: string]: any;
	}>();

	let companies = $state<Company[]>([]);
	let suppliers = $state<Company[]>([]);
	let buildings = $state<Building[]>([]);
	let transactionTypes = $state<TransactionType[]>([]);

	$effect(() => {
		if (['supplier', 'company', 'building', 'transactionType'].includes(type)) {
			fetchOptions(type);
		}
	});

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

	// Helper to get correct option array based on type
	const getOptions = () => {
		if (type === 'supplier') return suppliers;
		if (type === 'company') return companies;
		if (type === 'building') return buildings;
		if (type === 'transactionType') return transactionTypes;
		return [];
	};
</script>

{#if type === 'obs'}
	<textarea
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
		{...rest}
		bind:value
		oninput={handleInput}
	></textarea>
{:else if ['supplier', 'company', 'building', 'transactionType'].includes(type)}
	<select {id} {disabled} {required} {placeholder} {style} {...rest} bind:value>
		{#each getOptions() as option}
			<option value={option.id} style={optionStyle}>
				{option.name || option.id}
			</option>
		{/each}
	</select>
{:else if type == 'bool'}
	<input
		{id}
		{disabled}
		{required}
		{placeholder}
		{style}
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
		{...rest}
		bind:value
		type={type === 'value' || type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
		oninput={handleInput}
	/>
{/if}

<style>
	textarea,
	input,
	select {
		display: block;
		height: 100%; /* Fallback for older browsers */
		height: -moz-available; /* Firefox */
		height: -webkit-fill-available; /* Chrome, Safari, Edge */
		height: stretch; /* Modern standard */
		width: 100%;
		min-width: 0;
		background-color: transparent;
		border: none;
		outline: none;
	}
</style>
