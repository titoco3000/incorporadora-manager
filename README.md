# Projeto Incorporadora

## Arvore de navegação

/ -> dashboard, mostrando graficos

/table -> mostra todas as tabelas que podem ser visualizadas

/table/tableName -> mostra a tabela e permite editar valores

/forms -> Permite abrir todos os formularios para adicionar valores as tabelas

/reports -> Permite gerar relatorios


## Instalação

Adicione um .env a raiz do projeto e preencha com base em .env.example.

Instale deps:

    bun install

## Uso

    bun run dev

## Deploy

Ao fazer deploy na branch main, já faz deploy automatico.

## Modificando a DB

Ao mudar dados no schema:

    npx drizzle-kit push

## TODO

- Relatórios
    - despesas por imovel
    - despesas por fornecedor
    - despesas por tipo
    - receita por imovel
    - despesa por imovel
    - listagem de despesas

- Mudar data para xx/xx/xx




