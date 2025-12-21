<script lang="ts">
  export let data;
</script>

<h1>Transaction Types</h1>

<form method="POST">
  <input name="name" placeholder="Name (e.g. Groceries)" required />
  <label>
    <input type="checkbox" name="isExpense" checked /> Is Expense?
  </label>
  <button type="submit">Add Type</button>
</form>

<hr />

<ul>
  {#each data.types as type}
    <li>
      {type.name} — <strong>{type.isExpense ? 'Expense' : 'Income'}</strong>
    </li>
  {/each}
</ul>