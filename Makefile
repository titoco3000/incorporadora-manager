PROFILE := personal
AWS     := aws --profile $(PROFILE)
PG      := incorporadora-postgres
PSQL    := docker exec -i $(PG) psql -U postgres -v ON_ERROR_STOP=1

# Two stacks in AWS, one Terraform workspace each (infra/ uses terraform.workspace in names):
#   dev   https://dev.incorporadora.titoco.dev
#   prod  https://incorporadora.titoco.dev
# AWS targets need the stack as a second word, with no default: `make deploy dev`,
# `make plan prod`, `make output dev`.
ENV := $(filter dev prod,$(MAKECMDGOALS))
TF  := TF_WORKSPACE=$(ENV) terraform -chdir=infra
# DSQL endpoint of a workspace: $(call endpoint,prod). Empty if the stack does not exist yet.
endpoint = $$(TF_WORKSPACE=$(1) terraform -chdir=infra output -raw dsql_endpoint 2>/dev/null)
AWS_ENV  = AWS_PROFILE=$(PROFILE)
# Migrates the stack's database (one DSQL_ENDPOINT_<ENV> variable, see scripts/target.ts).
migrate_aws = $(AWS_ENV) DSQL_ENDPOINT_$(shell echo $(1) | tr a-z A-Z)=$(call endpoint,$(1)) \
	bun scripts/migrate.ts $(1)

.PHONY: install run db-start db-migrate migration railway-tunnel backup-railway \
	copy-railway-local copy-local copy-local-prod copy-prod-dev check-local-prod \
	build-api need-env plan output deploy jwt-secret dev prod

# `dev` / `prod` only select the stack for the target before them.
dev prod:
	@:

need-env:
	@test "$(words $(ENV))" = 1 || { echo 'Say which stack: make $(firstword $(MAKECMDGOALS)) dev|prod'; exit 1; }

install:
	bun install --frozen-lockfile
	terraform -chdir=infra init
	terraform -chdir=infra workspace select -or-create dev
	terraform -chdir=infra workspace select -or-create prod

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

# After editing api/src/db/schema.ts: writes drizzle/NNNN_<name>.sql. Then `make run` applies it
# locally, `make deploy dev` / `make deploy prod` apply it in AWS.
migration:
	bunx drizzle-kit generate $(if $(name),--name $(name))

# --- Copies. Each wipes the target, copies, and checks (row counts, sums, md5 per table). ---

# Encrypted SSH tunnel to Railway Postgres on localhost:15432, no public access needed.
# Keep it running in its own terminal while you run backup-railway / copy-railway-local.
railway-tunnel:
	railway connect Postgres --tunnel-only --port 15432

# Offline backup of Railway (custom format). *.dump is gitignored: never commit it.
# pg_dump 17 from the postgres image; host network, so localhost is the tunnel.
backup-railway:
	@set -a; . ./.env; set +a; test -n "$$RAILWAY_DATABASE_URL" || { echo 'RAILWAY_DATABASE_URL not set in .env'; exit 1; }; \
	docker run --rm --network host postgres:17 pg_dump -Fc "$$RAILWAY_DATABASE_URL" > railway-$$(date +%Y%m%d-%H%M%S).dump && ls -lh railway-*.dump | tail -1

# Railway → local: recreates the local database, migrates, copies.
copy-railway-local: db-start
	$(PSQL) -d postgres -c 'DROP DATABASE IF EXISTS incorporadora WITH (FORCE)' -c 'CREATE DATABASE incorporadora'
	bun scripts/migrate.ts local
	bun scripts/copy.ts railway local
copy-local: copy-railway-local

# Local → prod (asks you to type "prod"). Both sides are migrated first.
copy-local-prod: db-migrate
	$(call migrate_aws,prod)
	$(AWS_ENV) DSQL_ENDPOINT_PROD=$(call endpoint,prod) bun scripts/copy.ts local prod

# Compare local and prod without writing anything.
check-local-prod: db-migrate
	$(AWS_ENV) DSQL_ENDPOINT_PROD=$(call endpoint,prod) bun scripts/copy.ts local prod --check

# Prod → dev: refreshes dev with real data. Both sides are migrated first.
copy-prod-dev:
	$(call migrate_aws,prod)
	$(call migrate_aws,dev)
	$(AWS_ENV) DSQL_ENDPOINT_PROD=$(call endpoint,prod) DSQL_ENDPOINT_DEV=$(call endpoint,dev) \
		bun scripts/copy.ts prod dev

# --- AWS deploy: make plan|output|deploy dev|prod ---

# Lambda bundle (everything bundled: the Lambda runtime's SDK may not include dsql-signer).
build-api:
	bun build api/src/handler.ts --target=node --format=esm --outfile=api/dist/index.mjs

plan: need-env build-api
	$(TF) plan

# New random JWT secret for the stack + restart its Lambda (everyone there logs in again).
# `make deploy` runs it on the first deploy; run it by hand to rotate.
jwt-secret: need-env
	$(AWS) ssm put-parameter --overwrite --name /incorporadora/$(ENV)/jwt-secret \
		--type SecureString --value "$$(openssl rand -base64 48)" >/dev/null
	$(AWS) lambda update-function-configuration --function-name $$($(TF) output -raw lambda_name) \
		--description "reload $$(date +%s)" --query LastUpdateStatus --output text

output: need-env
	@$(TF) output

# Migrates the database, applies infra and Lambda code (asks for confirmation), migrates again
# (covers the first deploy, when the cluster only exists after apply), builds, uploads the site,
# invalidates the cache. Hashed assets go first, so new HTML never points at missing files.
# Schema changes must be additive (new table/column) so the old code keeps working meanwhile.
deploy: need-env build-api
	@echo ">>> Deploying $(ENV)"
	@if [ -n "$(call endpoint,$(ENV))" ]; then $(call migrate_aws,$(ENV)); fi
	$(TF) apply
	$(call migrate_aws,$(ENV))
	@# First deploy: replace Terraform's "placeholder" secret with a random one.
	@if [ "$$($(AWS) ssm get-parameter --name /incorporadora/$(ENV)/jwt-secret --with-decryption \
		--query Parameter.Value --output text)" = placeholder ]; then $(MAKE) --no-print-directory jwt-secret $(ENV); fi
	bun run build
	BUCKET=$$($(TF) output -raw bucket_name) && \
	DIST=$$($(TF) output -raw distribution_id) && \
	$(AWS) s3 sync build/_app/immutable/ s3://$$BUCKET/_app/immutable/ \
		--cache-control "public, max-age=31536000, immutable" && \
	$(AWS) s3 sync build/ s3://$$BUCKET/ --delete \
		--exclude "_app/immutable/*" \
		--cache-control "public, max-age=300" && \
	$(AWS) cloudfront create-invalidation --distribution-id $$DIST --paths "/*" \
		--query 'Invalidation.Id' --output text && \
	echo "Live at: $$($(TF) output -raw url)"
