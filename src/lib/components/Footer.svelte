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
	}

	nav {
		display: flex;
	}

	button {
		display: inline-block;
		background-color: var(--light-black);
		color: var(--main-text-color);
		text-decoration: none;
		padding: 0.3em;
		display: flex;
		gap: 0.3em;
		border: none;
		border-right: 2px solid #ffffff4d;
	}

	button:disabled {
		background-color: #FFF;
		pointer-events: none;
		cursor: default;
		color: var(--black)		
	}

	nav button:last-child {
		border-right: none;
	}
</style>
