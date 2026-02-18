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

	let { type, rows, label, visibleColumns, allowDelete, allowEdit } = $props<{
		type: TableType;
		rows: RowData[];
		label: string;
		visibleColumns?: string[];
		allowDelete?: boolean;
		allowEdit?: boolean;
	}>();

	const col = (
		key: string,
		label: string,
		sortCompareFn: any,
		type: string,
		required: boolean = false
	) =>
		({
			key,
			label,
			sortCompareFn,
			renderer: EventDrivenInput,
			rendererParameters: { type, required }
		}) as unknown as ColumnDef;

	const baseColumnsDefs: Record<string, ColumnDef[]> = {
		'transaction-types': [
			col('name', 'Nome', strCompare, 'text', true),
			col('isExpense', 'É Despesa', boolCompare, 'bool', true)
		],
		buildings: [
			col('name', 'Nome', strCompare, 'text', true),
			col('address', 'Endereço', strCompare, 'text', true),
			col('iptuId', 'Nº IPTU', strCompare, 'text'),
			col('terrainArea', 'Área do Terreno (m²)', numCompare, 'number'),
			col('builtArea', 'Área Construída (m²)', numCompare, 'number'),
			col('insuranceInfo', 'Informações do Seguro', strCompare, 'text'),
			col('height', 'Altura (m)', numCompare, 'number'),
			col('floorWeightCapacity', 'Capacidade do Piso (ton/m²)', numCompare, 'number'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		companies: [
			col('name', 'Nome', strCompare, 'text', true),
			col('cnpj', 'CNPJ', strCompare, 'text'),
			col('hqAddress', 'Endereço da Sede', strCompare, 'text'),
			col('stateId', 'Inscrição Estadual', strCompare, 'text'),
			col('municipalityId', 'Inscrição Municipal', strCompare, 'text'),
			col('transactionTypeId', 'Tipo de Transação', transactionTypeCompare, 'transactionType'),
			col('isSupplier', 'É Fornecedor', boolCompare, 'bool', true),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contracts: [
			col('startDate', 'Data de Início', dateCompare, 'date', true),
			col('buildingId', 'Imóvel', buildingCompare, 'building', true),
			col('companyId', 'Empresa', companyCompare, 'company', true),
			col('startValue', 'Valor Inicial', numCompare, 'number'),
			col('expirationDate', 'Data de Vencimento', dateCompare, 'date'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contacts: [
			col('name', 'Nome', strCompare, 'text', true),
			col('email', 'E-mail', strCompare, 'text'),
			col('phone', 'Telefone', strCompare, 'text'),
			col('role', 'Cargo', strCompare, 'text'),
			col('companyId', 'Empresa', companyCompare, 'company', true),
			col('obs', 'Observações', strCompare, 'obs')
		],
		transactions: [
			col('transactionTypeId', 'Tipo', transactionTypeCompare, 'transactionType', true),
			col('value', 'Valor', numCompare, 'value', true),
			col('companyId', 'Empresa', companyCompare, 'company', true),
			col('date', 'Data', dateCompare, 'date', true),
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
		if (!allowEdit) return;

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
		if (!allowDelete) return;
		if (!confirm('Tem certeza que deseja excluir este registro?')) return;

		const apiClient = apiMap[type];
		if (!apiClient) return;

		apiClient
			.delete(rowID)
			.then(() => invalidateAll()) // Refresh data after successful delete
			.catch((e: any) => console.error('Delete failed:', e));
	}

	// Filter columns by visibleColumns (if provided), then append the delete button
	let activeColumns = $derived([
		...(baseColumnsDefs[type] || []).filter(
			(col) => !visibleColumns || visibleColumns.length === 0 || visibleColumns.includes(col.key)
		),
		...(allowDelete && allowEdit
			? [
					{
						key: 'actions',
						label: 'Ações',
						renderer: RowDeleteButton
					} as unknown as ColumnDef
				]
			: [])
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
