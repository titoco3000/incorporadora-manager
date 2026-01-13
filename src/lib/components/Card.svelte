<script lang="ts">
	import PieChart from "./PieChart.svelte";
	export let title: string = '';
</script>

<div class="card">
	<h2>{title}</h2>
  <PieChart />
</div>

<style>
	.card {
		background-color: var(--light-black);
		border-radius: 30px;
		width: auto;
		height: 23.688rem;
    display: flex;
    flex-direction: column;
    align-items: center;
	}

	.card h2{
		color: #FFF;
    font-size: 2rem;
    padding-top: 0.95em;
    padding-bottom: 0.72em;
	}
</style>
