<script lang="ts">
	import { api } from '$lib/api';
	import BaseForm from '../components/BaseForm.svelte';
</script>

<BaseForm
	label="Novo Fornecedor"
	fields={[
		{ name: 'name', type: 'text', label: 'Nome', required: true },
		{ name: 'cnpj', type: 'cnpj', label: 'CNPJ' },
		{ name: 'obs', type: 'obs', label: 'Observações' }
	]}
	post={(data) =>
		api.companies.post({
			name: '',
			obs: null,
			cnpj: null,
			transactionTypeId: null,
			hqAddress: null,
			stateId: null,
			municipalityId: null,
			...data,
			isSupplier: true
		})}
/>
