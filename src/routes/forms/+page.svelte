<script lang="ts">
    import { 
        HandCoins, Truck, Contact, 
        Users, FileText, Building2, Menu 
    } from "lucide-svelte";
    
    import BuildingForm from "$lib/components/forms/forms/BuildingForm.svelte";
    import ClientForm from "$lib/components/forms/forms/ClientForm.svelte";
    import ContactForm from "$lib/components/forms/forms/ContactForm.svelte";
    import SupplierForm from "$lib/components/forms/forms/SupplierForm.svelte";
    import TransactionForm from "$lib/components/forms/forms/TransactionForm.svelte";
	import ContractForm from "$lib/components/forms/forms/ContractForm.svelte";

    let isExpanded = false;
    // Set the default form to show on load
    let activeTab = "Transação";

    const navItems = [
        { label: "Transação", icon: HandCoins, component: TransactionForm },
        { label: "Fornecedor", icon: Truck, component: SupplierForm },
        { label: "Contato", icon: Contact, component: ContactForm },
        { label: "Cliente", icon: Users, component: ClientForm },
        { label: "Contrato", icon: FileText, component: ContractForm },
        { label: "Imóvel", icon: Building2, component: BuildingForm },
    ];

    function toggleSidebar() {
        isExpanded = !isExpanded;
    }

    function selectTab(label:string) {
        activeTab = label;
    }
</script>

<div class="app-layout">
    <aside class="sidebar" class:expanded={isExpanded}>
        <div class="nav-header">
            <button class="toggle-btn" on:click={toggleSidebar}>
                <Menu size={24} />
            </button>
        </div>

        <nav>
            {#each navItems as item}
                <button 
                    class="nav-item" 
                    class:active={activeTab === item.label}
                    on:click={() => selectTab(item.label)}
                >
                    <span class="icon">
                        <svelte:component this={item.icon} size={20} />
                    </span>
                    <span class="label">{item.label}</span>
                </button>
            {/each}
        </nav>
    </aside>

    <main class="content">
        <!-- <header class="page-header">
            <h1>Forms page</h1>
            <p class="subtitle">{activeTab}</p>
        </header> -->

        <section class="form-area">
            {#each navItems as item}
                {#if activeTab === item.label}
                    <div class="form-container">
                        {#if item.component}
                            <svelte:component this={item.component} />
                        {:else}
                            <p>Form for {item.label} is under construction.</p>
                        {/if}
                    </div>
                {/if}
            {/each}
        </section>
    </main>
</div>

<style>
    .app-layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--bg-color);
        color: var(--text-color-1);
    }

    /* --- Sidebar Styles --- */
    .sidebar {
        width: 64px;
        background-color: var(--bg-color-2);
        border-right: 1px solid var(--border-color-1);
        display: flex;
        flex-direction: column;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        white-space: nowrap;
        position: sticky;
        top: 0;
        height: 100vh;
        z-index: 10;
    }

    .sidebar.expanded {
        width: 240px;
    }

    .nav-header {
        padding: 1.25rem;
        display: flex;
        justify-content: center;
    }

    .sidebar.expanded .nav-header {
        justify-content: flex-end;
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
    }

    .nav-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--text-color-2);
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
    }

    .nav-item:hover {
        background-color: var(--bg-color-3);
    }

    .nav-item.active {
        background-color: var(--bg-color-3);
        color: var(--text-color-1);
        font-weight: 600;
    }

    .icon {
        min-width: 32px;
        display: flex;
        justify-content: center;
    }

    .label {
        margin-left: 1rem;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    }

    .sidebar.expanded .label {
        opacity: 1;
        pointer-events: auto;
    }

    .toggle-btn {
        background: none;
        border: none;
        color: var(--text-color-1);
        cursor: pointer;
    }

    /* --- Main Content Styles --- */
    .content {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
    }

    /* .page-header {
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-color-1);
        padding-bottom: 1rem;
    }

    .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-color-1);
    }

    .subtitle {
        margin: 0.25rem 0 0;
        color: var(--text-color-2);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    } */

    .form-area {
        max-width: 900px;
    }

    .form-container {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Desktop adjustments */
    @media (min-width: 800px) {
        .sidebar { width: 240px; }
        .sidebar .label { opacity: 1; }
        .toggle-btn { display: none; }
    }
</style>