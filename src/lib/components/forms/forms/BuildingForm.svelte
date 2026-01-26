<script lang="ts">
	import { api } from '$lib/api';
	import BaseForm from '../components/BaseForm.svelte';
</script>

<BaseForm
	label="Novo Imóvel"
	fields={[
		{
			name: 'name',
			type: 'text',
			label: 'Nome',
			required: true,
			size: 1
		},
		{
			label: 'Endereço',
			type: 'text',
			name: 'address',
			size: 1,
			required: true
		},
		{
			label: 'Código de IPTU',
			type: 'text',
			name: 'iptuId',
			size: 1
		},
		{
			label: 'Área do Terreno (m²)',
			type: 'number',
			name: 'terrainArea',
			size: 0.5
		},
		{
			label: 'Área Construída (m²)',
			type: 'number',
			name: 'builtArea',
			size: 0.5
		},
		{
			label: 'Altura (m)',
			type: 'number',
			name: 'height',
			size: 0.5
		},
		{
			label: 'Capacidade do Piso (ton/m²)',
			type: 'number',
			name: 'floorWeightCapacity',
			size: 0.5
		},
		{
			label: 'Informações do Seguro',
			type: 'obs',
			name: 'insuranceInfo',
			size: 1
		},
		{
			label: 'Observações',
			type: 'obs',
			name: 'obs',
			size: 1
		}
	]}
	post={api.buildings.post}
/>
