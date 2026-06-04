<script lang="ts">
	import CompanyHeader from '$lib/components/CompanyHeader.svelte';

	let { data } = $props();

	let password = $state('');
	let confirm = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirm) {
			error = 'As senhas não conferem.';
			return;
		}

		if (password.length < 6) {
			error = 'A senha deve ter pelo menos 6 caracteres.';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: data.email, password })
			});

			const result = await res.json();

			if (!res.ok) {
				error = result.error || 'Falha no registro';
				return;
			}

			localStorage.setItem('token', result.token);
			window.location.href = '/';
		} catch {
			error = 'Falha de conexão';
		} finally {
			loading = false;
		}
	}
</script>

<section>
	<form onsubmit={handleSubmit}>
		<CompanyHeader />
		<h2>Definir Senha</h2>
		<p class="subtitle">
			Você foi autorizado a acessar o sistema. Defina sua senha para continuar.
		</p>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="field">
			<label for="email">Email</label>
			<input id="email" type="email" value={data.email} disabled />
		</div>

		<div class="field">
			<label for="password">Senha</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Mínimo 6 caracteres"
				required
				minlength={6}
				autocomplete="new-password"
			/>
		</div>

		<div class="field">
			<label for="confirm">Confirmar Senha</label>
			<input
				id="confirm"
				type="password"
				bind:value={confirm}
				placeholder="Repita a senha"
				required
				minlength={6}
				autocomplete="new-password"
			/>
		</div>

		<button type="submit" disabled={loading}>
			{loading ? 'Aguarde...' : 'Criar Conta'}
		</button>
	</form>
</section>

<style>
	section {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	form {
		border: 1px solid var(--border-color-1);
		border-radius: var(--border-radius);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 320px;
	}
	h2 {
		margin: 0;
	}
	.subtitle {
		color: var(--text-color-1);
		font-size: 0.875rem;
		margin: 0;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-color-2);
	}
	.field input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border-color-1);
		border-radius: 0.375rem;
		background: var(--bg-color-3);
		color: var(--text-color-1);
		font-size: 0.9rem;
	}
	.field input:disabled {
		opacity: 0.6;
	}
	.field input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
	}
	button[type='submit'] {
		padding: 0.7rem;
		border-radius: 0.375rem;
		border: none;
		background: #3b82f6;
		color: #fff;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		margin-top: 0.5rem;
	}
	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.error-message {
		background: var(--bg-color-error-panel);
		color: var(--text-color-error-panel);
		padding: 0.6rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
	}
</style>
