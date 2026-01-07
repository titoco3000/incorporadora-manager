<script>
  import FormInput from '../FormInput.svelte';
  import BaseForm from './BaseForm.svelte';
</script>

<BaseForm onSubmit={data=>console.log(data)} label='Form Label' let:formId>
  <FormInput {formId} label='supplier' type='supplier' name='mainSupplier' required minwidth={300} grow={0.5}/>
  <FormInput {formId} label='value' type='value' name='mainValue' required minwidth={100} grow={0.25}/>
  <FormInput {formId} label='value' type='value' name='secondayValue' minwidth={100} grow={0.25}/>
  <FormInput {formId} label='supplier' type='supplier' name='secondarySupplier' minwidth={300} grow={1}/>
</BaseForm>