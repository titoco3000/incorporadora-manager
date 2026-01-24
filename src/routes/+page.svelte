<script lang="ts">
	import DateRangeInput from "$lib/components/DateRangeInput.svelte";
	import PieGraph from "$lib/components/GraphKit/PieGraph.svelte";

</script>
<main>

	<header>
		<div class="title-block">
			<h2>Incorporadora</h2>
			<h1>Costa Leste</h1>
		</div>
		<div class="header-controls">
			<DateRangeInput onChange={(a,b)=>console.log(a,b)}/>
		</div>
	</header>
	<div class="panels">
		<div class="panel-container top-row">
			<div class="panel simple-data-panel"></div>
			<div class="panel simple-data-panel"></div>
			<div class="panel simple-data-panel"></div>
			<div class="panel simple-data-panel"></div>
		</div>
		<div class="panel-container column wide-column">
			<div class="panel gastos-por-area">
				<h3>Gastos por area</h3>
				<PieGraph/>
			</div>
			<div class="panel volume-imoveis">
				<h3>
					Entradas e saidas por Imóvel
				</h3>
			</div>
		</div>
		<div class="panel-container column thin-column">
			<div class="panel next-contract-end"></div>
			<div class="panel main-suppliers"></div>
		</div>
	</div>
</main>
<style>
	main{
		padding: 0 50px;
	}
	header{
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		margin: 30px 0;
	}
	h2{
		color: var(--text-color-1);
		font-size: 1em;
		font-weight: 100;
	}
	.panels{
		display: flex;
		flex-wrap: wrap;
	}
	.panel-container{
		display: flex;
	}
	.panel{
		background-color: var(--bg-color-2);
		min-height: 100px;
		min-width: 100px;
		margin: 10px;
		border: 1px solid var(--border-color-1);
		border-radius: var(--border-radius);
		flex-grow: 1;
	}
	.top-row{
		width: 100%;
	}
	.column{
		display: flex;
		flex-direction: column;
	}
	.wide-column{
		min-width: 60%;
		flex-grow: 3/5;
	}
	.gastos-por-area{
		min-width: 400px;
	}
	.thin-column{
		min-width: 40%;
	}
</style>