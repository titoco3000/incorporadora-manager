<script lang="ts">
	import { api } from '$lib/api';
	import type { Contact } from '$lib/types/api'; 
	import FormInput from '../components/FormInput.svelte';
	import BaseForm from '../components/BaseForm.svelte';

	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Contact, 'id'> = {
				name: formData.name,
				email: formData.email || null,
				phone: formData.phone || null,
				role: formData.role || null,
				companyId: parseInt(formData.companyId),
				obs: formData.obs || null
			};

			await api.contacts.post(payload);
			
			alert('Contato cadastrado com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar contato:', error);
			alert('Erro ao salvar os dados do contato.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Novo Contato" let:formId>
	<FormInput {formId} label="Nome" type="text" name="name" grow={1} required />
	<FormInput {formId} label="Email" type="email" name="email" grow={0.5} />
	<FormInput {formId} label="Telefone" type="phone" name="phone" grow={0.5} />
	<FormInput {formId} label="Cargo" type="text" name="role" grow={0.5} />
	<FormInput {formId} label="Empresa" type="company" name="companyId" grow={0.5} required />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm>