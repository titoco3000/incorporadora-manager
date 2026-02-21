<script lang="ts">
	import CompanyHeader from './CompanyHeader.svelte';
	import FormInput from './forms/components/FormInput.svelte';
</script>

<section>
	<form>
		<CompanyHeader />
		<!-- <FormInput field={{}}/> -->
		<input type="email" name="" id="" />
		<input type="password" name="" id="" />
	</form>
</section>

<style>
	section {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	form {
		border: 1px solid var(--border-color-1);
		border-radius: var(--border-radius);
		padding: 20px;
	}
</style>
