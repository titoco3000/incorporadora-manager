<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Menu } from 'lucide-svelte';
	let {
		width = 100,
		children,
		menuHeader,
		menuContent,
		menuFooter
	} = $props<{
		width?: number;
		children?: Snippet;
		menuHeader?: Snippet;
		menuContent?: Snippet;
		menuFooter?: Snippet;
	}>();

	let isOpen = $state(false);
</script>

<div class="container" style={`--w: ${width}px`}>
	<div class="sidebar" class:isOpen>
		<div class="sidebar-content">
			<header>
				<button class="toggle-btn" onclick={() => (isOpen = !isOpen)}>
					{#if isOpen}
						<Menu size={14} />
					{:else}
						◀
					{/if}
				</button>
				{@render menuHeader?.()}
			</header>
			<main>
				{@render menuContent?.()}
			</main>
			<footer>
				{@render menuFooter?.()}
			</footer>
		</div>
	</div>
	<div class="content">
		{@render children?.()}
	</div>
</div>

<style>
	.container {
		height: 100vh;
		width: 100%;
		display: flex;
	}
	.sidebar {
		height: 100%;
		width: var(--w);
		border-right: 1px solid var(--border-color-1);
		transition: width 0.3s;
		position: relative;
		flex-shrink: 0;
	}
	.isOpen {
		width: 0;
	}
	.sidebar-content {
		display: flex;
		flex-direction: column;
		width: var(--w);
		height: 100%;
		border-right: 1px solid var(--border-color-1);
		position: absolute;
		right: 0px;
		top: 0;
		transition: right 0.3s;
		overflow-x: auto;
	}
	.toggle-btn {
		background-color: var(--bg-color-2);
		border: 1px solid var(--border-color-1);
		border-radius: var(--border-radius);
		position: absolute;
		top: 5px;
		right: 5px;
		width: 30px;
		height: 30px;
		cursor: pointer;
		z-index: 10;
		transition: right 0.3s ease;
	}
	.isOpen .toggle-btn {
		right: -35px;
	}
	.isOpen .sidebar-content {
		right: 1px;
	}
	header,
	footer {
		width: 100%;
		flex-shrink: 0;
	}
	header {
		position: relative;
		min-height: 30px;
	}
	main {
		flex-grow: 1;
		width: 100%;
	}
	.content {
		min-width: 0;
		width: 100%;
		height: 100%;
		overflow: auto;
	}
</style>
