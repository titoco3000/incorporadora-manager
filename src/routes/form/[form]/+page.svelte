<script lang="ts">
	import BuildingForm from '$lib/components/forms/forms/BuildingForm.svelte';
	import ClientForm from '$lib/components/forms/forms/ClientForm.svelte';
	import ContactForm from '$lib/components/forms/forms/ContactForm.svelte';
	import SupplierForm from '$lib/components/forms/forms/SupplierForm.svelte';
	import TransactionForm from '$lib/components/forms/forms/TransactionForm.svelte';
	import ContractForm from '$lib/components/forms/forms/ContractForm.svelte';
	import TransactionTypeForm from '$lib/components/forms/forms/TransactionTypeForm.svelte';

	const formMap = {
		'transaction-type': TransactionTypeForm,
		contact: ContactForm,
		supplier: SupplierForm,
		building: BuildingForm,
		client: ClientForm,
		contract: ContractForm,
		transaction: TransactionForm
	} as const;

	interface DataType {
		formID: string;
	}

	let { data } = $props<{ data: DataType }>();
</script>

<main>
	<section class="form-area">
		<div class="form-container">
			{#if formMap[data.formID]}
				{@const Renderer = formMap[data.formID]}
				<Renderer />
			{/if}
		</div>
	</section>
</main>

<style>
	main {
		width: 100%;
		flex: 1;
		padding: 2rem;
		overflow: auto hidden;
	}

	.form-area {
		width: 100%;
		max-width: 900px;
	}

	.form-container {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
