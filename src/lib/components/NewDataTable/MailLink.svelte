<script lang="ts">
	let { value, row } = $props<{ value: string; row: any }>();
</script>

<a href="mailto:{value}" style="color: blue; text-decoration: underline;">
	{value}
</a>
