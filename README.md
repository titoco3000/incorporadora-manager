# Incorporadora Manager

Management system for a real-estate development company, in production use: buildings, clients,
contracts, income, expenses and suppliers in one app.

- prod: https://incorporadora.titoco.dev
- dev: https://dev.incorporadora.titoco.dev

## Stack

SvelteKit SPA on S3 + CloudFront, Hono API on Lambda, Aurora DSQL, Drizzle ORM, Terraform, Bun.

## Local

```bash
make install
make run                  # Postgres in docker + API + site
```

## Deploy

```bash
make deploy dev           # or prod; also applies new migrations
```

## Schema changes

```bash
# edit api/src/db/schema.ts
make migration name=what  # commit drizzle/
make run                  # applies locally
make deploy dev && make deploy prod
```

Additive changes only (new table, nullable or defaulted column).

## Data

```bash
make copy-prod-dev        # refresh dev with prod data
```

Each copy wipes the target, copies, and checks the result.
