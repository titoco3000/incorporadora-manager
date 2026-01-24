<script lang="ts">
	import DateInput from './DateInput.svelte';


  interface Props {
		onChange?: ((start: Date, end:Date) => void)|null;
	}

	let { onChange }: Props = $props();

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  let dateRange:Array<Date|null> = [yearAgo, new Date()]

  $effect(() => {
    if(dateRange[0] && dateRange[1] && onChange)
      onChange(dateRange[0], dateRange[1]);
  })

</script>

<main>
	<label>
		<h1>de</h1>
    <DateInput onDateChange={d=>dateRange[0]=d} initialDate={yearAgo} />
	</label>
	<label>
    <h1>até</h1>
    <DateInput onDateChange={d=>dateRange[1]=d} initialDate={new Date()} />
	</label>
</main>

<style>
	main {
		background-color: var(--bg-color-2);
		border: 1px solid var(--border-color-1);
		min-height: 30px;
		min-width: 100px;
		border-radius: var(--border-radius);
    display: flex;
	}
  label{
    text-align: center;
    cursor: pointer;
  }
  label:first-child{
    border-right: 1px solid var(--border-color-1);
  }
  h1{
    font-size: 0.8em;
    font-weight: 100;
    margin-top: 0.4em;
    color: var(--text-color-3);
  }
</style>
