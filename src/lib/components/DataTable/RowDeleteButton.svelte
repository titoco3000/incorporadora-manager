<script lang="ts">
	let { onChange } = $props<{ value?: string; onChange?: (x: string) => void }>();
</script>

<button type="button" onclick={() => onChange('alou')}> Excluir </button>

<style>
	button {
		background: transparent;
		color: #d32f2f;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}
	button:hover {
		text-decoration: underline;
	}
</style>
