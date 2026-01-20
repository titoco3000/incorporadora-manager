<script lang="ts">
	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';

	export let title: string = '';
	export let transactionData: any;

	const transactionsTypes = transactionData.referenceData.transactionTypeId;

	const NUMBER_OF_MONTHS = 5;

	const today = new Date();
	const profitsVSExpensesPerMonth = transactionData.rows.reduce(
		(acc: Record<number, number>, tr: any) => {
			const transactionDate = new Date(tr.date);
			const nMonthsAgo = new Date();
			nMonthsAgo.setMonth(today.getMonth() - NUMBER_OF_MONTHS);
			if (transactionDate >= nMonthsAgo && transactionDate <= today) {
				const value = Number(tr.value);
				if (isNaN(value)) return acc;

				const transactionMonth = transactionDate.getMonth();
				if (!acc[transactionMonth]) acc[transactionMonth] = 0;

				const transactionType = transactionsTypes.find(
					(type: any) => type.id === tr.transactionTypeId
				);
				if (!transactionType) return acc;

				if (transactionType.isExpense) {
					acc[transactionMonth] += value * -1;
				} else {
					acc[transactionMonth] += value;
				}
			}
			return acc;
		},
		{}
	);

	function getLastMonthsNames(locale = 'pt-BR') {
		const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
		const months = [];

		for (let i = NUMBER_OF_MONTHS; i >= 0; i--) {
			const d = new Date(today);
			d.setMonth(today.getMonth() - i);
			months.push(
				formatter
					.format(d)
					.replace('.', '')
					.split(' ')
					.map((word) => (word !== 'de' ? word.charAt(0).toUpperCase() + word.slice(1) : word))
					.join(' ')
			);
		}

		return months;
	}
	function getLastMonthsProfits() {
		const months = [];

		for (let i = NUMBER_OF_MONTHS; i >= 0; i--) {
			const d = new Date(today);
			d.setMonth(today.getMonth() - i);
			months.push(profitsVSExpensesPerMonth[d.getMonth()] ?? 0);
		}
		return months;
	}

	const options: ApexOptions = {
		series: [
			{
				name: 'Resultado',
				data: getLastMonthsProfits()
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
			formatter: (val) => `${Math.round(((val/1000) + Number.EPSILON) * 100) / 100}k`,
			style: {
				colors: ['#ffffff'],
				fontSize: '18px'
			}
		},
		xaxis: {
			categories: getLastMonthsNames(),
			min: -20000,
			max: 20000,
			axisBorder: { show: false },
			axisTicks: { show: false },
			labels: {
				style: {
					colors: '#ffffff',
					fontSize: '14px'
				}
			}
		},
		yaxis: {
			labels: {
				style: {
					colors: '#ffffff',
					fontSize: '14px'
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
