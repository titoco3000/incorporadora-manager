<script lang="ts">
	interface Slice {
		label: string;
		color: string;
		value: number;
	}

	let data = $state<Slice[]>([
		{ label: 'apples', color: 'red', value: 200 },
		{ label: 'bananas', color: 'yellow', value: 300 },
		{ label: 'oranges', color: 'orange', value: 300 },
		{ label: 'grapes', color: 'purple', value: 300 },
		{ label: 'mangoes', color: '#cdf031', value: 100 },
		{ label: 'strawberries', color: 'pink', value: 500 }
	]);

	// state to track which label is currently hovered
	let hoveredLabel = $state<string | null>(null);

	const total = $derived(data.reduce((sum, s) => sum + s.value, 0));
	let width = $state(0);

	const processedSlices = $derived.by(() => {
		let currentAngle = 0;
		const radius = width * 0.5;

		return data.map((slice) => {
			const startAngle = currentAngle;
			const sliceAngle = (slice.value / total) * 360;
			currentAngle += sliceAngle;

			// get coordinates on a circle mapped to 0-100%
			const getCoords = (angleInDegrees: number) => {
				const angleInRad = ((angleInDegrees - 90) * Math.PI) / 180;
				return {
					x: radius * (1 + Math.cos(angleInRad)),
					y: radius * (1 + Math.sin(angleInRad))
				};
			};

			const start = getCoords(startAngle);
			const end = getCoords(currentAngle);

			// For CSS path(), we draw: Move to center -> Line to start -> Arc to end -> Close
			const largeArc = sliceAngle > 180 ? 1 : 0;
			const clipPath = `path('M ${radius} ${radius} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z')`;

			return { ...slice, clipPath };
		});
	});

	// as a fallback, draw the slices as bg of the pie
	const conicGradient = $derived.by(() => {
		let currentPercent = 0;
		const parts = data.map((slice) => {
			const start = currentPercent;
			const end = start + (slice.value / total) * 100;
			currentPercent = end;
			return `${slice.color} ${start}% ${end}%`;
		});
		return `conic-gradient(${parts.join(', ')})`;
	});
</script>

<main>
	<div class="pie" bind:clientWidth={width} style:background={conicGradient}>
		{#each processedSlices as slice}
			<div
				class="slice"
				class:highlighted={hoveredLabel === slice.label}
				style:background-color={slice.color}
				style:clip-path={slice.clipPath}
				onmouseenter={() => (hoveredLabel = slice.label)}
				onmouseleave={() => (hoveredLabel = null)}
				role="presentation"
			></div>
		{/each}
	</div>

	<div class="labels">
		{#each processedSlices as slice}
			<div
				class="label"
				class:highlighted={hoveredLabel === slice.label}
				onmouseenter={() => (hoveredLabel = slice.label)}
				onmouseleave={() => (hoveredLabel = null)}
				role="presentation"
			>
				<div class="tag" style:background-color={slice.color}></div>
				<div>
					{slice.label} - {((slice.value / total) * 100).toFixed(1)}%
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
	.pie {
		position: relative;
		width: 60vw;
		max-width: 300px;
		aspect-ratio: 1;
		border-radius: 50%;
	}

	.slice {
		position: absolute;
		inset: 0;
		cursor: pointer;
		transition:
			filter 0.2s,
			transform 0.2s;
	}

	.slice.highlighted {
		filter: brightness(1.1);
		transform: scale(1.05);
		z-index: 10;
	}

	.label {
		display: flex;
		gap: 0.5em;
		padding: 0.4em;
		border-radius: 4px;
		transition: background 0.2s;
		cursor: default;
	}

	.label.highlighted {
		background: #f0f0f0;
		color: rgb(45, 45, 45);
	}

	.tag {
		width: 1.2em;
		height: 1.2em;
		border-radius: 50%;
	}
</style>
