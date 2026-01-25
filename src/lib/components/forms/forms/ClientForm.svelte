<!-- <script lang="ts">
	import { api } from '$lib/api';
	import type { Company } from '$lib/types/api'; 
	import FormInput from '../components/FormInput.svelte';
	import BaseForm from '../components/BaseForm.svelte';

	async function handleSubmit(formData: Record<string, any>) {
		try {
			const payload: Omit<Company, 'id'> = {
				name: formData.name,
				cnpj: formData.cnpj || null,
				hqAddress: formData.hqAddress || null,
				stateId: formData.stateId || null,
				municipalityId: formData.municipalityId || null,
				transactionTypeId: formData.transactionTypeId ? parseInt(formData.transactionTypeId) : null,
				isSupplier: false,
				obs: formData.obs || null
			};

			await api.companies.post(payload);
			
			alert('Cliente cadastrado com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar cliente:', error);
			alert('Erro ao salvar os dados do cliente.');
		}
	}
</script>

<BaseForm onSubmit={handleSubmit} label="Novo Cliente" let:formId>
	<FormInput {formId} label="Nome" type="text" name="name" grow={1} required />
	<FormInput {formId} label="CNPJ" type="cnpj" name="cnpj" grow={0.5} />
	<FormInput {formId} label="Endereço da Sede" type="text" name="hqAddress" grow={1} />
	<FormInput {formId} label="Inscrição Estadual" type="text" name="stateId" grow={0.5} />
	<FormInput {formId} label="Inscrição Municipal" type="text" name="municipalityId" grow={0.5} />
	<FormInput {formId} label="Observações" type="obs" name="obs" grow={1} />
</BaseForm> -->


<!-- <script lang='ts'>
	// import { api } from '$lib/api';
	// api.companies.post
	import type { Company } from '$lib/types/api';
	import NewBaseForm from '../components/NewBaseForm.svelte';

	
	const post = async (params: Omit<Company, 'id'>) => {
		console.log(params);
	}

</script>
<NewBaseForm 
	post={post}
	fields={[
	{
		name: "name",
		size: 1,
		required: true,
		type: "text",
		label: "Nome"
	},
]}/> -->

<script lang="ts">
	import type { FormFieldDefinition } from '$lib/types/forms';
    import NewBaseForm from '../components/NewBaseForm.svelte';

    // 1. Create a reactive object for the form data
    let formData = $state({ name: "", special_code: "" });

    // 2. The fields now react to formData.name
    let dynamicFields:FormFieldDefinition[] = $derived([
        {
            name: "name",
            type: "text",
            label: "Nome",
        },
        {
            name: "special_code",
            // This now triggers because formData.name is updated via binding
            type: formData.name === "Google" ? "number" : "text",
            label: formData.name === "Google" ? "ID Number" : "Notes"
        }
    ]);
    
    const post = async (params: any) => {
        console.log("Posting:", params);
    }
</script>

<NewBaseForm 
    bind:data={formData}
    fields={dynamicFields} 
    post={post} 
/>