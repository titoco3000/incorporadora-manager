<script lang="ts">
	let { value, onChange } = $props<{ value: string; onChange?: (x: string) => void }>();
</script>

<input type="text" {value} onchange={(e) => onChange?.((e.target as HTMLInputElement).value)} />
