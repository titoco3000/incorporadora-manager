<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api';
	import EventDrivenInput from '$lib/components/NewDataTable/EventDrivenInput.svelte';
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

	interface DataType {
		rows: RowData[];
		label: string;
		tableSlug: string;
	}

	let { data } = $props<{ data: DataType }>();

	const columnsDefs: Record<string, ColumnDef[]> = {
		'transaction-types': [
			{
				key: 'name',
				label: 'Nome',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'isExpense',
				label: 'É Despesa',
				sortCompareFn: boolCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'checkbox' }
			} as unknown as ColumnDef
		],

		buildings: [
			{
				key: 'name',
				label: 'Nome',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'address',
				label: 'Endereço',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'iptuId',
				label: 'Nº IPTU',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'terrainArea',
				label: 'Área do Terreno (m²)',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'number' }
			} as unknown as ColumnDef,
			{
				key: 'builtArea',
				label: 'Área Construída (m²)',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'number' }
			} as unknown as ColumnDef,
			{
				key: 'insuranceInfo',
				label: 'Informações do Seguro',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'height',
				label: 'Altura (m)',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'number' }
			} as unknown as ColumnDef,
			{
				key: 'floorWeightCapacity',
				label: 'Capacidade do Piso (ton/m²)',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'number' }
			} as unknown as ColumnDef,
			{
				key: 'obs',
				label: 'Observações',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'obs' }
			} as unknown as ColumnDef
		],

		companies: [
			{
				key: 'name',
				label: 'Nome',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'cnpj',
				label: 'CNPJ',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'hqAddress',
				label: 'Endereço da Sede',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'stateId',
				label: 'Inscrição Estadual',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'municipalityId',
				label: 'Inscrição Municipal',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'transactionTypeId',
				label: 'Tipo de Transação',
				sortCompareFn: transactionTypeCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'transactionType' }
			} as unknown as ColumnDef,
			{
				key: 'isSupplier',
				label: 'É Fornecedor',
				sortCompareFn: boolCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'checkbox' }
			} as unknown as ColumnDef,
			{
				key: 'obs',
				label: 'Observações',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'obs' }
			} as unknown as ColumnDef
		],

		contracts: [
			{
				key: 'startDate',
				label: 'Data de Início',
				sortCompareFn: dateCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'date' }
			} as unknown as ColumnDef,
			{
				key: 'buildingId',
				label: 'Imóvel',
				sortCompareFn: buildingCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'building' }
			} as unknown as ColumnDef,
			{
				key: 'companyId',
				label: 'Empresa',
				sortCompareFn: companyCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'company' }
			} as unknown as ColumnDef,
			{
				key: 'startValue',
				label: 'Valor Inicial',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'number' }
			} as unknown as ColumnDef,
			{
				key: 'expirationDate',
				label: 'Data de Vencimento',
				sortCompareFn: dateCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'date' }
			} as unknown as ColumnDef,
			{
				key: 'obs',
				label: 'Observações',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'obs' }
			} as unknown as ColumnDef
		],

		contacts: [
			{
				key: 'name',
				label: 'Nome',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'email',
				label: 'E-mail',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'phone',
				label: 'Telefone',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'role',
				label: 'Cargo',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'companyId',
				label: 'Empresa',
				sortCompareFn: companyCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'company' }
			} as unknown as ColumnDef,
			{
				key: 'obs',
				label: 'Observações',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'obs' }
			} as unknown as ColumnDef
		],

		transactions: [
			{
				key: 'transactionTypeId',
				label: 'Tipo',
				sortCompareFn: transactionTypeCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'transactionType' }
			} as unknown as ColumnDef,
			{
				key: 'value',
				label: 'Valor',
				sortCompareFn: numCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'value' }
			} as unknown as ColumnDef,
			{
				key: 'companyId',
				label: 'Empresa',
				sortCompareFn: companyCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'company' }
			} as unknown as ColumnDef,
			{
				key: 'date',
				label: 'Data',
				sortCompareFn: dateCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'date' }
			} as unknown as ColumnDef,
			{
				key: 'buildingId',
				label: 'Imóvel',
				sortCompareFn: buildingCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'building' }
			} as unknown as ColumnDef,
			{
				key: 'document',
				label: 'Documento',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'text' }
			} as unknown as ColumnDef,
			{
				key: 'obs',
				label: 'Observações',
				sortCompareFn: strCompare,
				renderer: EventDrivenInput,
				rendererParameters: { type: 'obs' }
			} as unknown as ColumnDef
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

	function handleEdit(rowID: string, columnKey: string, value: any) {
		const row = data.rows.find((row: RowData) => row.id === rowID);

		if (row[columnKey] == value) {
			return;
		}

		const apiClient = apiMap[data.tableSlug];
		if (!apiClient) {
			console.error(`No API client found for table: ${data.tableSlug}`);
			return;
		}

		apiClient
			.patch(rowID, { [columnKey]: value })
			.then(() => {
				invalidateAll();
			})
			.catch((e: any) => console.error('Save failed:', e));
	}
</script>

<main>
	<h1>{data.label}</h1>
	<Table
		id={data.tableSlug}
		columns={columnsDefs[data.tableSlug]}
		data={data.rows}
		rowKey="id"
		onChange={handleEdit}
	/>
</main>

<style>
	main {
		padding: 10px;
	}
</style>
