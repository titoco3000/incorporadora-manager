PROFILE := personal
TF      := terraform -chdir=infra
AWS     := aws --profile $(PROFILE)
PG      := incorporadora-postgres
PSQL    := docker exec -i $(PG) psql -U postgres -v ON_ERROR_STOP=1

# DSQL endpoint for the *-aws targets, from Terraform (step 3 of MIGRATION.md).
AWS_DB   = AWS_PROFILE=$(PROFILE) DSQL_ENDPOINT=$$($(TF) output -raw dsql_endpoint)

.PHONY: install run db-start db-migrate db-migrate-aws copy-local copy-aws backup-railway build-api railway-tunnel

install:
	bun install --frozen-lockfile

# Site + local API + Postgres 17 in docker (data kept in the incorporadora-pgdata volume).
run: db-migrate
	bun run --watch api/dev.ts & API=$$!; trap "kill $$API" EXIT INT TERM; bun run dev -- --open

db-start:
	@test -f .env || cp .env.example .env
	@docker start $(PG) >/dev/null 2>&1 || docker run -d --name $(PG) -p 5433:5432 \
		-e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=incorporadora \
		-v incorporadora-pgdata:/var/lib/postgresql/data postgres:17 >/dev/null
	@until docker exec $(PG) pg_isready -U postgres -d incorporadora >/dev/null 2>&1; do sleep 0.5; done

db-migrate: db-start
	bun scripts/migrate.ts local

db-migrate-aws:
	$(AWS_DB) bun scripts/migrate.ts aws

# Wipes the local database, migrates, copies Railway into it and checks the copy.
copy-local: db-start
	$(PSQL) -d postgres -c 'DROP DATABASE IF EXISTS incorporadora WITH (FORCE)' -c 'CREATE DATABASE incorporadora'
	bun scripts/migrate.ts local
	bun scripts/copy-from-railway.ts local

# Wipes the DSQL data (schema stays), copies Railway into it and checks the copy.
copy-aws:
	$(AWS_DB) bun scripts/copy-from-railway.ts aws

# Offline backup of Railway (custom format). *.dump is gitignored: never commit it.
# Uses pg_dump 17 from the postgres image so the version matches the server. Host network,
# so localhost is this machine (the `make railway-tunnel` port).
backup-railway:
	@set -a; . ./.env; set +a; test -n "$$RAILWAY_DATABASE_URL" || { echo 'RAILWAY_DATABASE_URL not set in .env'; exit 1; }; \
	docker run --rm --network host postgres:17 pg_dump -Fc "$$RAILWAY_DATABASE_URL" > railway-$$(date +%Y%m%d-%H%M%S).dump && ls -lh railway-*.dump | tail -1

# Encrypted SSH tunnel to Railway Postgres on localhost:15432, no public access needed.
# Keep it running in its own terminal while you run backup-railway / copy-local / copy-aws.
railway-tunnel:
	railway connect Postgres --tunnel-only --port 15432

# Lambda bundle (everything bundled: the Lambda runtime's SDK may not include dsql-signer).
build-api:
	bun build api/src/handler.ts --target=node --format=esm --outfile=api/dist/index.mjs
