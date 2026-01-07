<script lang="ts" context="module">
  export type FormData = Record<string, any>;
</script>

<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';

  export let onSubmit: (data: FormData) => void;
  export let label: string = "Form";

  // Create unique context key for this form instance
  const formId = Symbol();
  const formData = writable<FormData>({});
  
  // Provide formData store with unique key to child components
  setContext(formId, formData);

  function handleSubmit(e: Event) {
    e.preventDefault();
    onSubmit($formData);
  }
</script>

<form class="base-form" on:submit={handleSubmit}>
  <h2 class="form-title">{label}</h2>
  
  <div class="form-fields">
    <slot formId={formId} />
  </div>

  <div class="form-actions">
    <button type="submit" class="submit-button">
      Submit
    </button>
  </div>
</form>

<style>
  .base-form {
    width: 100%;
    padding: 1.5rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }

  .form-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
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