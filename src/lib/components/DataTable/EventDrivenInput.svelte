<script lang="ts">
	import CustomInput from '$lib/components/CustomInput.svelte';
	import type { CustomInputType } from '$lib/types/CustomInput';
	import { untrack } from 'svelte';

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

	let draftValue = $state(untrack(() => value));

	$effect(() => {
		draftValue = value;
	});

	$effect(
		() =>
			['supplier', 'company', 'building', 'transactionType'].includes(type) &&
			draftValue !== value &&
			onChange?.(draftValue)
	);

	const handleFocusOut = () =>
		!['supplier', 'company', 'building', 'transactionType'].includes(type) &&
		draftValue !== value &&
		onChange?.(draftValue);
</script>

<CustomInput {type} bind:value={draftValue} {...rest} onfocusout={handleFocusOut} />
