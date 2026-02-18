<script lang="ts">
	import { api } from '$lib/api';
	import BaseForm from '../components/BaseForm.svelte';

	let formData = $state({});
</script>

<BaseForm
	label="Novo Tipo de Transação"
	bind:data={formData}
	fields={[
		{
			label: 'Nome',
			type: 'text',
			name: 'name',
			size: 0.5,
			required: true
		},
		{
			label: 'É um Gasto',
			type: 'bool',
			name: 'is_expense',
			size: 0.5,
			required: true
		}
	]}
	post={api.transactionTypes.post}
/>
