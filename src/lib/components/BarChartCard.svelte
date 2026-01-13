<script lang="ts">
	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';

	export let title: string = '';
	const options: ApexOptions = {
		series: [
			{
				name: 'Resultado',
				data: [120, -80, 150, -40, 60]
			}
		],
		chart: {
			type: 'bar',
			height: 400,
			width: '90%',
			background: 'transparent',
			toolbar: {
				show: false
			}
		},
		plotOptions: {
			bar: {
				horizontal: true,
				barHeight: '60%'
			}
		},
		colors: [
			function ({ value }) {
				return value >= 0 ? '#16BDCA' : '#F05252';
			}
		],
		dataLabels: {
			enabled: true,
			formatter: (val) => `${val}k`,
			style: {
				colors: ['#ffffff']
			}
		},
		xaxis: {
			categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
			min: -200,
			max: 200,
			axisBorder: { show: false },
			axisTicks: { show: false },
			labels: {
				style: {
					colors: '#ffffff'
				}
			}
		},
		yaxis: {
			labels: {
				style: {
					colors: '#ffffff'
				}
			}
		},
		grid: {
			borderColor: '#374151'
		},
		tooltip: {
			theme: 'dark'
		}
	};
</script>

<div class="card">
	<h2>{title}</h2>
	<div class=" w-[100%]">
		<Chart {options} class="flex items-center justify-center" />
	</div>
</div>

<style>
	.card {
		background-color: var(--light-black);
		border-radius: 30px;
		width: 100%;
		height: 30.625rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card h2 {
		color: #fff;
		font-size: 2rem;
		padding-top: 0.95em;
	}
</style>
