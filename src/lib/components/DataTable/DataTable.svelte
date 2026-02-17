<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api';
	import EventDrivenInput from '$lib/components/DataTable/EventDrivenInput.svelte';
	import RowDeleteButton from '$lib/components/DataTable/RowDeleteButton.svelte';
	import Table from '$lib/components/ResizeableTable/Table.svelte';
	import type { ColumnDef, RowData } from '$lib/components/ResizeableTable/types.js';
	import {
		strCompare,
		numCompare,
		dateCompare,
		boolCompare,
		companyCompare,
		buildingCompare,
		transactionTypeCompare
	} from '$lib/sortComparators';

	export type TableType =
		| 'transaction-types'
		| 'buildings'
		| 'companies'
		| 'contracts'
		| 'contacts'
		| 'transactions';

	let { type, rows, label } = $props<{
		type: TableType;
		rows: RowData[];
		label: string;
	}>();

	const col = (key: string, label: string, sortCompareFn: any, type: string) =>
		({
			key,
			label,
			sortCompareFn,
			renderer: EventDrivenInput,
			rendererParameters: { type }
		}) as unknown as ColumnDef;

	const baseColumnsDefs: Record<string, ColumnDef[]> = {
		'transaction-types': [
			col('name', 'Nome', strCompare, 'text'),
			col('isExpense', 'É Despesa', boolCompare, 'bool')
		],
		buildings: [
			col('name', 'Nome', strCompare, 'text'),
			col('address', 'Endereço', strCompare, 'text'),
			col('iptuId', 'Nº IPTU', strCompare, 'text'),
			col('terrainArea', 'Área do Terreno (m²)', numCompare, 'number'),
			col('builtArea', 'Área Construída (m²)', numCompare, 'number'),
			col('insuranceInfo', 'Informações do Seguro', strCompare, 'text'),
			col('height', 'Altura (m)', numCompare, 'number'),
			col('floorWeightCapacity', 'Capacidade do Piso (ton/m²)', numCompare, 'number'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		companies: [
			col('name', 'Nome', strCompare, 'text'),
			col('cnpj', 'CNPJ', strCompare, 'text'),
			col('hqAddress', 'Endereço da Sede', strCompare, 'text'),
			col('stateId', 'Inscrição Estadual', strCompare, 'text'),
			col('municipalityId', 'Inscrição Municipal', strCompare, 'text'),
			col('transactionTypeId', 'Tipo de Transação', transactionTypeCompare, 'transactionType'),
			col('isSupplier', 'É Fornecedor', boolCompare, 'bool'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contracts: [
			col('startDate', 'Data de Início', dateCompare, 'date'),
			col('buildingId', 'Imóvel', buildingCompare, 'building'),
			col('companyId', 'Empresa', companyCompare, 'company'),
			col('startValue', 'Valor Inicial', numCompare, 'number'),
			col('expirationDate', 'Data de Vencimento', dateCompare, 'date'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contacts: [
			col('name', 'Nome', strCompare, 'text'),
			col('email', 'E-mail', strCompare, 'text'),
			col('phone', 'Telefone', strCompare, 'text'),
			col('role', 'Cargo', strCompare, 'text'),
			col('companyId', 'Empresa', companyCompare, 'company'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		transactions: [
			col('transactionTypeId', 'Tipo', transactionTypeCompare, 'transactionType'),
			col('value', 'Valor', numCompare, 'value'),
			col('companyId', 'Empresa', companyCompare, 'company'),
			col('date', 'Data', dateCompare, 'date'),
			col('buildingId', 'Imóvel', buildingCompare, 'building'),
			col('document', 'Documento', strCompare, 'text'),
			col('obs', 'Observações', strCompare, 'obs')
		]
	};

	const apiMap: Record<string, any> = {
		'transaction-types': api.transactionTypes,
		buildings: api.buildings,
		companies: api.companies,
		contacts: api.contacts,
		contracts: api.contracts,
		transactions: api.transactions
	};

	function handleEdit(rowID: number, columnKey: string, value: any) {
		if (columnKey == 'actions') return handleDelete(rowID);

		const row = rows.find((r: RowData) => r.id === rowID);
		if (row && row[columnKey] == value) return;

		const apiClient = apiMap[type];
		if (!apiClient) return;

		apiClient
			.patch(rowID, { [columnKey]: value })
			.then(() => invalidateAll())
			.catch((e: any) => console.error('Save failed:', e));
	}

	function handleDelete(rowID: number) {
		if (!confirm('Tem certeza que deseja excluir este registro?')) return;

		const apiClient = apiMap[type];
		if (!apiClient) return;

		apiClient
			.delete(rowID)
			.then(() => invalidateAll()) // Refresh data after successful delete
			.catch((e: any) => console.error('Delete failed:', e));
	}

	// append the delete button to the final column
	let activeColumns = $derived([
		...(baseColumnsDefs[type] || []),
		{
			key: 'actions',
			label: 'Ações',
			renderer: RowDeleteButton
		} as unknown as ColumnDef
	]);
</script>

<main>
	<h1>{label}</h1>
	<Table id={type} columns={activeColumns} data={rows} rowKey="id" onChange={handleEdit} />
</main>

<style>
	main {
		padding: 10px;
	}
</style>
