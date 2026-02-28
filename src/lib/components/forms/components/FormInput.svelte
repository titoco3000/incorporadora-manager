<script lang="ts">
	import type { FormFieldDefinition } from '$lib/types/forms';
	import CustomInput from '$lib/components/CustomInput.svelte';
	import { untrack } from 'svelte';

	let {
		field,
		value = $bindable(),
		disabled = false
	} = $props<{
		field: FormFieldDefinition;
		value: any;
		disabled?: boolean;
	}>();

	$effect(() => {
		const currentValue = value;

		untrack(() => {
			if (field.onChange) field.onChange(currentValue);
		});
	});
</script>

<div
	class="field-wrapper"
	style="min-width: {field.minwidth || 200}px; flex-grow: {field.size ||
		1}; flex-basis: calc({(field.size || 1) * 100}% - 1rem); max-width: 100%;"
>
	<div class="field-container">
		{#if field.label}
			<label class="field-label" for={field.name}>
				{field.label}
				{field.required ? '*' : ''}
			</label>
		{/if}
		<div class="input-container" class:disabled>
			<CustomInput
				type={field.type}
				bind:value
				{disabled}
				placeholder={field.label}
				required={field.required}
				id={field.name}
				style="padding: 0.5rem 0.75rem;"
			/>
		</div>
	</div>
</div>

<style>
	.field-wrapper {
		flex-shrink: 1;
		flex-basis: auto;
		box-sizing: border-box;
		max-width: 100%;
		container-type: inline-size;
	}

	@container (max-width: 600px) {
		.field-wrapper {
			flex-basis: 100% !important;
			min-width: 100% !important;
		}
	}

	.field-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.field-label {
		font-size: 0.875rem;
		font-weight: 500;
		display: block;
	}

	.input-container {
		width: 100%;
		font-size: 0.875rem;
		line-height: 1.5;
		background-color: var(--bg-color-3);
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		transition:
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
		box-sizing: border-box;
	}

	.input-container:focus-within {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.disabled {
		cursor: not-allowed;
	}
</style>
