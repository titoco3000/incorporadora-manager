<script lang="ts">
	export let title: string = '';
</script>

<div class="card">
	<h2>{title}</h2>
  <img src="https://cdn-icons-png.flaticon.com/512/254/254188.png" alt="">
</div>

<style>
	.card {
		background-color: var(--light-black);
		border-radius: 30px;
		width: 23.688rem;
		aspect-ratio: 1/1;
		height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
	}

	.card h2{
		color: #FFF;
    font-size: 2rem;
    padding-top: 0.95em;
    padding-bottom: 0.72em;
	}

  .card img {
    width: 260px;
    height: auto;
  }
</style>
