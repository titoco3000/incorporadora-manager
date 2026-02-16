<script lang="ts">
	let { value } = $props<{ value: string; onChange: any }>();
</script>

<a href="mailto:{value}" style="color: blue; text-decoration: underline;">
	{value}
</a>
