<script lang="ts">
	import { api } from '$lib/api';
	import type { Building, Company, TransactionType } from '$lib/types/api';
	import type { DateString } from '$lib/types/DateString';
	import type { FormFieldDefinition, FormFieldType } from '$lib/types/forms';
	import BaseForm from '../components/BaseForm.svelte';

	let formData = $state<{
		company: Company | null;
		transactionType: TransactionType | null;
		building: Building | null;
		date: DateString;
	}>({
		company: null,
		transactionType: null,
		building: null,
		date: new Date().toISOString().split('T')[0] as DateString
	});

	let companiesFieldType: FormFieldType = $state('company');

	let dynamicFields: FormFieldDefinition[] = $derived([
		{
			label: formData.transactionType ? (formData.transactionType.isExpense ? 'Fornecedor' : 'Cliente') : 'Empresa',
			type: companiesFieldType,
			name: 'company',
			postKey: 'companyId',
			size: 0.5,
			required: true,
			onChange: async (e: any) => {
				if (e) {
					const ttypes = await api.transactionTypes.get();
					formData.transactionType = formData.transactionType || ttypes[e.transactionTypeId];
				}
			}
		},
		{
			label: 'Imóvel',
			type: 'building',
			name: 'building',
			postKey: 'buildingId',
			size: 0.5
		},
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
			label: 'Nº Documento',
			type: 'text',
			name: 'document',
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
