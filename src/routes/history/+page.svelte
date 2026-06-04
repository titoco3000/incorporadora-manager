<script lang="ts">
	import { api } from '$lib/api';
	import { Clock, RotateCcw, Check, X } from 'lucide-svelte';

	let entries = $state<Awaited<ReturnType<typeof api.history.get>>>([]);
	let loading = $state(true);
	let error = $state('');
	let undoingId = $state<number | null>(null);

	async function loadHistory() {
		loading = true;
		error = '';
		try {
			entries = await api.history.get();
		} catch (e: unknown) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	let redoingId = $state<number | null>(null);

	async function handleUndo(id: number) {
		const entry = entries.find((e) => e.id === id);
		const isRedo = entry?.undoneAt;
		if (
			!confirm(
				isRedo
					? 'Tem certeza que deseja refazer esta ação?'
					: 'Tem certeza que deseja desfazer esta ação?'
			)
		)
			return;
		if (isRedo) {
			redoingId = id;
		} else {
			undoingId = id;
		}
		try {
			await api.history.undo(id);
			await loadHistory();
		} catch (e) {
			alert('Erro ao ' + (isRedo ? 'refazer' : 'desfazer') + ': ' + (e as Error).message);
		} finally {
			undoingId = null;
			redoingId = null;
		}
	}

	function actionLabel(action: string) {
		switch (action) {
			case 'CREATE':
				return 'Criação';
			case 'UPDATE':
				return 'Edição';
			case 'DELETE':
				return 'Remoção';
			default:
				return action;
		}
	}

	function actionClass(action: string) {
		switch (action) {
			case 'CREATE':
				return 'action-create';
			case 'UPDATE':
				return 'action-update';
			case 'DELETE':
				return 'action-delete';
			default:
				return '';
		}
	}

	function formatDate(date: string | Date | null) {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleString('pt-BR');
	}

	$effect(() => {
		loadHistory();
	});
</script>

<div class="page">
	<h1>Histórico de Alterações</h1>

	{#if loading}
		<div class="loading">Carregando...</div>
	{:else if error}
		<div class="error">Erro: {error}</div>
	{:else if entries.length === 0}
		<div class="empty">Nenhuma alteração registrada ainda.</div>
	{:else}
		<div class="timeline">
			{#each entries as entry (entry.id)}
				<div class="entry" class:undone={!!entry.undoneAt}>
					<div class="timeline-marker" class:marker-undone={!!entry.undoneAt}>
						{#if entry.undoneAt}
							<Check size={14} />
						{:else if entry.action === 'CREATE'}
							<div class="dot dot-create"></div>
						{:else if entry.action === 'UPDATE'}
							<div class="dot dot-update"></div>
						{:else if entry.action === 'DELETE'}
							<div class="dot dot-delete"></div>
						{/if}
					</div>
					<div class="card">
						<div class="card-header">
							<span class="action-badge {actionClass(entry.action)}">
								{actionLabel(entry.action)}
							</span>
							<span class="table-name">{entry.tableName}</span>
							<span class="timestamp">{formatDate(entry.createdAt)}</span>
						</div>
						<div class="card-body">
							<p class="description">{entry.description}</p>
							<p class="user">
								<Clock size={12} />
								{entry.userName ?? entry.userEmail}
							</p>
						</div>
						{#if !entry.description.startsWith('UNDO:') && !entry.description.startsWith('REDO:')}
							{#if entry.undoneAt}
								<div class="card-actions">
									<button
										class="undo-btn"
										onclick={() => handleUndo(entry.id)}
										disabled={redoingId === entry.id}
									>
										{#if redoingId === entry.id}
											Refazendo...
										{:else}
											<RotateCcw size={14} />
											Refazer
										{/if}
									</button>
									<span class="undone-label">
										<Check size={14} />
										Desfeito em {formatDate(entry.undoneAt)}
									</span>
								</div>
							{:else}
								<div class="card-actions">
									<button
										class="undo-btn"
										onclick={() => handleUndo(entry.id)}
										disabled={undoingId === entry.id}
									>
										{#if undoingId === entry.id}
											Desfazendo...
										{:else}
											<RotateCcw size={14} />
											Desfazer
										{/if}
									</button>
								</div>
							{/if}
						{:else if entry.undoneAt}
							<div class="card-actions">
								<span class="undone-label">
									<Check size={14} />
									Desfeito em {formatDate(entry.undoneAt)}
								</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
	h1 {
		margin-bottom: 2rem;
		font-size: 1.5rem;
	}
	.loading,
	.error,
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--text-color-2);
	}
	.error {
		color: var(--error-text-color-1);
	}
	.timeline {
		position: relative;
	}
	.timeline::before {
		content: '';
		position: absolute;
		left: 15px;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--border-color-1);
	}
	.entry {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		position: relative;
	}
	.timeline-marker {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--bg-color-3);
		border: 2px solid var(--border-color-1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		z-index: 1;
	}
	.marker-undone {
		background: var(--success-bg, #1a3a2a);
		border-color: var(--success-color, #4ade80);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.dot-create {
		background: #4ade80;
	}
	.dot-update {
		background: #60a5fa;
	}
	.dot-delete {
		background: #f87171;
	}
	.card {
		flex: 1;
		background: var(--bg-color-2);
		border: 1px solid var(--border-color-1);
		border-radius: 0.5rem;
		padding: 1rem;
	}
	.undone .card {
		opacity: 0.6;
	}
	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	.action-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}
	.action-create {
		background: rgba(74, 222, 128, 0.15);
		color: #4ade80;
	}
	.action-update {
		background: rgba(96, 165, 250, 0.15);
		color: #60a5fa;
	}
	.action-delete {
		background: rgba(248, 113, 113, 0.15);
		color: #f87171;
	}
	.table-name {
		font-size: 0.8rem;
		color: var(--text-color-2);
		background: var(--bg-color-3);
		padding: 0.1rem 0.4rem;
		border-radius: 0.25rem;
	}
	.timestamp {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--text-color-2);
	}
	.description {
		font-size: 0.95rem;
		margin: 0 0 0.25rem 0;
	}
	.user {
		font-size: 0.8rem;
		color: var(--text-color-2);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.card-actions {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color-1);
	}
	.undo-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border-color-1);
		border-radius: 0.375rem;
		background: var(--bg-color-3);
		color: var(--text-color-1);
		cursor: pointer;
		font-size: 0.85rem;
		transition: background 0.15s;
	}
	.undo-btn:hover:not(:disabled) {
		background: var(--bg-color-4);
		border-color: #60a5fa;
	}
	.undo-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.undone-label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #4ade80;
	}
</style>
