<script lang="ts">
	import type { Company, Building, TransactionType } from '$lib/types/api';
	import { api } from '$lib/api';
	import type { FormFieldDefinition } from '$lib/types/forms';

	let {
		field,
		value = $bindable(),
		disabled = false
	} = $props<{
		field: FormFieldDefinition;
		value: any;
		disabled?: boolean;
	}>();

	// Local state for dropdown options
	let companies = $state<Company[]>([]);
	let suppliers = $state<Company[]>([]);
	let buildings = $state<Building[]>([]);
	let transactionTypes = $state<TransactionType[]>([]);

	$effect(() => {
		if (['supplier', 'company', 'building', 'transactionType'].includes(field.type)) {
			fetchOptions(field.type);
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

		if (field.type === 'cnpj') {
			rawValue = formatCnpj(rawValue);
			target.value = rawValue; // Keep cursor/display in sync
		} else if (field.type === 'value') {
			// Note: Formatting currency usually happens on blur or via a masked input
			// for better UX, but here we update the bound value.
		}

		value = rawValue;
		if (field.onChange) field.onChange(rawValue);
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
		if (field.type === 'supplier') return suppliers;
		if (field.type === 'company') return companies;
		if (field.type === 'building') return buildings;
		if (field.type === 'transactionType') return transactionTypes;
		return [];
	};

	const getValueFromID = (value: number, type: string) => {
		if (!value) return value;

		switch (type) {
			case 'supplier':
				return suppliers.find((s) => s.id === value);
			case 'company':
				return companies.find((c) => c.id === value);
			case 'building':
				return buildings.find((b) => b.id === value);
			case 'transactionType':
				return transactionTypes.find((t) => t.id === value);
			default:
				return value;
		}
	};
</script>

<div
	class="field-wrapper"
	style="min-width: {field.minwidth || 200}px; flex-grow: {field.size ||
		1}; flex-basis: calc({(field.size || 1) * 100}% - 1rem); max-width: 100%;"
>
	<div class="field-container">
		{#if field.label}
			<label class="field-label" for={field.name}>
				{field.label}
				{field.required ? '*' : ''}
			</label>
		{/if}

		{#if field.type === 'obs'}
			<textarea
				id={field.name}
				class="field-input field-textarea"
				{disabled}
				required={field.required}
				bind:value
				oninput={handleInput}
				placeholder={field.label}
				autocomplete="off"
			></textarea>
		{:else if ['supplier', 'company', 'building', 'transactionType'].includes(field.type)}
			<select
				id={field.name}
				class="field-input field-select"
				{disabled}
				required={field.required}
				bind:value
				onchange={(e) =>
					field.onChange?.(getValueFromID(parseFloat(e.currentTarget.value), field.type))}
			>
				<option value=""
					>Selecione um{field.type === 'supplier'
						? ' fornecedor'
						: field.type === 'company'
							? 'a empresa'
							: field.type === 'building'
								? ' imóvel'
								: ' tipo'}</option
				>
				{#each getOptions() as option}
					<option value={option.id}>
						{option.name || option.id}
					</option>
				{/each}
			</select>
		{:else}
			<input
				id={field.name}
				type={field.type === 'value' || field.type === 'number'
					? 'number'
					: field.type === 'date'
						? 'date'
						: 'text'}
				class="field-input"
				{disabled}
				required={field.required}
				value={value ?? ''}
				autocomplete="off"
				oninput={handleInput}
				placeholder={field.type === 'cnpj' ? '00.000.000/0000-00' : ''}
			/>
		{/if}
	</div>
</div>

<style>
	.field-wrapper {
		flex-shrink: 1;
		flex-basis: auto;
		box-sizing: border-box;
		max-width: 100%;
		container-type: inline-size;
	}

	/* Use container queries instead of media queries */
	@container (max-width: 600px) {
		.field-wrapper {
			flex-basis: 100% !important;
			min-width: 100% !important;
		}
	}

	.field-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.field-label {
		font-size: 0.875rem;
		font-weight: 500;
		display: block;
	}

	.field-input {
		width: 100%;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		line-height: 1.5;
		background-color: var(--bg-color-3);
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		transition:
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
		box-sizing: border-box;
	}

	.field-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.field-input:disabled {
		cursor: not-allowed;
	}

	.field-input::placeholder {
		color: #9ca3af;
	}
	.field-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.field-select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem;
	}
</style>
