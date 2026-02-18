<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';
	import ContainerWithNavbar from '$lib/components/ContainerWithNavbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	<ContainerWithNavbar>
		{@render children()}
	</ContainerWithNavbar>
</main>

<style>
	main {
		width: 100vw;
		height: 100svh;
		display: flex;
		flex-direction: column;
	}
</style>
