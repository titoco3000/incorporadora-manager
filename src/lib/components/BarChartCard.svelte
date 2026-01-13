<script lang="ts">
  import { Progressbar } from "flowbite-svelte";

	export let title: string = '';
</script>

<div class="card">
	<h2>{title}</h2>
	<!-- <div>
		<div class="my-4">
			<div class="mb-1 text-base font-medium dark:text-white">Gray</div>
			<Progressbar progress="50" color="gray" size="h-2.5" />
		</div>

		<div class="my-4">
			<div class="mb-1 text-base font-medium text-blue-700 dark:text-blue-500">Blue</div>
			<Progressbar progress="50" color="blue" />
		</div>

		<div class="my-4">
			<div class="mb-1 text-base font-medium text-red-700 dark:text-red-500">Red</div>
			<Progressbar progress="50" color="red" />
		</div>

		<div class="my-4">
			<div class="mb-1 text-base font-medium text-green-700 dark:text-green-500">Green</div>
			<Progressbar progress="50" color="green" />
		</div>

		<div class="mb-1 text-base font-medium text-yellow-700 dark:text-yellow-500">Yellow</div>
		<div class="my-4">
			<Progressbar progress="50" color="yellow" />
		</div>

		<div class="mb-1 text-base font-medium text-indigo-700 dark:text-indigo-400">Indigo</div>
		<div class="my-4">
			<Progressbar progress="50" color="indigo" />
		</div>

		<div class="mb-1 text-base font-medium text-purple-700 dark:text-purple-400">Purple</div>
		<div class="my-4">
			<Progressbar progress="50" color="purple" />
		</div>
	</div> -->
</div>

<style>
	.card {
		background-color: var(--light-black);
		border-radius: 30px;
		width: 100%;
		height: 30.625rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card h2 {
		color: #fff;
		font-size: 2rem;
		padding-top: 0.95em;
		padding-bottom: 0.72em;
	}

	.card img {
		width: 260px;
		height: auto;
	}
</style>
