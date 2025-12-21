<script lang="ts">
  export let data;
  
  let message = '';
  let statusType = ''; // 'success' or 'error'

  async function sendRequest(table: string, payload: any) {
    const response = await fetch(`/api/table/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  }

  // Specialized update for the Transaction form
  async function handleTransaction(e: SubmitEvent) {
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = Object.fromEntries(fd);

    const result = await sendRequest('transactions', payload);

    if (result.success) {
      // Logic: Update the supplier's transactionTypeId
      await fetch(`/api/table/companies/${payload.companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ transactionTypeId: payload.transactionTypeId })
      });
      message = "Transaction saved and Supplier updated!";
      statusType = 'success';
    } else {
      message = "Error: " + result.error;
      statusType = 'error';
    }
  }

  async function handleStandardSubmit(e: SubmitEvent, table: string, extraData = {}) {
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = { ...Object.fromEntries(fd), ...extraData };
    
    const result = await sendRequest(table, payload);
    if (result.success) {
      message = `New ${table} created successfully.`;
      statusType = 'success';
      (e.target as HTMLFormElement).reset();
    } else {
      message = "Error: " + result.error;
      statusType = 'error';
    }
  }
</script>

<div class="container">
  <h1>Management Dashboard</h1>

  {#if message}
    <div class="alert {statusType}">{message}</div>
  {/if}

  <div class="form-grid">
    <section class="card">
      <h2>New Contact</h2>
      <form on:submit|preventDefault={(e) => handleStandardSubmit(e, 'contacts')}>
        <label>Name</label>
        <input name="name" required />
        
        <label>Email</label>
        <input name="email" type="email" />
        
        <label>Phone</label>
        <input name="phone" type="phone" />

        <label>Company</label>
        <select name="companyId" required>
          <option value="">-- Select --</option>
          {#each data.companies as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
        
        <button type="submit">Create Contact</button>
      </form>
    </section>

    <section class="card">
      <h2>New Contract</h2>
      <form on:submit|preventDefault={(e) => handleStandardSubmit(e, 'contracts')}>
        <label>Start Date</label>
        <input name="startDate" type="date" required />
        
        <label>Start Value</label>
        <input name="startValue" type="number" step="0.01" required />

        <label>Building</label>
        <select name="buildingId" required>
          <option value="">-- Select --</option>
          {#each data.buildings as b}<option value={b.id}>{b.name}</option>{/each}
        </select>

        <label>Company</label>
        <select name="companyId" required>
          <option value="">-- Select --</option>
          {#each data.companies as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
        
        <button type="submit">Create Contract</button>
      </form>
    </section>

    <section class="card">
      <h2>New Supplier</h2>
      <form on:submit|preventDefault={(e) => handleStandardSubmit(e, 'companies', { isSupplier: true, transactionTypeId: null })}>
        <label>Company Name</label>
        <input name="name" required />
        
        <label>CNPJ</label>
        <input name="cnpj" />

        <button type="submit" class="btn-supplier">Register Supplier</button>
      </form>
    </section>

    <section class="card">
      <h2>New Client</h2>
      <form on:submit|preventDefault={(e) => handleStandardSubmit(e, 'companies', { isSupplier: false, transactionTypeId: null })}>
        <label>Client Name</label>
        <input name="name" required />
        
        <label>HQ Address</label>
        <input name="hqAddress" />

        <button type="submit" class="btn-client">Register Client</button>
      </form>
    </section>

    <section class="card transaction-card">
      <h2>New Transaction</h2>
      <form on:submit|preventDefault={handleTransaction}>
        <div class="row">
          <div>
            <label>Type</label>
            <select name="transactionTypeId" required>
              <option value="">-- Select --</option>
              {#each data.transactionTypes as t}<option value={t.id}>{t.name}</option>{/each}
            </select>
          </div>
          <div>
            <label>Value</label>
            <input name="value" type="number" step="0.01" required />
          </div>
        </div>

        <label>Supplier / Company</label>
        <select name="companyId" required>
          <option value="">-- Select --</option>
          {#each data.companies as c}<option value={c.id}>{c.name}</option>{/each}
        </select>

        <label>Building</label>
        <select name="buildingId" required>
          <option value="">-- Select --</option>
          {#each data.buildings as b}<option value={b.id}>{b.name}</option>{/each}
        </select>

        <label>Date</label>
        <input name="date" type="date" required />

        <label>Document</label>
        <input name="document" />

        <button type="submit" class="btn-transaction">Save Transaction</button>
      </form>
    </section>
  </div>
</div>

<style>
  .container { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
  .form-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
    gap: 20px; 
  }
  .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }
  .transaction-card { border-left: 5px solid #ffa500; }
  
  h2 { margin-top: 0; font-size: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 10px; }
  label { display: block; margin: 10px 0 5px; font-weight: bold; font-size: 0.9rem; }
  input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  
  button { 
    margin-top: 15px; width: 100%; padding: 10px; 
    cursor: pointer; background: #333; color: white; border: none; border-radius: 4px; 
  }
  button:hover { opacity: 0.9; }
  
  .btn-supplier { background: #2e7d32; }
  .btn-client { background: #1565c0; }
  .btn-transaction { background: #ef6c00; }
  
  .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; }
  .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  
  .row { display: flex; gap: 10px; }
  .row > div { flex: 1; }
</style>