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
			size: 0.5
		},
		{
			label: 'Código de IPTU',
			type: 'text',
			name: 'iptuId',
			size: 0.5
		},
		{
			label: 'Endereço',
			type: 'text',
			name: 'address',
			size: 1,
			required: true
		},
		{
			label: 'Informações do Seguro',
			type: 'obs',
			name: 'insuranceInfo',
			size: 1
		},
		{
			label: 'Características',
			type: 'obs',
			name: 'characteristics',
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
