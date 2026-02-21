<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ContainerWithNavbar from '$lib/components/ContainerWithNavbar.svelte';
	import LoginScreen from '$lib/components/LoginScreen.svelte';

	let { children } = $props();

	const userAuthenticated = true;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{#if userAuthenticated}
		<ContainerWithNavbar>
			{@render children()}
		</ContainerWithNavbar>
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
