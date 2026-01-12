<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { tableRegistry } from '$lib/table-config';

	const isActive = (href: string) => page.url.pathname === href;
</script>

<footer>
	<nav>
		<button disabled={isActive('/')} on:click={() => goto('/')}> Início </button>

		<button disabled={isActive('/forms')} on:click={() => goto('/forms')}> Formulários </button>

		<button disabled={isActive('/table/buildings')} on:click={() => goto('/table/buildings')}>
			{tableRegistry.buildings.label}
		</button>

		<button disabled={isActive('/table/companies')} on:click={() => goto('/table/companies')}>
			{tableRegistry.companies.label}
		</button>

		<button disabled={isActive('/table/contracts')} on:click={() => goto('/table/contracts')}>
			{tableRegistry.contracts.label}
		</button>

		<button disabled={isActive('/table/contacts')} on:click={() => goto('/table/contacts')}>
			{tableRegistry.contacts.label}
		</button>

		<button disabled={isActive('/table/transactions')} on:click={() => goto('/table/transactions')}>
			{tableRegistry.transactions.label}
		</button>
	</nav>
</footer>

<style>
	footer {
		flex-grow: 0;
		flex-shrink: 0;
		background-color: var(--bg-color-2);
	}

	nav {
		display: flex;
	}

	button {
		display: inline-block;
		background-color: var(--bg-color-3);
		color: var(--text-color-3);
		text-decoration: none;
		padding: 0.3em;
		display: flex;
		gap: 0.3em;
		margin-right: 0.2em;
	}

	button:disabled {
		background-color: var(--bg-color-1);
		color: var(--text-color-1);
		pointer-events: none;
		cursor: default;
		opacity: 0.7;
	}
</style>
