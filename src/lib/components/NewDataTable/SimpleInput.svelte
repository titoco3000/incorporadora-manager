<script lang="ts">
	let { value, onChange } = $props<{ value?: string; onChange?: (x: string) => void }>();
</script>

<input type="text" {value} onchange={(e) => onChange?.((e.target as HTMLInputElement).value)} />

<style>
	input {
		height: 100%;
		width: 100%;
		min-width: 0;
		background-color: transparent;
		outline: none;
		border: none;
	}
</style>
