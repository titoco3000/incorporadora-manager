// Only used by `drizzle-kit generate` (writes SQL to drizzle/). Never `drizzle-kit push`:
// migrations are applied by scripts/migrate.ts, which also handles Aurora DSQL.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './api/src/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql'
});
