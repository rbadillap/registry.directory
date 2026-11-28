# `apps/web/db`

The Dashboard's database: Postgres on Neon, one branch per environment. Only
used with `DASHBOARD_ENABLED` on.

Three schemas, each table and column explained by a `COMMENT`:

| Schema | What it holds |
|---|---|
| `organizations` | People (Auth0 subject only), teams, roles, permissions, tokens, platform Admins, the audit log |
| `dashboard` | What a team makes, starting with its brand |
| `feedback` | What teams do and answer, counted by team, never by person |

## Changing the schema

The tables live in [`schema.ts`](schema.ts), in Drizzle. Change them there and
let drizzle-kit write the migration (no database needed):

```bash
pnpm db:generate --name add-brand-name
```

Drizzle can't express comments, row-level security, triggers,
security-definer functions or grants. Those go in a hand-written migration,
which drizzle-kit adds to its journal:

```bash
pnpm exec drizzle-kit generate --custom --name brand-name-comment
```

Every new column needs its `COMMENT`, or `comments.test.ts` fails. Separate
statements with `--> statement-breakpoint`.

## Applying migrations

By hand, once per environment, as the database owner. Never in a build. From
`apps/web`:

```bash
pnpm db:migrate
```

drizzle-kit applies the pending migrations in a transaction and records them in
`drizzle.__drizzle_migrations`. It connects with `DATABASE_OWNER_URL`, which
Varlock resolves: a direct (not pooled) URL that lives only on the machine that
runs migrations.

Then, once per environment, the first platform Admin. The Auth0 subject is an
argument, so no identifier is written into this repository:

```bash
pnpm db:first-admin '<auth0 subject>'
```

It does nothing once any Admin exists; later Admins are granted by an Admin.

The app itself connects as `app_user`, which never bypasses row-level
security, through `APP_DATABASE_URL`. It refuses to work if that URL connects
as any other role.

## Who sees what

Row-level security is forced on every table, and the policies are named for
what they allow:

```sql
select schemaname, tablename, policyname from pg_policies
where schemaname in ('organizations', 'dashboard', 'feedback');
-- organizations | teams  | members see their team
-- dashboard     | brands | members see their team's brand
-- ...
```

The app sets who is signed in for each transaction, and the policies read it:

```sql
select set_config('app.user_id', '<users.id>', true);
```

## Tests

```bash
pnpm --filter web test
```

The tests apply every migration to PGlite, an in-memory Postgres, with
Drizzle's migrator and the same journal: no network or secret.
`comments.test.ts` fails when a table or column has no comment or a migration
file is missing from the journal; `access.test.ts` covers sign-in, `can()`,
row-level security and the guards (system roles, the last Owner, the last
Admin, insert-only tables).
