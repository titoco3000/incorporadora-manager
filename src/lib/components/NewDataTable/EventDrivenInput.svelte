<script lang="ts">
	import CustomInput from '$lib/components/CustomInput.svelte';
	import type { CustomInputType } from '$lib/types/CustomInput';

	let {
		value = '',
		onChange,
		type,
		...rest
	} = $props<{
		type: CustomInputType;
		disabled?: boolean;
		value?: string;
		onChange?: (x: string) => void;
		[key: string]: any;
	}>();

	let draftValue = $state(() => value);

	$effect(() => {
		draftValue = value;
	});

	const handleFocusOut = () => draftValue !== value && onChange?.(draftValue);
</script>

<CustomInput {type} bind:value={draftValue} {...rest} onfocusout={handleFocusOut} />
