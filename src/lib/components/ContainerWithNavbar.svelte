<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ContainerWithMenu from './ContainerWithMenu.svelte';
	import type { Snippet } from 'svelte';
	import SidebarItem from './SidebarItem.svelte';

	// Added the new chart and trending icons for the reports
	import {
		HandCoins,
		Truck,
		Contact,
		Users,
		FileText,
		Building2,
		Pilcrow,
		BarChart3,
		TrendingUp,
		TrendingDown,
		Shield,
		LogOut,
		History
	} from 'lucide-svelte';

	import PageButton from './PageButton.svelte';
	import CompanyHeader from './CompanyHeader.svelte';

	let { children } = $props<{
		children?: Snippet;
	}>();

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		localStorage.removeItem('token');
		await invalidateAll();
	}
</script>

<ContainerWithMenu width={240}>
	{#snippet menuHeader()}
		<a class="header" href="/">
			<CompanyHeader />
		</a>
	{/snippet}
	{#snippet menuContent()}
		<SidebarItem isOpen={true} label="Registrar">
			<PageButton href="/form/income" icon={TrendingUp}>Entrada</PageButton>
			<PageButton href="/form/expense" icon={TrendingDown}>Despesa</PageButton>
			<PageButton href="/form/supplier" icon={Truck}>Fornecedor</PageButton>
			<PageButton href="/form/contact" icon={Contact}>Contato</PageButton>
			<PageButton href="/form/client" icon={Users}>Cliente</PageButton>
			<PageButton href="/form/contract" icon={FileText}>Contrato</PageButton>
			<PageButton href="/form/building" icon={Building2}>Imóvel</PageButton>
			<PageButton href="/form/transaction-type" icon={Pilcrow}>Tipo de Transação</PageButton>
		</SidebarItem>

		<SidebarItem isOpen={true} label="Relatórios">
			<PageButton href="/report/transactions/expenses-per-building" icon={Building2}>
				Despesas de imóvel
			</PageButton>
			<PageButton href="/report/transactions/expenses-per-supplier" icon={Truck}>
				Despesas de fornecedor
			</PageButton>
			<PageButton href="/report/transactions/expenses-per-type" icon={Pilcrow}>
				Despesas de tipo
			</PageButton>
			<PageButton href="/report/transactions/totals-per-building" icon={BarChart3}>
				Totais por imóvel
			</PageButton>
		</SidebarItem>

		<SidebarItem isOpen={true} label="Planilhas">
			<PageButton href="/table/transaction" icon={HandCoins}>Transações</PageButton>
			<PageButton href="/table/supplier" icon={Truck}>Fornecedores</PageButton>
			<PageButton href="/table/contact" icon={Contact}>Contatos</PageButton>
			<PageButton href="/table/client" icon={Users}>Clientes</PageButton>
			<PageButton href="/table/contract" icon={FileText}>Contratos</PageButton>
			<PageButton href="/table/building" icon={Building2}>Imóveis</PageButton>
			<PageButton href="/table/transaction-type" icon={Pilcrow}>Tipos de Transação</PageButton>
		</SidebarItem>

		<SidebarItem isOpen={true} label="Administração">
			<PageButton href="/whitelist" icon={Shield}>Whitelist</PageButton>
			<PageButton href="/history" icon={History}>Histórico</PageButton>
		</SidebarItem>

		<div class="spacer"></div>

		<SidebarItem isOpen={true} label="">
			<button class="logout-button" onclick={handleLogout}>
				<LogOut size={18} />
				Sair
			</button>
		</SidebarItem>
	{/snippet}
	{@render children?.()}
</ContainerWithMenu>

<style>
	.header {
		margin: 20px;
		display: block;
		text-decoration: none;
	}
	.spacer {
		flex: 1;
	}
	.logout-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		width: 100%;
		border: none;
		background: none;
		color: var(--text-color-1);
		cursor: pointer;
		font-size: 0.9rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.logout-button:hover {
		background: var(--bg-color-4);
		color: var(--error-text-color-1);
	}
</style>
