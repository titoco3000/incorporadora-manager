# incorporadora-manager: Railway → AWS migration plan

Last of three migrations (tito-website and ceumusic are done and off Railway). This is the only
one with real business data and real users, so data moves twice: first to local (rehearsal),
then to AWS (for real). Copy what already works in `../ceumusic`: root `Makefile` (`install`,
`run`, `plan`, `output`, `deploy`), `infra/` layout, `api/dev.ts`, `src/lib/api.ts`.

**Today:** SvelteKit (adapter-node) + Postgres 17 on Railway,
`https://incorporadora-manager-production.up.railway.app`. 10 tables, bcrypt + JWT auth with an
email whitelist, 18 `+server.ts` API routes, 9 server loads.

**Target:** ~$0/month. Deleting this Railway project ends the $5/month Hobby fee.

Two stacks, same Terraform code, one **Terraform workspace** each (`terraform.workspace` in
every resource name, so they share nothing):

| ENV  | URL                                    | DSQL cluster              | Data                  |
| ---- | -------------------------------------- | ------------------------- | --------------------- |
| prod | `https://incorporadora.titoco.dev`     | `incorporadora-db-prod`   | real                  |
| dev  | `https://dev.incorporadora.titoco.dev` | `incorporadora-db-dev`    | copy of prod (`make copy-prod-dev`) |

```
CloudFront (incorporadora.titoco.dev | dev.incorporadora.titoco.dev)
  ├─ default → S3: SvelteKit SPA (adapter-static, ssr = false)
  └─ /api/*  → Lambda Function URL (CloudFront-signed, OAC), Hono
                 ├─► Aurora DSQL `incorporadora-db-<env>` (IAM token auth, no VPC)
                 └─► SSM /incorporadora/<env>/jwt-secret
```

AWS targets name the stack, with no default: `make deploy dev`, `make deploy prod`
(`make deploy` alone fails). Deploy also applies new migrations to that stack's database. The DSQL free tier is per account, shared by both clusters; this
app's size fits comfortably.

Data moves only through `scripts/copy.ts <from> <to>` (wipe target, copy, check; Railway is
never written; writing prod asks you to type "prod"):

| Command                   | From → to       | When                                   |
| ------------------------- | --------------- | -------------------------------------- |
| `make copy-railway-local` | Railway → local | rehearsal, and the final cutover copy  |
| `make copy-local-prod`    | local → prod    | cutover (step 4)                       |
| `make copy-prod-dev`      | prod → dev      | any time dev needs fresh real data     |
| `make check-local-prod`   | compare only    | after cutover                          |

**Changing the schema:** edit `api/src/db/schema.ts` → `make migration name=<what>` (writes
`drizzle/NNNN_<what>.sql`, commit it) → `make run` (applies locally) → `make deploy dev` →
`make deploy prod`. Additive changes only (new table / nullable or defaulted column): the
migration runs before the new Lambda code is live, and DSQL supports only part of `ALTER TABLE`,
which dev catches first.

Why DSQL: Postgres-compatible (FKs, UNIQUE, joins, `numeric`, `jsonb` all work), scales to zero,
free tier. Not DynamoDB (FKs/joins for financial data in hand-written
code), not RDS (~$12/month).

DSQL differences the code must respect (everywhere, also locally):
- no `serial` → `integer(...).generatedByDefaultAsIdentity()`;
- 1 DDL statement per transaction, `CREATE INDEX ASYNC`;
- ≤ 3,000 rows modified per transaction;
- optimistic locking: writes retry on SQLSTATE `40001` / `OC000`;
- no triggers / PL/pgSQL (the app uses none).

---

## 1. Working locally

Goal: `make run` runs the whole app (SPA + API + database) with no Railway.

1. **Database layer.** Schema: `serial` → identity. Migrations: `drizzle-kit generate` + `scripts/migrate.ts`
   (one statement per transaction, `CREATE INDEX` → `ASYNC` on DSQL, `_migrations` table);
   no `drizzle-kit push`. `api/src/db.ts`: `postgres-js`, plain `DATABASE_URL` locally,
   DSQL IAM token (`@aws-sdk/dsql-signer`) in AWS. `withRetry()` around every write transaction.
2. **API (`api/`).** Hono, one route per current `+server.ts` (same paths, same JSON). `auth.ts`,
   `history.ts`, `db/` move here. Auth middleware = today's `hooks.server.ts`. Cookie
   `HttpOnly; Secure; SameSite=Lax`. `api/dev.ts` serves it locally (set env **before** importing
   the handler, the ceumusic bug).
3. **Frontend (SPA).** `adapter-static` with `fallback: 'index.html'`, `ssr = false`. Each
   `+page.server.ts` becomes a `+page.ts` calling the API. `src/lib/api.ts` sends `x-amz-content-sha256`
   on every request with a body (POST, PUT, PATCH, DELETE). Remove `postgres`, `drizzle-orm`,
   `bcryptjs`, `jsonwebtoken` from the frontend.
4. **Local database:** Postgres 17 in docker (`make run` starts it), schema via `make db-migrate`.

Done when: login, dashboard, every form/table/report and undo work against an empty local database.

## 2. Syncing data from Railway to local

Goal: a real copy of production running locally. This is the rehearsal for step 4.

1. `make railway-tunnel` in its own terminal: SSH tunnel to Railway Postgres on `localhost:15432`
   (Railway CLI, no public access needed). `RAILWAY_DATABASE_URL` in `.env` points there.
2. Backup first: `pg_dump -Fc` → keep offline. Never commit it (`*.dump` in `.gitignore`).
3. `scripts/copy.ts <from> <to>`: same script for every copy (see the table above).
   - tables in FK order: `transaction_type` → `building` → `company` → `user` → `whitelist_entry`
     → `contract` → `contact` → `transaction` → `history_entry`;
   - inserts with `OVERRIDING SYSTEM VALUE` (keeps ids), ≤ 500 rows per transaction, `withRetry`;
   - moves each identity counter past `max(id)`;
   - **checks, fails on any difference:** row count per table, `sum(value)` per transaction type,
     `sum(start_value)` of contracts, md5 of each table sorted by id.
4. `make copy-railway-local`: recreates the local DB, migrates, copies.

Done when: checks pass, you log in locally with your real password, dashboard totals match Railway.

## 3. Working remotely

Goal: dev works on `dev.incorporadora.titoco.dev` with real data; prod is created but empty
and not yet on its domain.

1. `infra/`, everything named with `terraform.workspace` (names end in the env: `incorporadora-api-<env>`,
   `/incorporadora/<env>/...`, cluster `incorporadora-db-<env>`): DSQL cluster (deletion
   protection on for prod, AWS Backup daily / 14 days for prod), Lambda (Node 24 arm64, 512 MB
   for bcrypt, 15 s), Function URL `AWS_IAM` + OAC + both CloudFront invoke permissions, role
   with `path = "/app/"` + `tito-boundary` + inline policy (`dsql:DbConnectAdmin` on its own
   cluster only, `ssm:GetParameter` on its own prefix, logs), SSM `jwt-secret` (placeholder),
   S3 + OAC, ACM + CloudFront, Route 53 alias. Output `dsql_endpoint` (the Makefile reads it).
   `make install` creates both workspaces.
2. SPA fallback in a **CloudFront Function on the default behavior only** (`/x` → `/index.html`),
   not `custom_error_response`: that applies to `/api/*` too and would turn API 401/404 into 200 HTML.
3. Domains: dev gets `dev.incorporadora.titoco.dev` on its first deploy. Prod's certificate is
   created now (only its validation records go into DNS); its site record waits for step 5,
   behind `dns_cutover = false` (only read in the prod workspace). Don't open
   `incorporadora.titoco.dev` before step 5: a "no such name" answer gets cached for up to a day
   (the titoco.dev lesson). Same for dev: open it only after its deploy finished.
4. Per stack: `make deploy <env>`, then `make jwt-secret <env>` (random secret in its SSM
   parameter + Lambda restart). Different secrets: a dev login never works on prod.
5. Test run: `make copy-railway-local`,
   `make copy-local-prod`, `make copy-prod-dev`, all checks pass.

Done when: everything from step 1 works on dev's URL with real data, and prod's
`cloudfront.net` URL answers with real data.

## 4. Syncing data from Railway to AWS

Goal: the final copy. Short, announced window (~30 min).

1. Tell users the date (the new URL goes live in step 5, right after).
2. Freeze Railway: scale the app service down (Postgres stays up).
3. `make railway-tunnel` (own terminal), `make backup-railway`.
4. `make copy-railway-local`, then `make copy-local-prod` (wipes the step-3 test data first).
   Checks must pass on both.
5. Smoke test on prod's `cloudfront.net` URL: log in, dashboard totals match Railway,
   create / edit / undo / delete one throwaway record.
6. Close the tunnel. Check Railway → Postgres → Networking still has no public access.
7. `make copy-prod-dev` so dev starts from the final data.

**Rollback (within 14 days):** scale Railway back up, send users to the old URL, re-enter writes made on
AWS since the cutover (`history_entry` where `created_at` > cutover).

## 5. Domain creation

1. Set `dns_cutover` default to `true` in `infra/variables.tf`, `make deploy prod`.
2. Check `https://incorporadora.titoco.dev`: 200, login works. If `dig @1.1.1.1` resolves it but
   your machine doesn't, it's local DNS cache.
3. Announce it to users.
4. After 14 days with no problems: delete the Railway project, cancel the Hobby plan
   (Account → Plans), check the next invoice is $0, revoke the Railway GitHub app, remove your SSH key from Railway (Account → SSH Keys), `bun remove -g @railway/cli`.
