# incorporadora-manager: Railway → AWS migration plan

Last of three migrations (tito-website and ceumusic are done and off Railway). This is the only
one with real business data and real users, so data moves twice: first to local (rehearsal),
then to AWS (for real). Copy what already works in `../ceumusic`: root `Makefile` (`install`,
`run`, `plan`, `output`, `deploy`), `infra/` layout, `api/dev.ts`, `src/lib/api.ts`.

**Today:** SvelteKit (adapter-node) + Postgres 17 on Railway,
`https://incorporadora-manager-production.up.railway.app`. 10 tables, bcrypt + JWT auth with an
email whitelist, 18 `+server.ts` API routes, 9 server loads.

**Target:** ~$0/month. Deleting this Railway project ends the $5/month Hobby fee.

```
CloudFront (incorporadora.titoco.dev)
  ├─ default → S3: SvelteKit SPA (adapter-static, ssr = false)
  └─ /api/*  → Lambda Function URL (CloudFront-signed, OAC), Hono
                 ├─► Aurora DSQL `incorporadora-db-prod` (IAM token auth, no VPC)
                 └─► SSM /incorporadora/prod/jwt-secret
```

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
3. `scripts/copy-from-railway.ts <target>`: same script for local and AWS.
   - tables in FK order: `transaction_type` → `building` → `company` → `user` → `whitelist_entry`
     → `contract` → `contact` → `transaction` → `history_entry`;
   - inserts with `OVERRIDING SYSTEM VALUE` (keeps ids), ≤ 500 rows per transaction, `withRetry`;
   - moves each identity counter past `max(id)`;
   - **checks, fails on any difference:** row count per table, `sum(value)` per transaction type,
     `sum(start_value)` of contracts, md5 of each table sorted by id.
4. `make copy-local`: wipes the local DB, migrates, copies.

Done when: checks pass, you log in locally with your real password, dashboard totals match Railway.

## 3. Working remotely

Goal: the app works on the `*.cloudfront.net` domain, with a scratch copy of the data.

1. `infra/`: DSQL cluster (deletion protection on, AWS Backup daily / 14 days), Lambda
   (Node 24 arm64, 512 MB for bcrypt, 15 s), Function URL `AWS_IAM` + OAC + both CloudFront
   invoke permissions, role with `path = "/app/"` + `tito-boundary` + inline policy
   (`dsql:DbConnectAdmin`, `ssm:GetParameter`, logs), SSM `jwt-secret` (placeholder), S3 + OAC,
   ACM + CloudFront for `incorporadora.titoco.dev`, Route 53 alias.
2. SPA fallback in a **CloudFront Function on the default behavior only** (`/x` → `/index.html`),
   not `custom_error_response`: that applies to `/api/*` too and would turn API 401/404 into 200 HTML.
3. The certificate is created now (only its validation records go into DNS). The site's own
   DNS record waits for step 5, behind `dns_cutover = false`. Don't open
   `incorporadora.titoco.dev` before step 5: a "no such name" answer gets cached for up to a day
   (the titoco.dev lesson).
4. `make deploy` (prints the `cloudfront.net` URL), then set the secret and restart the Lambda:
   ```
   aws --profile personal ssm put-parameter --overwrite --name /incorporadora/prod/jwt-secret --type SecureString --value "$(openssl rand -base64 48)"
   aws --profile personal lambda update-function-configuration --function-name incorporadora-prod-api --description "reload $(date +%s)"
   ```
   New secret: everyone logs in again once.
5. `make db-migrate-aws`, then `make copy-aws` as a test run.

Done when: everything from step 1 works on the `cloudfront.net` domain with real data and checks pass.

## 4. Syncing data from Railway to AWS

Goal: the final copy. Short, announced window (~30 min).

1. Tell users the date (the new URL goes live in step 5, right after).
2. Freeze Railway: scale the app service down (Postgres stays up).
3. `pg_dump -Fc` final backup.
4. `make copy-aws` (wipes the step-3 test data first). Checks must pass.
5. Smoke test: log in, dashboard totals match Railway, create / edit / undo / delete one throwaway record.
6. Close the tunnel. Check Railway → Postgres → Networking still has no public access.

**Rollback (within 14 days):** scale Railway back up, send users to the old URL, re-enter writes made on
AWS since the cutover (`history_entry` where `created_at` > cutover).

## 5. Domain creation

1. Set `dns_cutover` default to `true` in `infra/variables.tf`, `make deploy`.
2. Check `https://incorporadora.titoco.dev`: 200, login works. If `dig @1.1.1.1` resolves it but
   your machine doesn't, it's local DNS cache.
3. Announce it to users.
4. After 14 days with no problems: delete the Railway project, cancel the Hobby plan
   (Account → Plans), check the next invoice is $0, revoke the Railway GitHub app, remove your SSH key from Railway (Account → SSH Keys), `bun remove -g @railway/cli`.
