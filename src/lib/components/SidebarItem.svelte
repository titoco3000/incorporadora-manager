<script lang="ts">
	import type { Snippet } from 'svelte';
	import collapse from 'svelte-collapse';

	let {
		label,
		isOpen = $bindable(false),
		children
	} = $props<{
		label: string;
		isOpen?: boolean;
		children?: Snippet;
	}>();

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="dropdown">
	<button class="header" onclick={toggle} aria-expanded={isOpen}>
		{label}
		<span class="arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
	</button>

	{#if children}
		<div use:collapse={{ open: isOpen, duration: 0.4, easing: 'ease' }}>
			<div class="content">
				{@render children()}
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown {
		border-radius: 4px;
		width: 100%;
		max-width: 300px;
		font-family: sans-serif;
	}
	.header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border: none;
		cursor: pointer;
		text-align: left;
		font-size: 1rem;
		border-bottom: 1px solid var(--border-color-1);
	}
	.content {
		padding: 1rem;
		border-bottom: 1px solid var(--border-color-1);
	}
</style>
