<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { page } from '$app/state';

	let {
		href,
		icon,
		size = 14,
		children
	} = $props<{
		href: string;
		icon?: Component;
		size?: number;
		children?: Snippet;
	}>();
</script>

<a {href} class:current={page.url.pathname === href} style={`font-size: ${size}px`}>
	<div class="icon">
		{#if icon}
			{@const Renderer = icon}
			<Renderer size={size * 1.5} />
		{/if}
	</div>
	<main>
		{@render children?.()}
	</main>
</a>

<style>
	a {
		display: flex;
		cursor: pointer;
		align-items: center;
		transition: color 0.3s;
		gap: 5px;
		padding: 5px 0;
		text-decoration: none;
	}
	a:not(.current):hover {
		color: var(--text-color-2);
	}
	.icon {
		flex-shrink: 0;
	}
	main {
		flex-grow: 1;
	}
	.current {
		cursor: default;
		font-weight: bold;
	}
</style>
