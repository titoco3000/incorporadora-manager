<script lang="ts">
	export let title: string = '';
</script>

<aside>
	<h2>{title}</h2>
</aside>

<style>
	aside {
		width: 22.375rem;
		height: 57.563rem;
		background-color: var(--light-black);
		border-radius: 30px;
    display: flex;
    flex-direction: column;
	}
	aside h2{
		color: #FFF;
    font-size: 2rem;
    padding-top: 0.95em;
    padding-bottom: 0.72em;
    margin: 0 auto;
	}
</style>
