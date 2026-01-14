<script lang="ts">
  export let title:string = ''
</script>

<header>
	<h1>{title}</h1>
</header>

<style>
	header {
		background-color: var(--light-black);
		width: 100%;
		height: 7.875rem;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 2rem;
	}
	header h1 {
		color: #fff;
		text-align: center;
		font-size: 4rem;
	}
</style>
