<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { type Writable } from 'svelte/store';
  import type { Company, Building, TransactionType } from '$lib/types/api';
	import { api } from '$lib/api';
  

  type InputKind = 'text' 
        | 'obs' 
        | 'value' 
        | 'number' 
        | 'email' 
        | 'phone'  
        | 'supplier' 
        | 'company' 
        | 'date' 
        | 'building' 
        | 'cnpj' 
        | 'transactionType';

  export let type: InputKind;
  export let label: string = "Input Field";
  export let name: string = "";
  export let placeholder: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let minwidth: number = 200;
  export let grow: number = 1;
  export let formId: symbol | undefined = undefined;
  export let onValueChange: ((value: any) => void) | undefined = undefined;

  let value: string | number = '';

  // Get formData store from parent BaseForm using the unique formId
  let formDataStore: Writable<Record<string, any>> | undefined;
  
  $: if (formId) {
    formDataStore = getContext(formId);
  }

  // Expose value setter for external control
  export function setValue(newValue: string | number) {
    value = newValue;
  }

  // Sync value with formData store
  $: if (formDataStore && name) {
    formDataStore.update(data => ({
      ...data,
      [name]: value
    }));
  }

  // Reactive lookup for the full object
$: selectedObject = (() => {
  if (!value) return value;

  switch (type) {
    case 'supplier':
      return suppliers.find(s => s.id === value);
    case 'company':
      return companies.find(c => c.id === value);
    case 'building':
      return buildings.find(b => b.id === value);
    case 'transactionType':
      return transactionTypes.find(t => t.id === value);
    default:
      return value; // For text, email, cnpj, etc., just return the string
  }
})();

// Trigger the callback with the full object
$: if (onValueChange) {
  onValueChange(selectedObject);
}

  // Options for select dropdowns
  let companies: Company[] = [];
  let suppliers: Company[] = [];
  let buildings: Building[] = [];
  let transactionTypes: TransactionType[] = [];
  
  // Loading and error states
  let loading: boolean = false;
  let error: string | null = null;
  
  // Validation states
  let touched: boolean = false;
  let isValid: boolean = true;

  // Fetch data on mount for dropdown types
  onMount(async () => {
    try {
      loading = true;
      
      if (type === 'supplier') {
        suppliers = await api.companies.get({isSupplier:true});
      } else if (type === 'company') {
        companies = await api.companies.get()
      } else if (type === 'building') {
        buildings = await api.buildings.get()
      } else if (type === 'transactionType') {
        transactionTypes = await api.transactionTypes.get()
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Erro ao carregar dados';
      console.error('Error loading data:', e);
    } finally {
      loading = false;
    }
  });

  // Validate input
  function validate() {
    if (required) {
      isValid = value !== '' && value !== null && value !== undefined;
    } else {
      // For optional fields, check if value is valid when present
      if (value === '' || value === null || value === undefined) {
        isValid = true; // Empty optional field is valid
      } else {
        // Check type-specific validation
        if (type === 'email') {
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        } else if (type === 'cnpj') {
          const numbers = String(value).replace(/\D/g, '');
          isValid = numbers.length === 14;
        } else {
          isValid = true;
        }
      }
    }
  }

  function handleBlur() {
    touched = true;
    validate();
  }

  function handleInput() {
    if (touched) {
      validate();
    }
  }

  // Watch for value changes
  $: {
    value;
    handleInput();
  }

  // Format CNPJ as user types
  function formatCnpj(val: string): string {
    const numbers = val.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return val;
  }

  function handleCnpjInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const cursorPos = target.selectionStart || 0;
    const oldLength = target.value.length;
    
    value = formatCnpj(target.value);
    
    const newLength = String(value).length;
    const diff = newLength - oldLength;
    
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = cursorPos + diff;
    });
  }

  // Format currency value
  function formatValue(val: string | number): string {
    const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
    if (isNaN(numVal)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numVal);
  }

  function handleValueInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const numbers = target.value.replace(/[^\d]/g, '');
    const numValue = parseFloat(numbers) / 100;
    value = numValue.toString();
  }

  // Determine validation class
  $: validationClass = touched && !isValid ? 'invalid' : '';
</script>

<div class="field-wrapper" style="min-width: {minwidth}px; flex-grow: {grow}; flex-basis: calc({grow * 100}% - 1rem); max-width: 100%;">
  <label class="field-container">
    <span class="field-label">{label}{required ? ' *' : ''}</span>
    
    {#if type === 'text'}
      <input
        type="text"
        bind:value
        {placeholder}
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
        on:blur={handleBlur}
      />
    
    {:else if type === 'obs'}
      <textarea
        bind:value
        {placeholder}
        {disabled}
        {name}
        class="field-input field-textarea {validationClass}"
        rows="4"
        on:blur={handleBlur}
      ></textarea>
    
    {:else if type === 'value'}
      <input
        type="text"
        value={value ? formatValue(value) : ''}
        on:input={handleValueInput}
        on:blur={handleBlur}
        {placeholder}
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
      />

    {:else if type === 'number'}
      <input
        type="number"
        bind:value
        on:blur={handleBlur}
        {placeholder}
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
      />
    
    {:else if type === 'email'}
      <input
        type="email"
        bind:value
        placeholder={placeholder || 'email@example.com'}
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
        on:blur={handleBlur}
      />
    
    {:else if type === 'phone'}
      <input
        type="tel"
        bind:value
        placeholder={placeholder || '(00) 00000-0000'}
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
        on:blur={handleBlur}
      />
    
    {:else if type === 'date'}
      <input
        type="date"
        bind:value
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
        on:blur={handleBlur}
      />
    
    {:else if type === 'cnpj'}
      <input
        type="text"
        value={value ? formatCnpj(String(value)) : ''}
        on:input={handleCnpjInput}
        on:blur={handleBlur}
        placeholder={placeholder || '00.000.000/0000-00'}
        maxlength="18"
        {required}
        {disabled}
        {name}
        class="field-input {validationClass}"
      />
    
    {:else if type === 'supplier'}
      <select
        bind:value
        {required}
        disabled={disabled || loading}
        {name}
        class="field-input field-select {validationClass}"
        on:blur={handleBlur}
      >
        <option value="">
          {loading ? 'Carregando...' : 'Selecione um fornecedor...'}
        </option>
        {#each suppliers as supplier}
          <option value={supplier.id}>{supplier.name}</option>
        {/each}
      </select>
      {#if error}<span class="field-error">{error}</span>{/if}
    
    {:else if type === 'company'}
      <select
        bind:value
        {required}
        disabled={disabled || loading}
        {name}
        class="field-input field-select {validationClass}"
        on:blur={handleBlur}
      >
        <option value="">
          {loading ? 'Carregando...' : 'Selecione uma empresa...'}
        </option>
        {#each companies as company}
          <option value={company.id}>{company.name}</option>
        {/each}
      </select>
      {#if error}<span class="field-error">{error}</span>{/if}
    
    {:else if type === 'building'}
      <select
        bind:value
        {required}
        disabled={disabled || loading}
        {name}
        class="field-input field-select {validationClass}"
        on:blur={handleBlur}
      >
        <option value="">
          {loading ? 'Carregando...' : 'Selecione um imóvel...'}
        </option>
        {#each buildings as building}
          <option value={building.id}>{building.name}</option>
        {/each}
      </select>
      {#if error}<span class="field-error">{error}</span>{/if}
    
    {:else if type === 'transactionType'}
      <select
        bind:value
        {required}
        disabled={disabled || loading}
        {name}
        class="field-input field-select {validationClass}"
        on:blur={handleBlur}
      >
        <option value="">
          {loading ? 'Carregando...' : 'Selecione um tipo...'}
        </option>
        {#each transactionTypes as txType}
          <option value={txType.id}>{txType.name} ({txType.isExpense ? 'Despesa' : 'Receita'})</option>
        {/each}
      </select>
      {#if error}<span class="field-error">{error}</span>{/if}
    {/if}
    
    {#if touched && !isValid}
      <span class="validation-error">
        {required ? 'Este campo é obrigatório' : 'Valor inválido'}
      </span>
    {/if}
  </label>
</div>

<style>
  .field-wrapper {
    flex-shrink: 1;
    flex-basis: auto;
    box-sizing: border-box;
    max-width: 100%;
    container-type: inline-size;
  }

  /* Use container queries instead of media queries */
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

  .field-input {
    width: 100%;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.5;
    background-color: var(--bg-color-3);
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .field-input:disabled {
    cursor: not-allowed;
  }

  .field-input::placeholder {
    color: #9ca3af;
  }

  .field-input.invalid {
    border-color: #ef4444;
  }

  .field-input.invalid:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .field-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .field-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }

  .field-error {
    color: #dc2626;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
  }

  .validation-error {
    color: #dc2626;
    font-size: 0.75rem;
    display: block;
    margin-top: 0.25rem;
  }
</style>