<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import BarChartCard from '$lib/components/BarChartCard.svelte';
	import ReportCard from '$lib/components/ReportCard.svelte';
</script>

<header>
	<h1>Dashboard</h1>
</header>
<main>
	<div class="esquerda">
		<div class="superior">
			<Card title="Ganhos por imóvel" />
			<Card title="Gastos por imóvel" />
		</div>
		<BarChartCard title="Custos X Ganhos" />
	</div>
	<ReportCard title="Relatórios" />
</main>

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

	main {
		display: flex;
		justify-content: center;
		margin-top: 2.5rem;
	}
	.esquerda {
		width: 58.063rem;
		margin-right: 2.5rem;
	}

	.superior {
		display: flex;
		justify-content: space-between;
		margin-bottom: 3.25rem;
	}
</style>
