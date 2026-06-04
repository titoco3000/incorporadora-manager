<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ContainerWithNavbar from '$lib/components/ContainerWithNavbar.svelte';
	import LoginScreen from '$lib/components/LoginScreen.svelte';

	let { children, data } = $props();

	const userAuthenticated = $derived(data.user != null);
	const isRegisterRoute = $derived(($page.route.id as string) === '/register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{#if userAuthenticated}
		<ContainerWithNavbar>
			{@render children()}
		</ContainerWithNavbar>
	{:else if isRegisterRoute}
		{@render children()}
	{:else}
		<LoginScreen />
	{/if}
</main>

<style>
	main {
		width: 100vw;
		height: 100svh;
		display: flex;
		flex-direction: column;
	}
</style>
