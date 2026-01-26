<script lang="ts">
	import { api } from '$lib/api';
	import type { TransactionType } from '$lib/types/api';
	import type { FormFieldDefinition, FormFieldType } from '$lib/types/forms';
	import BaseForm from '../components/BaseForm.svelte';

	let formData = $state({ company: '' });

	let companiesFieldType: FormFieldType = $state('company');

	let dynamicFields: FormFieldDefinition[] = $derived([
		{
			label: 'Tipo de Transação',
			type: 'transactionType',
			name: 'transactionType',
			postKey: 'transactionTypeId',
			size: 0.5,
			required: true,
			onChange: (e: unknown) => {
				if (!formData.company && e) {
					const selection = e as TransactionType;
					companiesFieldType = selection.isExpense ? 'supplier' : 'company';
				}
			}
		},
		{
			label: 'Valor',
			type: 'value',
			name: 'value',
			size: 0.5,
			required: true
		},
		{
			label: 'Data',
			type: 'date',
			name: 'date',
			size: 0.5,
			required: true
		},
		{
			label: 'Documento',
			type: 'text',
			name: 'document',
			size: 0.5,
			required: true
		},
		{
			label: 'Empresa',
			type: companiesFieldType,
			name: 'company',
			postKey: 'companyId',
			size: 0.5,
			required: true
		},
		{
			label: 'Imóvel',
			type: 'building',
			name: 'building',
			postKey: 'buildingId',
			size: 0.5,
			required: true
		},
		{
			label: 'Observações',
			type: 'obs',
			name: 'obs',
			size: 1
		}
	]);
</script>

<BaseForm
	label="Nova Transação"
	bind:data={formData}
	fields={dynamicFields}
	post={api.transactions.post}
/>
