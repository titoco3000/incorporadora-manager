import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Single-page app served from S3 + CloudFront; all data comes from /api (api/).
		// Every path that is not a file gets index.html (CloudFront Function in AWS).
		adapter: adapter({ fallback: 'index.html' })
	}
};

export default config;
