-- Hand-written (drizzle-kit generate --custom). What must exist before the
-- tables: the right role running the migration, and the app's role.

-- The owner runs the security-definer functions added in 0002. Policies call
-- those functions, and the functions read the same tables, so the owner must
-- bypass row-level security or the policies would recurse.
do $$
begin
  if not (select rolbypassrls from pg_roles where rolname = current_user) then
    raise exception 'Run migrations as the database owner (a role with BYPASSRLS), not as %', current_user;
  end if;
end
$$;
--> statement-breakpoint

-- The role the app connects as. It never bypasses row-level security. The
-- Release Engineer gives it a login per environment, outside the repository;
-- here it only has to exist so the grants in 0002 apply.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    create role app_user nologin nobypassrls;
  end if;
end
$$;
