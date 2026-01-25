<script lang="ts" generics="T extends Record<string, any>">
    import type { FormFieldDefinition } from "$lib/types/forms";

    let { 
        fields, 
        post,
        // Add this to allow the parent to bind to the internal state
        data = $bindable() 
    } = $props<{ 
        fields: FormFieldDefinition[], 
        post: (data: T) => Promise<any>,
        data?: T
    }>();

    // Initialize data if it wasn't provided by the parent
    if (!data) data = {} as T;

    function handleInput(field: FormFieldDefinition, value: any) {
        // This update will now propagate to the parent!
        data![field.name as keyof T] = value;
        if(field.onChange)
            field.onChange(value)
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        await post(data as T);
    }
</script>

<form onsubmit={handleSubmit}>
    {#each fields as field}
        <label>
            <h1>{field.label}</h1>
            <input 
                type={field.type} 
                name={field.name}
                value={data![field.name as keyof T] ?? ''}
                oninput={(e) => handleInput(field, e.currentTarget.value)}
            >
        </label>
    {/each}
    <button type="submit">Submit</button>
</form>