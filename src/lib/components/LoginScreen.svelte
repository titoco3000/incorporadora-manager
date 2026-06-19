<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import CompanyHeader from './CompanyHeader.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let registerMode = $state(false);

	async function handleLogin() {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await res.json();

		if (!res.ok) {
			if (res.status === 404 && data.whitelisted) {
				goto('/register?email=' + encodeURIComponent(email));
				return;
			}
			error = data.error || 'Falha na requisição';
			return;
		}

		if (data.needsPasswordSetup) {
			goto(
				'/confirm-password?email=' +
					encodeURIComponent(email) +
					'&password=' +
					encodeURIComponent(password)
			);
			return;
		}

		localStorage.setItem('token', data.token);
		await invalidateAll();
	}

	async function handleRegisterCheck() {
		const res = await fetch('/api/auth/check-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});
		const data = await res.json();

		if (!res.ok) {
			if (res.status === 409) {
				error = 'Este email já está registrado. Faça login.';
				registerMode = false;
				return;
			}
			error = data.error || 'Falha na requisição';
			return;
		}

		goto('/register?email=' + encodeURIComponent(email));
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			if (registerMode) {
				await handleRegisterCheck();
			} else {
				await handleLogin();
			}
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
		<h2>{registerMode ? 'Primeiro Acesso' : 'Entrar'}</h2>
		<p class="subtitle">
			{registerMode
				? 'Informe seu email para verificar se você está autorizado'
				: 'Acesse o sistema com sua conta'}
		</p>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="field">
			<label for="email">Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				placeholder="seu@email.com"
				required
				autocomplete="email"
			/>
		</div>

		{#if !registerMode}
			<div class="field">
				<label for="password">Senha</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					autocomplete="current-password"
				/>
			</div>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Aguarde...' : registerMode ? 'Verificar Email' : 'Entrar'}
		</button>

		<button type="button" class="toggle" onclick={() => (registerMode = !registerMode)}>
			{registerMode ? 'Já tem conta? Faça login' : 'Primeiro acesso? Registre-se'}
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
	button.toggle {
		background: none;
		border: none;
		color: #3b82f6;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0;
	}
	button.toggle:hover {
		text-decoration: underline;
	}
	.error-message {
		background: var(--bg-color-error-panel);
		color: var(--text-color-error-panel);
		padding: 0.6rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
	}
</style>
