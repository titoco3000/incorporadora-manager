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
		| 'transaction-type'
		| 'building'
		| 'company'
		| 'contract'
		| 'contact'
		| 'transaction';

	let { type, rows, visibleColumns, allowDelete, allowEdit } = $props<{
		type: TableType;
		rows: RowData[];
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
		'transaction-type': [
			col('name', 'Nome', strCompare, 'text', true),
			col('isExpense', 'É Despesa', boolCompare, 'bool', true)
		],
		building: [
			col('name', 'Nome', strCompare, 'text', true),
			col('address', 'Endereço', strCompare, 'text', true),
			col('iptuId', 'Nº IPTU', strCompare, 'text'),
			col('insuranceInfo', 'Informações do Seguro', strCompare, 'text'),
			col('characteristics', 'Características', strCompare, 'obs'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		company: [
			col('name', 'Nome', strCompare, 'text', true),
			col('cnpj', 'CNPJ', strCompare, 'text'),
			col('hqAddress', 'Endereço da Sede', strCompare, 'text'),
			col('stateId', 'Inscrição Estadual', strCompare, 'text'),
			col('municipalityId', 'Inscrição Municipal', strCompare, 'text'),
			col('transactionTypeId', 'Tipo de Transação', transactionTypeCompare, 'transactionType'),
			col('isSupplier', 'É Fornecedor', boolCompare, 'bool', true),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contract: [
			col('startDate', 'Data de Início', dateCompare, 'date', true),
			col('buildingId', 'Imóvel', buildingCompare, 'building', true),
			col('companyId', 'Empresa', companyCompare, 'company', true),
			col('startValue', 'Valor Inicial', numCompare, 'number'),
			col('expirationDate', 'Data de Vencimento', dateCompare, 'date'),
			col('obs', 'Observações', strCompare, 'obs')
		],
		contact: [
			col('name', 'Nome', strCompare, 'text', true),
			col('email', 'E-mail', strCompare, 'text'),
			col('phone', 'Telefone', strCompare, 'text'),
			col('role', 'Cargo', strCompare, 'text'),
			col('companyId', 'Empresa', companyCompare, 'company', true),
			col('obs', 'Observações', strCompare, 'obs')
		],
		transaction: [
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
		'transaction-type': api.transactionTypes,
		building: api.buildings,
		company: api.companies,
		contact: api.contacts,
		contract: api.contracts,
		transaction: api.transactions
	};

	function handleEdit(rowID: number, columnKey: string, value: any) {
		if (columnKey == 'actions') return handleDelete(rowID);
		if (!allowEdit) return;

		const row = rows.find((r: RowData) => r.id === rowID);
		if (row && row[columnKey] == value) return;

		const apiClient = apiMap[type];
		if (!apiClient) return;

		// avoid changing object to object of the same id
		if (!value || !value.id || value.id != row[columnKey])
			apiClient
				.patch(rowID, { [columnKey]: value && value.id ? value.id : value })
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

<Table
	id={type}
	columns={activeColumns}
	data={rows}
	rowKey="id"
	onChange={handleEdit}
	borderColor="var(--border-color-2)"
/>
