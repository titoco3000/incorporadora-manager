<script lang="ts" generics="T extends Record<string, any>">
	import type { FormFieldDefinition } from '$lib/types/forms';
	import NewFormInput from './NewFormInput.svelte';

	let {
		fields,
		label = 'Form',
		post,
		// Add this to allow the parent to bind to the internal state
		data = $bindable()
	} = $props<{
		fields: FormFieldDefinition[];
		label?: string;
		post: (data: T) => Promise<any>;
		data?: T;
	}>();

	// Initialize data if it wasn't provided by the parent
	if (!data) data = {} as T;

	function handleInput(field: FormFieldDefinition, value: any) {
		// This update will now propagate to the parent!
		data![field.name as keyof T] = value;
		if (field.onChange) field.onChange(value);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		await post(data as T);
	}
</script>

<form onsubmit={handleSubmit}>
	<h2 class="form-title">{label}</h2>

	<div class="form-fields">
		{#each fields as field}
			<NewFormInput
				field={field}
				bind:value={data[field.name]}
			/>
		{/each}
	</div>

	<div class="form-actions">
		<button type="submit" class="submit-button"> Submit </button>
	</div>
</form>

<style>
	form {
		width: 100%;
		padding: 1.5rem;
		background-color: var(--bg-color-2);
		border: 1px solid var(--border-color-1);
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.form-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
	}

	.form-fields {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
		align-items: flex-start;
		container-type: inline-size;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid;
	}

	.submit-button {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #ffffff;
		background-color: #3b82f6;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.15s ease-in-out;
	}

	.submit-button:hover {
		background-color: #2563eb;
	}

	.submit-button:active {
		background-color: #1d4ed8;
	}
</style>
