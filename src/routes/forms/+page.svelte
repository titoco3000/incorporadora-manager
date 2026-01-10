<script>
	import BuildingForm from "$lib/components/forms/forms/BuildingForm.svelte";
	import ClientForm from "$lib/components/forms/forms/ClientForm.svelte";
	import ContactForm from "$lib/components/forms/forms/ContactForm.svelte";
	import SupplierForm from "$lib/components/forms/forms/SupplierForm.svelte";
	import TransactionForm from "$lib/components/forms/TransactionForm.svelte";

</script>
<div><BuildingForm/></div>
<div><ClientForm/></div>
<div><ContactForm/></div>
<div><SupplierForm/></div>
<div><TransactionForm/></div>

<style>
	div{
		padding: 10px;
		width: 50%;
		height: auto;
		margin: 10px;
		resize: horizontal;
		overflow: hidden auto;
		border: 2px dashed gray;
	}
</style>