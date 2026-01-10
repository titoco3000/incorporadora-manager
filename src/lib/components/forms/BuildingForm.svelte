<script lang="ts">
	import { api } from '$lib/api';
	import type { Building } from '$lib/types/api'; 
	import FormInput from '../FormInput.svelte';
	import BaseForm from './BaseForm.svelte';


	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Building, 'id'> = {
				name: formData.name,      
				address: formData.address,
				iptuId: formData.iptuId || null,
				terrainArea: formData.terrainArea ? parseFloat(formData.terrainArea) : null,
				builtArea: formData.builtArea ? parseFloat(formData.builtArea) : null,
				height: formData.height ? parseFloat(formData.height) : null,
				floorWeightCapacity: formData.floorWeightCapacity ? parseFloat(formData.floorWeightCapacity) : null,
				insuranceInfo: formData.insuranceInfo || null,
				obs: formData.obs || null
			};

			await api.buildings.post(payload);
			
			alert('Imóvel cadastrado com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar imóvel:', error);
			alert('Erro ao salvar os dados do imóvel.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Novo Imóvel" let:formId>
	<FormInput {formId} label="Nome" type="text" name="name" grow={1} required />
	<FormInput {formId} label="Endereço" type="text" name="address" grow={1} required />

	<FormInput {formId} label="Código de IPTU" type="text" name="iptuId" grow={1} />

	<FormInput {formId} label="Área do Terreno (m²)" type="number" name="terrainArea" grow={0.5} />
	<FormInput {formId} label="Área Construída (m²)" type="number" name="builtArea" grow={0.5} />

	<FormInput {formId} label="Altura (m)" type="number" name="height" grow={0.5} />
	<FormInput {formId} label="Capacidade do Piso (ton/m²)" type="number" name="floorWeightCapacity" grow={0.5} />

	<FormInput {formId} label="Informações do Seguro" type="obs" name="insuranceInfo" grow={1} />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm>
