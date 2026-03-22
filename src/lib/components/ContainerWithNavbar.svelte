<script lang="ts">
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
		BanknoteArrowUp,
		BarChart3,
		PieChart,
		LineChart,
		TrendingUp,
		TrendingDown,
		Receipt,
		Blinds
	} from 'lucide-svelte';

	import PageButton from './PageButton.svelte';
	import CompanyHeader from './CompanyHeader.svelte';

	let { children } = $props<{
		children?: Snippet;
	}>();
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
			<PageButton href="/report/expenses-per-building" icon={Building2}>
				Despesas por imóvel
			</PageButton>
			<PageButton href="/report/expenses-per-supplier" icon={Truck}>
				Despesas por fornecedor
			</PageButton>
			<PageButton href="/report/expenses-per-type" icon={Pilcrow}>Despesas por tipo</PageButton>
			<PageButton href="/report/income-per-building" icon={Building2}>
				Receita por imóvel
			</PageButton>
			<PageButton href="/report/expense-per-building" icon={Building2}>
				Despesa por imóvel
			</PageButton>
			<PageButton href="/report/income" icon={TrendingUp}>Entradas</PageButton>
			<PageButton href="/report/expense" icon={TrendingDown}>Despesas</PageButton>
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
	{/snippet}
	{@render children?.()}
</ContainerWithMenu>

<style>
	.header {
		margin: 20px;
		display: block;
		text-decoration: none;
	}
</style>
