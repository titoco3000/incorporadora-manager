<script lang="ts">
	import NewBaseForm from '../components/NewBaseForm.svelte';
	import { api } from '$lib/api';
	import type { Company } from '$lib/types/api';

	const post = async (params: Omit<Company, 'id'>) => {
		api.companies.post({ ...params, isSupplier: false });
	};
</script>

<NewBaseForm
	fields={[
		{
			name: 'name',
			type: 'text',
			label: 'Nome',
			required: true
		},
		{
			label: 'CNPJ',
			type: 'cnpj',
			name: 'cnpj',
			size: 1
		},
		{
			label: 'Endereço da Sede',
			type: 'text',
			name: 'hqAddress',
			size: 1
		},
		{
			label: 'Inscrição Estadual',
			type: 'text',
			name: 'stateId',
			size: 0.5
		},
		{
			label: 'Inscrição Municipal',
			type: 'text',
			name: 'municipalityId',
			size: 0.5
		},
		{
			label: 'Observações',
			type: 'obs',
			name: 'obs',
			size: 1
		}
	]}
	{post}
/>
