<script lang="ts">
	import type { Snippet } from 'svelte';

	let { loading = false, children } = $props<{ loading?: boolean; children?: Snippet }>();
</script>

<div class:loading>
	<div class="children">
		{@render children?.()}
	</div>
	{#if loading}
		<div class="cover">
			<div class="loader"></div>
		</div>
	{/if}
</div>

<style>
	.loading {
		position: relative;
	}
	.loading > .children {
		opacity: 0.5;
	}
	.cover {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loader {
		width: 50px;
		aspect-ratio: 1;
		border-radius: 50%;
		background:
			radial-gradient(farthest-side, white 94%, #0000) top/8px 8px no-repeat,
			conic-gradient(#0000 30%, white);
		mask: radial-gradient(farthest-side, #0000 calc(100% - 8px), #000 0);
		-webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 8px), #000 0);
		animation: l13 1s infinite linear;
	}
	@keyframes l13 {
		100% {
			transform: rotate(1turn);
		}
	}
</style>
