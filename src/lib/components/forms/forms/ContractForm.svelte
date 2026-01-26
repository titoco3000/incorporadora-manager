<script lang="ts">
	import { api } from '$lib/api';
	import BaseForm from '../components/BaseForm.svelte';
</script>

<BaseForm
	label="Novo Contrato"
	fields={[
		{ name: 'startDate', type: 'date', label: 'Data de Início', required: true, size: 0.5 },
		{ name: 'expirationDate', type: 'date', label: 'Data de Vencimento', size: 0.5 },
		{
			name: 'building',
			postKey: 'buildingId',
			type: 'building',
			label: 'Imóvel',
			size: 0.5,
			required: true
		},
		{
			name: 'company',
			postKey: 'companyId',
			type: 'company',
			label: 'Empresa',
			size: 0.5,
			required: true
		},
		{ name: 'startValue', type: 'number', label: 'Valor Inicial' },
		{ name: 'obs', type: 'obs', label: 'Observações' }
	]}
	post={api.contracts.post}
/>
