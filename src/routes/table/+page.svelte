<script lang="ts">
</script>

<main>
	<div class="container">
    <h1>Tabelas</h1>
    <div>
      <ul>
        <li><a href="/table/buildings">Tabela de Imóveis</a></li>
        <li><a href="/table/companies">Tabela de Empresas</a></li>
        <li><a href="/table/contracts">Tabela de Contratos</a></li>
        <li><a href="/table/contacts">Tabela de Contatos</a></li>
        <li><a href="/table/transactions">Tabela de Transações</a></li>
      </ul>
    </div>
  </div>
</main>

<style>
	main {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
	}

  h1 {
    font-size: 4rem;
    margin: 2rem 0;
    color: var(--main-text-color);
  }

	.container {
		background-color: var(--light-black);
		height: 50vh;
		width: 45vw;
		border-radius: 30px;
    display: flex;
    align-items: center;
    flex-direction: column;
	}

  ul {
    list-style: none;
  }

  ul li {
    font-size: 1.55rem;
    margin-bottom: 0.6em;
    color:rgb(141, 203, 255);
    text-decoration: underline;
  }

  ul li:hover {
    color: var(--main-text-color);
    text-decoration: none;
  }
</style>
