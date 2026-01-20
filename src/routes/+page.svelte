<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import BarChartCard from '$lib/components/BarChartCard.svelte';
	import ReportCard from '$lib/components/ReportCard.svelte';
	import Header from '$lib/components/Header.svelte';

	export let data: any;
	console.log(data)
</script>

<Header title="Dashboard" />
<main>
	<div class="esquerda">
		<div class="superior">
			<Card title="Ganhos por imóvel" transactionData={data} />
			<Card title="Gastos por imóvel" transactionData={data} />
		</div>
		<BarChartCard title="Custos X Ganhos" />
	</div>
	<ReportCard title="Relatórios" />
</main>

<style>
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
