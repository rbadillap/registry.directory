// Makes a person the first platform Admin. Run once per environment, by hand,
// after `pnpm db:migrate`, as the database owner. From apps/web:
//
//   pnpm db:first-admin '<auth0 subject>'
//
// The subject is an argument, so no identifier is written into this public
// repository. The person doesn't need to have signed in yet. Running it again,
// or once any Admin exists, changes nothing: later Admins are granted by an
// Admin, never by this script.

import pg from "pg";

const subject = process.argv[2];
if (!subject || process.argv.length > 3) {
  console.error("Usage: pnpm db:first-admin '<auth0 subject>'");
  process.exit(2);
}

const url = process.env.DATABASE_OWNER_URL;
if (!url) {
  console.error("DATABASE_OWNER_URL is not set. Run this through `pnpm db:first-admin`, which resolves it with Varlock.");
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  const { rows } = await client.query(
    "select current_database() as db, current_user as role, to_regprocedure('organizations.grant_first_admin(text)') is not null as ready"
  );
  const { db, role, ready } = rows[0];
  if (!ready) {
    throw new Error(`The organizations tables aren't in ${db} yet. Run \`pnpm db:migrate\` first.`);
  }
  const result = await client.query("select organizations.grant_first_admin($1) as outcome", [subject]);
  const outcome = result.rows[0].outcome;
  console.log(
    outcome === "granted"
      ? `Granted the first Admin in ${db} (as ${role}).`
      : `${db} already has an Admin. Nothing changed.`
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
