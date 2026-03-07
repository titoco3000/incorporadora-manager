<script lang="ts">
	interface Bar {
		label: string;
		value: number;
		negativeValue?: number;
	}

	let {
		colors = ['red', 'blue'],
		data = [],
		valueTransformFunc
	} = $props<{
		colors?: string[];
		data?: Bar[];
		valueTransformFunc?: (v: number) => string;
	}>();

	$effect(() => console.log(data));

	const largestValue = $derived(
		Math.max(...data.map((bar: Bar) => Math.max(bar.value, Math.abs(bar.negativeValue || 0.001))))
	);

	const hasNegatives = $derived(data.some((bar: Bar) => bar.negativeValue));

	const processedBars = $derived(
		data.map((bar: Bar, i: number) => ({
			label: bar.label,
			positive: bar.value,
			negative: bar.negativeValue || 0
		}))
	);

	let width = $state(0);
</script>

<main>
	<div class="bars-container" bind:clientWidth={width}>
		{#each processedBars as bar, i}
			<div class="row" role="presentation">
				<div class="bar-visual">
					{#if hasNegatives}
						<div class="sided-bar-container negative">
							<div
								class="sided-bar"
								style:width={`${(bar.negative / largestValue) * 100}%`}
								style:background-color={colors[0]}
							></div>
						</div>
					{/if}
					<div class="divider"></div>
					<div class="sided-bar-container positive">
						<div
							class="sided-bar"
							style:width={`${(bar.positive / largestValue) * 100}%`}
							style:background-color={colors[1]}
						></div>
					</div>
				</div>
				<div class="label" class:hasNegatives>
					{#if hasNegatives}
						<div class="left-label">
							{valueTransformFunc ? valueTransformFunc(bar.negative) : bar.negative}
						</div>
					{/if}
					<div class="main-label">{bar.label}</div>
					<div class="right-label">
						{valueTransformFunc ? valueTransformFunc(bar.positive) : bar.positive}
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>

<style>
	main {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1em;
		padding: 1em;
	}
	.bars-container {
		position: relative;
		width: 80vw;
		max-width: 600px;
	}

	.bar-visual {
		display: flex;
		height: 100%;
	}
	.row {
		width: 100%;
		height: 40px;
		position: relative;
	}
	.label {
		position: absolute;
		top: 0;
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: space-between;
		width: 100%;
	}
	.label.hasNegatives {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}
	.left-label {
		text-align: left;
	}
	.main-label {
		text-align: center;
		color: white;
		font-weight: bold;
	}
	.right-label {
		text-align: right;
	}

	.divider {
		height: 100%;
		width: 2px;
		background-color: rgb(69, 69, 69);
	}

	.sided-bar-container {
		width: 100%;
		flex-grow: 1;
	}

	.positive {
		text-align: left;
	}

	.negative {
		text-align: right;
	}

	.sided-bar {
		height: 80%;
		display: inline-block;
	}

	.negative .sided-bar {
		transform-origin: right center;
	}
	.positive .sided-bar {
		transform-origin: left center;
	}

	.label > *,
	.sided-bar {
		transition:
			filter 0.2s,
			transform 0.2s,
			font-size 0.2s,
			color 0.2s;
	}
	.row:hover .label > * {
		font-size: 1.2em;
		color: white;
	}
	.row:hover .sided-bar {
		transform: scaleY(1.1);
		filter: brightness(1.1);
	}
</style>
