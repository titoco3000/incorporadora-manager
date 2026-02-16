<script lang="ts">
	let { value } = $props<{ value?: string; onChange?: (x: string) => void }>();
</script>

<a href="mailto:{value}" style="color: blue; text-decoration: underline;">
	{value}
</a>
