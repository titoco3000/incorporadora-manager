<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const isActive = (href: string) => page.url.pathname === href;
</script>

<footer>
	<nav>
		<button disabled={isActive('/')} on:click={() => goto('/')}> Início </button>
		<button disabled={isActive('/forms')} on:click={() => goto('/forms')}> Formulários </button>
		<button disabled={isActive('/table/buildings')} on:click={() => goto('/table/buildings')}>
			Imóveis
		</button>
		<button disabled={isActive('/table/suppliers')} on:click={() => goto('/table/suppliers')}>
			Fornecedores
		</button>
		<button disabled={isActive('/table/clients')} on:click={() => goto('/table/clients')}>
			Clientes
		</button>
		<button disabled={isActive('/table/contracts')} on:click={() => goto('/table/contracts')}>
			Contratos
		</button>
		<button disabled={isActive('/table/contacts')} on:click={() => goto('/table/contacts')}>
			Contatos
		</button>
		<button disabled={isActive('/table/transactions')} on:click={() => goto('/table/transactions')}>
			Transações
		</button>
		<button disabled={isActive('/table/companies')} on:click={() => goto('/table/companies')}>
			Empresas (todas)
		</button>
		<button
			disabled={isActive('/table/transaction-types')}
			on:click={() => goto('/table/transaction-types')}
		>
			Tipos de Transação
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
