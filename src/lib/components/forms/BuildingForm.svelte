<script lang="ts">
	import FormInput from '../FormInput.svelte';
	import BaseForm from './BaseForm.svelte';

</script>

<BaseForm onSubmit={(data) => console.log(data)} label="Novo Imóvel" let:formId> 
	<FormInput {formId} label="Nome" type="text" name="name" grow={1} required />
	<FormInput {formId} label="Endereço" type="text" name="address" grow={1} />

	<FormInput {formId} label="Código de IPTU" type="text" name="iptuId" grow={1} />

	<FormInput {formId} label="Área do Terreno (m²)" type="number" name="terrainArea" grow={0.5} />
	<FormInput {formId} label="Área Construída (m²)" type="number" name="builtArea" grow={0.5} />
	
  <FormInput {formId} label="Altura (m)" type="number" name="height" grow={0.5} />
  <FormInput {formId} label="Capacidade do Piso (ton/m²)" type="number" name="floorWeightCapacity" grow={0.5} />

	<FormInput {formId} label="Informações do Seguro" type="obs" name="insuranceInfo" grow={1} />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm>
