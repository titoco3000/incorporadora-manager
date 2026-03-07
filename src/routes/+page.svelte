<script lang="ts">
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/state';
	import DateRangeInput from '$lib/components/DateRangeInput.svelte';
	import DynamicallyReloadedBlock from '$lib/components/DynamicallyReloadedBlock.svelte';
	import BarGraph from '$lib/components/graphs/GraphKit/BarGraph.svelte';
	import PieGraph from '$lib/components/graphs/GraphKit/PieGraph.svelte';
	import type { DateString } from '$lib/types/DateString';

	let { data } = $props();

	// Helper to format Date objects to YYYY-MM-DD
	function formatDate(date: Date): DateString {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}` as DateString;
	}

	const today = new Date();
	const lastYear = new Date();
	lastYear.setFullYear(today.getFullYear() - 1);

	const defaultStart = formatDate(lastYear);
	const defaultEnd = formatDate(today);

	let start = $state<DateString>(
		(page.url.searchParams.get('start') as DateString) || defaultStart
	);
	let end = $state<DateString>((page.url.searchParams.get('end') as DateString) || defaultEnd);

	let mounted = false;
	$effect(() => {
		mounted = true;
	});

	$effect(() => {
		// Access start and end to register them as dependencies
		const s = start;
		const e = end;

		if (!mounted) return;

		const url = new URL(page.url);
		const urlStart = url.searchParams.get('start') || defaultStart;
		const urlEnd = url.searchParams.get('end') || defaultEnd;

		// Only navigate if the state is different from the URL and not the default
		if (s !== urlStart || e !== urlEnd) {
			url.searchParams.set('start', s);
			url.searchParams.set('end', e);

			goto(url.href, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			});
		}
	});
</script>

<main>
	<header>
		<div class="title-block"></div>
		<div class="header-controls">
			<DateRangeInput bind:start bind:end />
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
				<h3>Gastos por Área</h3>
				<DynamicallyReloadedBlock loading={navigating.to != null}>
					<PieGraph data={data.pieData} />
				</DynamicallyReloadedBlock>
			</div>
			<div class="panel volume-imoveis">
				<h3>Entradas e saidas por Imóvel</h3>
				<DynamicallyReloadedBlock loading={navigating.to != null}>
					<BarGraph data={data.barData} />
				</DynamicallyReloadedBlock>
			</div>
		</div>
		<div class="panel-container column thin-column">
			<div class="panel next-contract-end"></div>
			<div class="panel main-suppliers"></div>
		</div>
	</div>
</main>

<style>
	main {
		padding: 0 50px;
	}
	header {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		margin: 30px 0;
	}
	.panels {
		display: flex;
		flex-wrap: wrap;
	}
	.panel-container {
		display: flex;
	}
	.panel {
		background-color: var(--bg-color-2);
		min-height: 100px;
		min-width: 100px;
		margin: 10px;
		border: 1px solid var(--border-color-1);
		border-radius: var(--border-radius);
		flex-grow: 1;
	}
	.top-row {
		width: 100%;
	}
	.column {
		display: flex;
		flex-direction: column;
	}
	.wide-column {
		min-width: 60%;
		flex-grow: 3/5;
	}
	.gastos-por-area {
		min-width: 400px;
	}
	.thin-column {
		min-width: 40%;
	}
	h3 {
		padding: 0.5em;
		text-align: center;
		color: var(--text-color-1);
	}
</style>
