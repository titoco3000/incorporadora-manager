<script lang="ts">
	import { api } from '$lib/api';
	import BaseForm from '../components/BaseForm.svelte';
</script>

<BaseForm
	label="Novo Contato"
	fields={[
		{ name: 'name', type: 'text', label: 'Nome', required: true, size: 1 },
		{ name: 'email', type: 'email', label: 'Email', size: 0.5 },
		{ name: 'phone', type: 'phone', label: 'Telefone', size: 0.5 },
		{ name: 'role', type: 'text', label: 'Cargo', size: 0.5 },
		{
			name: 'company',
			postKey: 'companyId',
			type: 'company',
			label: 'Empresa',
			size: 0.5,
			required: true
		},
		{ name: 'obs', type: 'obs', label: 'Observações', size: 1 }
	]}
	post={api.contacts.post}
/>
