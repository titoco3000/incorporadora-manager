<script lang="ts">
	import { api } from '$lib/api';
	import type { Company } from '$lib/types/api'; 
	import FormInput from '../components/FormInput.svelte';
	import BaseForm from '../components/BaseForm.svelte';

	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Company, 'id'> = {
				name: formData.name,
				cnpj: formData.cnpj || null,
				hqAddress: null,
				stateId: formData.stateId || null,
				municipalityId: formData.municipalityId || null,
				transactionTypeId: formData.transactionTypeId ? parseInt(formData.transactionTypeId) : null,
				isSupplier: true,
				obs: formData.obs || null
			};

			await api.companies.post(payload);
			
			alert('Fornecedor cadastrado com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar fornecedor:', error);
			alert('Erro ao salvar os dados do fornecedor.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Novo Fornecedor" let:formId>
	<FormInput {formId} label="Nome" type="text" name="name" grow={1} required />
	<FormInput {formId} label="CNPJ" type="cnpj" name="cnpj" grow={0.5} />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm>