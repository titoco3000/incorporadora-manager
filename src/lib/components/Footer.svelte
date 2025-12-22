<script>
	import { tableRegistry } from "$lib/table-config";

    
</script>
<footer>
    <nav>
        <a href="/">Início</a>
        <a href="/forms">Formulários</a>
        <a href="/table/buildings">{tableRegistry.buildings.label}</a>
        <a href="/table/companies">{tableRegistry.companies.label}</a>
        <a href="/table/contracts">{tableRegistry.contracts.label}</a>
        <a href="/table/contacts">{tableRegistry.contacts.label}</a>
        <a href="/table/transactions">{tableRegistry.transactions.label}</a>
    </nav>
</footer>
<style>
    footer{
        flex-grow: 0;
        flex-shrink: 0;
    }
</style>