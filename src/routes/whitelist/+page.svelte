<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Plus } from 'lucide-svelte';
	import type { WhitelistEntry } from '$lib/types/api';

	let entries = $state<WhitelistEntry[]>([]);
	let newEmail = $state('');
	let error = $state('');
	let loading = $state(true);

	onMount(() => {
		loadEntries();
	});

	async function loadEntries() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/auth/whitelist');
			if (!res.ok) throw new Error('Failed to load');
			entries = await res.json();
		} catch {
			error = 'Failed to load whitelist';
		} finally {
			loading = false;
		}
	}

	async function addEntry() {
		if (!newEmail.trim()) return;
		error = '';
		try {
			const res = await fetch('/api/auth/whitelist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: newEmail.trim() })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Failed to add email';
				return;
			}
			newEmail = '';
			await loadEntries();
		} catch {
			error = 'Failed to add email';
		}
	}

	async function removeEntry(id: number) {
		error = '';
		try {
			const res = await fetch('/api/auth/whitelist', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Failed to remove email';
				return;
			}
			await loadEntries();
		} catch {
			error = 'Failed to remove email';
		}
	}
</script>

<main>
	<header>
		<h1>Whitelist de Acesso</h1>
		<p class="subtitle">
			Apenas emails nesta lista podem criar contas. Adicione emails de usuários autorizados.
		</p>
	</header>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<div class="add-form">
		<input
			type="email"
			bind:value={newEmail}
			placeholder="email@exemplo.com"
			onkeydown={(e) => e.key === 'Enter' && addEntry()}
		/>
		<button onclick={addEntry} disabled={!newEmail.trim()}>
			<Plus size={18} />
			Adicionar
		</button>
	</div>

	<div class="list">
		{#if loading}
			<p class="empty">Carregando...</p>
		{:else if entries.length === 0}
			<p class="empty">Nenhum email na whitelist.</p>
		{:else}
			{#each entries as entry (entry.id)}
				<div class="entry">
					<span class="email">{entry.email}</span>
					<button class="remove" onclick={() => removeEntry(entry.id)}>
						<X size={16} />
					</button>
				</div>
			{/each}
		{/if}
	</div>
</main>

<style>
	main {
		padding: 2rem 3rem;
		max-width: 600px;
	}
	header {
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0 0 0.3rem;
	}
	.subtitle {
		color: var(--text-color-1);
		font-size: 0.9rem;
		margin: 0;
	}
	.error-message {
		background: var(--bg-color-error-panel);
		color: var(--text-color-error-panel);
		padding: 0.6rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}
	.add-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.add-form input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border-color-1);
		border-radius: 0.375rem;
		background: var(--bg-color-3);
		color: var(--text-color-1);
		font-size: 0.9rem;
	}
	.add-form input:focus {
		outline: none;
		border-color: #3b82f6;
	}
	.add-form button {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.6rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #3b82f6;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
	}
	.add-form button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border-color-1);
		border-radius: 0.375rem;
		background: var(--bg-color-2);
	}
	.entry .email {
		color: var(--text-color-2);
		font-size: 0.9rem;
	}
	.entry .remove {
		display: flex;
		align-items: center;
		padding: 0.3rem;
		border: none;
		background: none;
		color: var(--text-color-1);
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.entry .remove:hover {
		background: var(--bg-color-error-panel);
		color: var(--error-text-color-1);
	}
	.empty {
		color: var(--text-color-1);
		font-size: 0.9rem;
		text-align: center;
		padding: 2rem;
	}
</style>
