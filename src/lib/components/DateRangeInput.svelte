<script lang="ts">
	import type { DateString } from '$lib/types/DateString';
	import DateInput from './DateInput.svelte';

	interface Props {
		start: DateString;
		end: DateString;
	}

	let { start = $bindable(), end = $bindable() }: Props = $props();
</script>

<main>
	<label>
		<h1>de</h1>
		<DateInput bind:value={start} />
	</label>
	<label>
		<h1>até</h1>
		<DateInput bind:value={end} />
	</label>
</main>

<style>
	main {
		background-color: var(--bg-color-2);
		border: 1px solid var(--border-color-1);
		min-height: 30px;
		min-width: 100px;
		border-radius: var(--border-radius);
		display: flex;
	}
	label {
		text-align: center;
		cursor: pointer;
	}
	label:first-child {
		border-right: 1px solid var(--border-color-1);
	}
	h1 {
		font-size: 0.8em;
		font-weight: 100;
		margin-top: 0.4em;
		color: var(--text-color-3);
	}
</style>
