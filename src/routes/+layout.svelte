<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	<section>
		{@render children()}
	</section>
	<Footer/>
</main>

<style>
	main{
		width: 100vw;
		height: 100svh;
		display: flex;
		flex-direction: column;
	}
	section{
		flex-grow: 1;
		min-height: 0;
		overflow: auto;
	}
</style>
