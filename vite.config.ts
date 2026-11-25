import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Local API (api/dev.ts), started by `make run`.
		proxy: { '/api': 'http://localhost:8787' }
	}
});
