<!-- <script lang="ts">
	import { api } from '$lib/api';
	import type { Transaction } from '$lib/types/api'; 
	import FormInput from '../components/FormInput.svelte';
	import BaseForm from '../components/BaseForm.svelte';

	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Transaction, 'id'> = {
				transactionTypeId: parseInt(formData.transactionTypeId),
				value: formData.value,
				companyId: parseInt(formData.companyId),
				date: formData.date,
				buildingId: parseInt(formData.buildingId),
				document: formData.document,
				obs: formData.obs || null
			};

			await api.transactions.post(payload);
			
			alert('Transação cadastrada com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar transação:', error);
			alert('Erro ao salvar os dados da transação.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Nova Transação" let:formId>
	<FormInput {formId} label="Tipo de Transação" type="transactionType" name="transactionTypeId" grow={0.5} required />
	<FormInput {formId} label="Valor" type="value" name="value" grow={0.5} required />
	<FormInput {formId} label="Data" type="date" name="date" grow={0.5} required />
	<FormInput {formId} label="Documento" type="text" name="document" grow={0.5} required />
	<FormInput {formId} label="Empresa" type="company" name="companyId" grow={0.5} required />
	<FormInput {formId} label="Imóvel" type="building" name="buildingId" grow={0.5} required />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm> -->

<script lang="ts">
	import type { FormFieldDefinition, FormFieldType } from '$lib/types/forms';
	import NewBaseForm from '../components/NewBaseForm.svelte';

	let formData = $state({
		transactionType: '',
		company: ''
	});

	let companiesFieldType:FormFieldType = $state('company');

	let dynamicFields: FormFieldDefinition[] = $derived([
		{
			name: 'name',
			type: 'text',
			label: 'Nome'
		},
		{
			label: 'Tipo de Transação',
			type: 'transactionType',
			name: 'transactionType',
			postKey: 'transactionTypeId',
			size: 0.5,
			required: true,
			onChange: (e) => {
				console.log(e, formData.company)
				if (!formData.company) {
					companiesFieldType = e == '666'?'date':'company'
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

	const post = async (params: any) => {
		console.log('Posting:', params);
	};
</script>

<NewBaseForm bind:data={formData} fields={dynamicFields} {post} />
