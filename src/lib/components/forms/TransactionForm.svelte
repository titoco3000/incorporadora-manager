<script lang="ts">
  import FormInput from './components/FormInput.svelte';
  import BaseForm from './components/BaseForm.svelte';

  function onSupplierUpdate(value:String){
    console.log(value);
  }
</script>

<BaseForm onSubmit={data=>console.log(data)} label='Form Label' let:formId>
  <FormInput {formId} label='Tipo' type='transactionType' name='transactionTypeId' required grow={0.5}/>
  <FormInput {formId} label='Valor' type='value' name='value' required grow={0.5}/>

  <FormInput {formId} label='fornecedor' type='supplier' name='companyId' required minwidth={300} grow={0.5} onValueChange={onSupplierUpdate}/>
  <FormInput {formId} label='Data' type='date' name='date' required grow={0.5}/>

  <FormInput {formId} label='imóvel' type='building' name='buildingId' required grow={0.5}/>
  <FormInput {formId} label='Documento' type='text' name='doc' grow={0.5}/>

  <FormInput {formId} label='Observações' type='obs' name='obs' grow={1}/>
</BaseForm>