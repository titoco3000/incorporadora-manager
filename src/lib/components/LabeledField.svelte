<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children } = $props<{
		label: string;
		children?: Snippet;
	}>();
</script>

<label>
	<header>{label}</header>
	{@render children?.()}
</label>
