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

	const total = $derived(data.reduce((sum, s) => sum + s.value, 0));

	let width = $state(0);

	// Calculate the CSS clip-path for each slice
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
</script>

<main>
	<div class="pie" bind:clientWidth={width}>
		{#each processedSlices as slice}
			<div
				class="slice"
				style:background-color={slice.color}
				style:clip-path={slice.clipPath}
				title="{slice.label}: {slice.value}"
			></div>
		{/each}
	</div>

	<div class="labels">
		{#each processedSlices as slice}
			<div class="label">
				<div class="tag" style={`background-color:${slice.color}`}></div>
				<div>
					{slice.label} - {(slice.value/total * 100).toFixed(1)}%
				</div>
			</div>			
		{/each}
	</div>
</main>

<style>
	main{
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
		background: #eee;
		border-radius: 50%;
	}

	.slice {
		position: absolute;
		inset: 0;
		cursor: pointer;
	}

	.slice:hover {
		filter: brightness(1.1);
	}
	.label{
		display: flex;
		gap: 0.3em;
		padding: 0.3em;
	}
	.tag{
		width: 1.2em;
		height: 1.2em;
		border-radius: 50%;
	}
</style>
