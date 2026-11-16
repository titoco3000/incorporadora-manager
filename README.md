# Incorporadora Manager

Management system for a real-estate development company, in production use. It replaces spreadsheets with a single app
for buildings, clients, contracts, income, expenses and suppliers.

## Features

- **Dashboard** (`/`): charts summarizing income, expenses and contracts.
- **Tables** (`/table`, `/table/<name>`): browse every table and edit values inline (resizable, event-driven inputs).
- **Forms** (`/forms`): add buildings, clients, contacts, contracts, expenses, income, suppliers and transaction types.
- **Reports** (`/reports`): generate reports (in progress).
- Authentication with a login screen and server hooks.

## Stack

SvelteKit, TypeScript, Drizzle ORM, Bun. Continuous deployment on every push to `main`.

## Setup

```bash
cp .env.example .env   # fill in database URL and credentials
bun install
bun run dev
```

Schema changes:

```bash
npx drizzle-kit push
```

## Roadmap

- Copyable and selectable dates
- Reports
