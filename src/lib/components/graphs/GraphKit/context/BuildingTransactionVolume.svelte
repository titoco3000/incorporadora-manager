<script lang="ts">
	import BarGraph from '../BarGraph.svelte';
</script>

<BarGraph
	data={[
		{ label: 'apples', value: 200 },
		{ label: 'bananas', value: 30 },
		{ label: 'bananas', value: 30 },
		{ label: 'bananas', value: 30 },
		{ label: 'bananas', value: 30 },
		{ label: 'bananas', value: 30, negativeValue: 300 }
	]}
/>
