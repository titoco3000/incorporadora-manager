<script lang="ts">
	import { api } from '$lib/api';
	import type { Contract } from '$lib/types/api'; 
	import FormInput from '../components/FormInput.svelte';
	import BaseForm from '../components/BaseForm.svelte';

	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Contract, 'id'> = {
				startDate: formData.startDate,
				buildingId: parseInt(formData.buildingId),
				companyId: parseInt(formData.companyId),
				startValue: formData.startValue || null,
				expirationDate: formData.expirationDate || null,
				obs: formData.obs || null
			};

			await api.contracts.post(payload);
			
			alert('Contrato cadastrado com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar contrato:', error);
			alert('Erro ao salvar os dados do contrato.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Novo Contrato" let:formId>
	<FormInput {formId} label="Data de Início" type="date" name="startDate" grow={0.5} required />
	<FormInput {formId} label="Data de Vencimento" type="date" name="expirationDate" grow={0.5} />
	<FormInput {formId} label="Imóvel" type="building" name="buildingId" grow={0.5} required />
	<FormInput {formId} label="Empresa" type="company" name="companyId" grow={0.5} required />
	<FormInput {formId} label="Valor Inicial" type="value" name="startValue" grow={0.5} />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm>