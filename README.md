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

- Melhorar navegação
- Melhorar estilos
- Ao preencher o fornecedor de uma transação, se ele tiver um tipo de transação e a transação do form estiver vazia, preencher ela
- Permitir redimensionar colunas das tabelas
- Criar reports
    - Lista de Transações filtradas por periodo, area, empresa, tipo
- Fazer dashboard de inicio
    - pie chart de gasto por imovel
    - pie chart de ganho por imovel
    - Grafico de barras horizontais (eixo central) com gastos de um lado e ganhos do outro por imovel
    - Pensar que outros relatorios que podem ser uteis