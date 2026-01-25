export type FormFieldType = 'text'
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
    | 'transactionType'

export type FormFieldValue = string | object;

export type FormFieldDefinition = {
    name: string,
    type: FormFieldType,
    label?: string,
    size?: number,
    required?: boolean,
    value?: FormFieldValue,
    postKey?: string,
    onChange?: (arg0:unknown)=>void,
}