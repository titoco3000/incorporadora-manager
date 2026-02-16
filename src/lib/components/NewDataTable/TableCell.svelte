<script lang="ts">
	import type { FormFieldType, FormFieldValue } from '$lib/types/forms';
	import FormInput from '../forms/components/FormInput.svelte';

	let { type, pos, value, onValueChange } = $props<{
		type?: FormFieldType;
		pos: [number, number];
		value: string;
		onValueChange?: (newValue: FormFieldValue | null, pos: [number, number]) => void;
	}>();
</script>

<td>
	<FormInput bind:value field={type} />
</td>
