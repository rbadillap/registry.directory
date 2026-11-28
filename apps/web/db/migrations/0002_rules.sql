-- Hand-written (drizzle-kit generate --custom). Everything Drizzle can't
-- express about the tables in 0001: what each one means (COMMENTs), the
-- functions policies and the app use, the guards, row-level security and the
-- grants for app_user. db/comments.test.ts fails if a comment is missing.

-- ===========================================================================
-- Comments
-- ===========================================================================

comment on schema organizations is 'Who can do what: people, teams, roles, permissions, tokens and the platform Admins.';
--> statement-breakpoint
comment on schema dashboard is 'What a team makes in the Dashboard, starting with its brand.';
--> statement-breakpoint
comment on schema feedback is 'The Feedback Loop: what people do and what they answer, counted by team, never by person.';
--> statement-breakpoint

comment on table organizations.users is 'One row per person who has signed in. Only the Auth0 subject: no name, email or picture.';
--> statement-breakpoint
comment on column organizations.users.id is 'Our id for the person.';
--> statement-breakpoint
comment on column organizations.users.auth0_subject is 'The person''s Auth0 subject (the "sub" claim), the only link to their identity.';
--> statement-breakpoint
comment on column organizations.users.created_at is 'When the person first signed in.';
--> statement-breakpoint

comment on table organizations.teams is 'A team: the owner of a brand, its items and its tokens.';
--> statement-breakpoint
comment on column organizations.teams.id is 'The team''s id. Every check runs on this id, never on the handle.';
--> statement-breakpoint
comment on column organizations.teams.handle is 'The team''s name in URLs and in @registrydirectory/{handle}/{item}. Starts automatic (team-7k3m9q).';
--> statement-breakpoint
comment on column organizations.teams.created_at is 'When the team was created.';
--> statement-breakpoint
comment on column organizations.teams.created_by is 'The person who created the team, its first Owner.';
--> statement-breakpoint
comment on column organizations.teams.updated_at is 'When the team was last edited.';
--> statement-breakpoint

comment on table organizations.roles is 'A team''s roles. Owner, Member and Viewer are created with every team; a team can add its own.';
--> statement-breakpoint
comment on column organizations.roles.id is 'The role''s id.';
--> statement-breakpoint
comment on column organizations.roles.team_id is 'The team the role belongs to.';
--> statement-breakpoint
comment on column organizations.roles.name is 'The role''s name, unique within the team.';
--> statement-breakpoint
comment on column organizations.roles.system is 'True for Owner, Member and Viewer, which can''t be deleted or renamed.';
--> statement-breakpoint
comment on column organizations.roles.created_at is 'When the role was created.';
--> statement-breakpoint
comment on column organizations.roles.created_by is 'The person who created the role.';
--> statement-breakpoint
comment on column organizations.roles.updated_at is 'When the role was last edited.';
--> statement-breakpoint

comment on table organizations.role_permissions is 'Which permissions each role holds. Only team permissions, never platform ones.';
--> statement-breakpoint
comment on column organizations.role_permissions.id is 'The row''s id.';
--> statement-breakpoint
comment on column organizations.role_permissions.team_id is 'The team the role belongs to.';
--> statement-breakpoint
comment on column organizations.role_permissions.role_id is 'The role that holds the permission.';
--> statement-breakpoint
comment on column organizations.role_permissions.permission is 'One permission from the fixed list, such as items:read.';
--> statement-breakpoint
comment on column organizations.role_permissions.created_at is 'When the permission was added to the role.';
--> statement-breakpoint
comment on column organizations.role_permissions.created_by is 'The person who added it.';
--> statement-breakpoint

comment on table organizations.members is 'Who belongs to each team, with one role each.';
--> statement-breakpoint
comment on column organizations.members.id is 'The membership''s id.';
--> statement-breakpoint
comment on column organizations.members.team_id is 'The team.';
--> statement-breakpoint
comment on column organizations.members.user_id is 'The person.';
--> statement-breakpoint
comment on column organizations.members.role_id is 'The person''s role in this team.';
--> statement-breakpoint
comment on column organizations.members.created_at is 'When the person joined the team.';
--> statement-breakpoint
comment on column organizations.members.created_by is 'The person who added them (themselves, for a team''s creator).';
--> statement-breakpoint
comment on column organizations.members.updated_at is 'When the membership last changed, for example a new role.';
--> statement-breakpoint

comment on table organizations.tokens is 'Team tokens for the shadcn CLI and agents. A token never holds more than its creator could do when it was made.';
--> statement-breakpoint
comment on column organizations.tokens.id is 'The token''s id.';
--> statement-breakpoint
comment on column organizations.tokens.team_id is 'The team the token opens.';
--> statement-breakpoint
comment on column organizations.tokens.name is 'A name the creator gives it, such as "CI" or "my laptop".';
--> statement-breakpoint
comment on column organizations.tokens.secret_hash is 'A hash of the secret. The secret itself is shown once, at creation, and never stored.';
--> statement-breakpoint
comment on column organizations.tokens.scopes is 'The permissions the token carries, a subset of its creator''s.';
--> statement-breakpoint
comment on column organizations.tokens.expires_at is 'When the token stops working. Null means it doesn''t expire.';
--> statement-breakpoint
comment on column organizations.tokens.revoked_at is 'When the token was revoked. Null while it''s active.';
--> statement-breakpoint
comment on column organizations.tokens.created_at is 'When the token was created.';
--> statement-breakpoint
comment on column organizations.tokens.created_by is 'The person who created it.';
--> statement-breakpoint
comment on column organizations.tokens.updated_at is 'When the token last changed, for example when it was revoked.';
--> statement-breakpoint

comment on table organizations.platform_admins is 'Who holds the platform Admin role. Kept apart from team roles: no team Owner can grant it.';
--> statement-breakpoint
comment on column organizations.platform_admins.id is 'The row''s id.';
--> statement-breakpoint
comment on column organizations.platform_admins.user_id is 'The person who is an Admin.';
--> statement-breakpoint
comment on column organizations.platform_admins.created_at is 'When they became an Admin.';
--> statement-breakpoint
comment on column organizations.platform_admins.created_by is 'The Admin who granted it. Null for the first Admin, granted by the database owner.';
--> statement-breakpoint

comment on table organizations.audit_log is 'Every denial and every sensitive change. Insert-only: nobody edits or deletes a line.';
--> statement-breakpoint
comment on column organizations.audit_log.id is 'The line''s id.';
--> statement-breakpoint
comment on column organizations.audit_log.team_id is 'The team it happened in. Null for platform changes.';
--> statement-breakpoint
comment on column organizations.audit_log.action is 'What happened, such as "denied" or "admin.granted".';
--> statement-breakpoint
comment on column organizations.audit_log.detail is 'Details for debugging, such as the permission that was checked. Never a secret.';
--> statement-breakpoint
comment on column organizations.audit_log.created_at is 'When it happened.';
--> statement-breakpoint
comment on column organizations.audit_log.created_by is 'Who did it. Null when it was the database owner or nobody was signed in.';
--> statement-breakpoint

comment on table dashboard.brands is 'A team''s brand: its DESIGN.md and the shadcn theme built from it. One per team for now; it is served as @registrydirectory/{handle}/theme and /design.';
--> statement-breakpoint
comment on column dashboard.brands.id is 'The brand''s id.';
--> statement-breakpoint
comment on column dashboard.brands.team_id is 'The team the brand belongs to.';
--> statement-breakpoint
comment on column dashboard.brands.design_md is 'The DESIGN.md exactly as the team saved it.';
--> statement-breakpoint
comment on column dashboard.brands.light_theme is 'The shadcn variables for light mode generated from the DESIGN.md, with which ones were derived.';
--> statement-breakpoint
comment on column dashboard.brands.dark_params is 'The parameters dark mode is generated from (brand intensity, gray tone, darkness). Empty means the defaults.';
--> statement-breakpoint
comment on column dashboard.brands.dark_params_source is 'Who chose the dark parameters: default (nobody changed them), agent (the person''s own agent) or yours (the person, in the Dashboard).';
--> statement-breakpoint
comment on column dashboard.brands.dark_overrides is 'Dark colors the person pinned by hand. Applied last and never changed by a regeneration.';
--> statement-breakpoint
comment on column dashboard.brands.created_at is 'When the brand was first saved.';
--> statement-breakpoint
comment on column dashboard.brands.created_by is 'The person who first saved it.';
--> statement-breakpoint
comment on column dashboard.brands.updated_at is 'When the brand was last saved.';
--> statement-breakpoint

comment on table feedback.events is 'One row per thing a team did or answered. Insert-only, and never records who.';
--> statement-breakpoint
comment on column feedback.events.id is 'The event''s id.';
--> statement-breakpoint
comment on column feedback.events.team_id is 'The team it happened in. Null when nobody was signed in.';
--> statement-breakpoint
comment on column feedback.events.kind is 'track for something done (an install, a save) or answer for a reply to a question.';
--> statement-breakpoint
comment on column feedback.events.name is 'What happened, such as install, brand_saved or upload_checked.';
--> statement-breakpoint
comment on column feedback.events.subject is 'What it happened to, such as an item name. Never a person.';
--> statement-breakpoint
comment on column feedback.events.props is 'Counts and labels for the event, such as how many errors a file had. Never personal data or file contents.';
--> statement-breakpoint
comment on column feedback.events.created_at is 'When it happened.';
--> statement-breakpoint

-- ===========================================================================
-- Fixed lists. Permissions and reserved handles live in code
-- (packages/organizations); the CHECKs in 0001 are generated from the same
-- lists, and a test checks these functions agree.
-- ===========================================================================

create function organizations.team_permissions() returns text[]
language sql immutable parallel safe
return array[
  'items:read', 'items:save', 'items:mark',
  'rules:read', 'rules:write',
  'activity:read',
  'presets:write',
  'members:manage',
  'tokens:manage',
  'settings:write',
  'feedback:configure'
];
--> statement-breakpoint
comment on function organizations.team_permissions() is 'Every permission a team role can hold. Platform permissions are never in this list.';
--> statement-breakpoint

create function organizations.reserved_handles() returns text[]
language sql immutable parallel safe
return array[
  'about', 'admin', 'api', 'dashboard', 'disclosure', 'docs', 'feedback',
  'mcp', 'organizations', 'privacy', 'r', 'registrydirectory'
];
--> statement-breakpoint
comment on function organizations.reserved_handles() is 'Names no team can take: the site''s root routes and the name of every package of ours.';
--> statement-breakpoint

create function organizations.current_user_id() returns uuid
language sql stable parallel safe
return nullif(current_setting('app.user_id', true), '')::uuid;
--> statement-breakpoint
comment on function organizations.current_user_id() is 'The signed-in person for this transaction, set by the app with set_config(''app.user_id'', ..., true). Null when nobody is signed in.';
--> statement-breakpoint

create function feedback.current_token_team_id() returns uuid
language sql stable parallel safe
return nullif(current_setting('app.token_team_id', true), '')::uuid;
--> statement-breakpoint
comment on function feedback.current_token_team_id() is 'The team of the token that authenticated this transaction, set by /r. Null otherwise.';
--> statement-breakpoint

create function organizations.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;
--> statement-breakpoint
comment on function organizations.touch_updated_at() is 'Sets updated_at to now on every edit.';
--> statement-breakpoint

create function organizations.insert_only() returns trigger
language plpgsql
as $$
begin
  raise exception '%.% is insert-only', tg_table_schema, tg_table_name using errcode = 'insufficient_privilege';
end
$$;
--> statement-breakpoint
comment on function organizations.insert_only() is 'Refuses any edit or delete, for tables that only ever grow.';
--> statement-breakpoint

-- ===========================================================================
-- Functions the policies and the app use. Security definer, so they read
-- membership without going through the policies that call them.
-- ===========================================================================

create function organizations.is_member(p_team uuid, p_user uuid default organizations.current_user_id())
returns boolean
language sql stable security definer set search_path = ''
return exists (
  select 1 from organizations.members m
  where m.team_id = p_team and m.user_id = p_user
);
--> statement-breakpoint
comment on function organizations.is_member(uuid, uuid) is 'True when the person (the signed-in one by default) belongs to the team.';
--> statement-breakpoint

create function organizations.has_permission(p_team uuid, p_permission text, p_user uuid default organizations.current_user_id())
returns boolean
language sql stable security definer set search_path = ''
return exists (
  select 1
  from organizations.members m
  join organizations.role_permissions rp on rp.role_id = m.role_id
  where m.team_id = p_team and m.user_id = p_user and rp.permission = p_permission
);
--> statement-breakpoint
comment on function organizations.has_permission(uuid, text, uuid) is 'True when the person''s role in the team holds the permission. Resolved from the database, never from code.';
--> statement-breakpoint

create function organizations.holds_all(p_team uuid, p_permissions text[], p_user uuid default organizations.current_user_id())
returns boolean
language sql stable security definer set search_path = ''
return not exists (
  select 1 from unnest(p_permissions) as wanted(permission)
  where not organizations.has_permission(p_team, wanted.permission, p_user)
);
--> statement-breakpoint
comment on function organizations.holds_all(uuid, text[], uuid) is 'True when the person holds every permission in the list. Nobody grants what they don''t hold.';
--> statement-breakpoint

create function organizations.is_platform_admin(p_user uuid default organizations.current_user_id())
returns boolean
language sql stable security definer set search_path = ''
return exists (select 1 from organizations.platform_admins a where a.user_id = p_user);
--> statement-breakpoint
comment on function organizations.is_platform_admin(uuid) is 'True when the person holds the platform Admin role.';
--> statement-breakpoint

create function organizations.user_id_for(p_subject text)
returns uuid
language sql stable security definer set search_path = ''
return (select u.id from organizations.users u where u.auth0_subject = p_subject);
--> statement-breakpoint
comment on function organizations.user_id_for(text) is 'Our id for an Auth0 subject, or null if that person never signed in.';
--> statement-breakpoint

create function organizations.record_denial(p_team uuid, p_permission text, p_user uuid, p_token uuid)
returns void
language sql volatile security definer set search_path = ''
begin atomic
  insert into organizations.audit_log (team_id, action, detail, created_by)
  values (
    (select t.id from organizations.teams t where t.id = p_team),
    'denied',
    jsonb_strip_nulls(jsonb_build_object('permission', p_permission, 'token_id', p_token)),
    (select u.id from organizations.users u where u.id = p_user)
  );
end;
--> statement-breakpoint
comment on function organizations.record_denial(uuid, text, uuid, uuid) is 'Writes a denial to the audit log: which permission, for whom, in which team. Called by requireCan.';
--> statement-breakpoint

-- Sign-in: the person exists afterwards, and so does their team. The app
-- proposes the handle (it also checks it against the directory's keys); if
-- another team took it first this raises unique_violation and the app retries
-- with a new one.
create function organizations.sign_in(p_subject text, p_handle text)
returns table (user_id uuid, team_id uuid, handle text, team_created boolean)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_user uuid;
  v_team uuid;
  v_owner uuid;
  v_member uuid;
  v_viewer uuid;
begin
  insert into organizations.users (auth0_subject) values (p_subject)
  on conflict (auth0_subject) do nothing;
  -- Locking the person's row makes two first sign-ins at once create one team.
  select u.id into v_user from organizations.users u where u.auth0_subject = p_subject for update;

  select m.team_id into v_team
  from organizations.members m
  where m.user_id = v_user
  order by m.created_at, m.id
  limit 1;

  if v_team is not null then
    return query select v_user, t.id, t.handle, false from organizations.teams t where t.id = v_team;
    return;
  end if;

  insert into organizations.teams (handle, created_by) values (p_handle, v_user)
  returning id into v_team;

  insert into organizations.roles (team_id, name, system, created_by)
    values (v_team, 'Owner', true, v_user) returning id into v_owner;
  insert into organizations.roles (team_id, name, system, created_by)
    values (v_team, 'Member', true, v_user) returning id into v_member;
  insert into organizations.roles (team_id, name, system, created_by)
    values (v_team, 'Viewer', true, v_user) returning id into v_viewer;

  insert into organizations.role_permissions (team_id, role_id, permission, created_by)
  select v_team, v_owner, p, v_user from unnest(organizations.team_permissions()) as p;

  insert into organizations.role_permissions (team_id, role_id, permission, created_by)
  select v_team, v_member, p, v_user
  from unnest(array['items:read', 'items:save', 'items:mark', 'rules:read', 'rules:write', 'activity:read']) as p;

  insert into organizations.role_permissions (team_id, role_id, permission, created_by)
  values (v_team, v_viewer, 'items:read', v_user);

  insert into organizations.members (team_id, user_id, role_id, created_by)
  values (v_team, v_user, v_owner, v_user);

  return query select v_user, v_team, p_handle, true;
end
$$;
--> statement-breakpoint
comment on function organizations.sign_in(text, text) is 'Records a sign-in. The first time, creates the person''s team with the proposed handle, its Owner, Member and Viewer roles, and makes the person its Owner.';
--> statement-breakpoint

-- The first platform Admin. Only the database owner can run it (app_user has
-- no grant), and it does nothing once any Admin exists. Run by hand with
-- `pnpm db:first-admin <auth0-subject>`, so no identifier is in the repository.
create function organizations.grant_first_admin(p_subject text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'grant_first_admin needs an Auth0 subject';
  end if;
  if exists (select 1 from organizations.platform_admins) then
    return 'unchanged';
  end if;
  insert into organizations.users (auth0_subject) values (p_subject)
  on conflict (auth0_subject) do nothing;
  select u.id into v_user from organizations.users u where u.auth0_subject = p_subject;
  insert into organizations.platform_admins (user_id) values (v_user);
  return 'granted';
end
$$;
--> statement-breakpoint
comment on function organizations.grant_first_admin(text) is 'Makes a person the first platform Admin, creating their user row if they haven''t signed in yet. Does nothing once an Admin exists.';
--> statement-breakpoint

-- ===========================================================================
-- Guards: rules that hold even if the app gets them wrong.
-- ===========================================================================

-- A system role can't be renamed or deleted. Deleting the whole team is the
-- one way they go.
create function organizations.guard_system_roles() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.system and exists (select 1 from organizations.teams t where t.id = old.team_id) then
      raise exception 'The % role can''t be deleted', old.name using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.system and (new.name <> old.name or not new.system or new.team_id <> old.team_id) then
    raise exception 'The % role can''t be renamed or changed', old.name using errcode = 'check_violation';
  end if;
  if not old.system and new.system then
    raise exception 'A custom role can''t become a system role' using errcode = 'check_violation';
  end if;
  return new;
end
$$;
--> statement-breakpoint
create trigger roles_guard before update or delete on organizations.roles
  for each row execute function organizations.guard_system_roles();
--> statement-breakpoint

-- Owner always holds every team permission.
create function organizations.guard_owner_permissions() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from organizations.roles r
    where r.id = old.role_id and r.system and r.name = 'Owner'
  ) then
    raise exception 'The Owner role always holds every team permission' using errcode = 'check_violation';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$$;
--> statement-breakpoint
create trigger role_permissions_guard before update or delete on organizations.role_permissions
  for each row execute function organizations.guard_owner_permissions();
--> statement-breakpoint

-- A team is never left without an Owner.
create function organizations.guard_last_owner() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select r.id into v_owner from organizations.roles r
  where r.team_id = old.team_id and r.system and r.name = 'Owner';

  if old.role_id = v_owner
    and (tg_op = 'DELETE' or new.role_id <> v_owner)
    and exists (select 1 from organizations.teams t where t.id = old.team_id)
    and not exists (
      select 1 from organizations.members m
      where m.team_id = old.team_id and m.role_id = v_owner and m.id <> old.id
    )
  then
    raise exception 'A team always keeps at least one Owner' using errcode = 'check_violation';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$$;
--> statement-breakpoint
create trigger members_last_owner before update or delete on organizations.members
  for each row execute function organizations.guard_last_owner();
--> statement-breakpoint

-- Admin: the platform is never left without one, and every change is audited.
-- Who may insert is decided by grants: app_user can't, so only the database
-- owner (or, later, an Admin through a dedicated function) assigns it.
create function organizations.audit_platform_admins() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into organizations.audit_log (action, detail, created_by)
    values ('admin.granted', jsonb_build_object('user_id', new.user_id), new.created_by);
    return new;
  end if;
  if not exists (select 1 from organizations.platform_admins a where a.id <> old.id) then
    raise exception 'The platform always keeps at least one Admin' using errcode = 'check_violation';
  end if;
  insert into organizations.audit_log (action, detail, created_by)
  values ('admin.removed', jsonb_build_object('user_id', old.user_id), organizations.current_user_id());
  return old;
end
$$;
--> statement-breakpoint
create trigger platform_admins_audit after insert on organizations.platform_admins
  for each row execute function organizations.audit_platform_admins();
--> statement-breakpoint
create trigger platform_admins_last before delete on organizations.platform_admins
  for each row execute function organizations.audit_platform_admins();
--> statement-breakpoint

create trigger audit_log_insert_only before update or delete on organizations.audit_log
  for each row execute function organizations.insert_only();
--> statement-breakpoint
create trigger events_insert_only before update or delete on feedback.events
  for each row execute function organizations.insert_only();
--> statement-breakpoint

create trigger teams_touch before update on organizations.teams
  for each row execute function organizations.touch_updated_at();
--> statement-breakpoint
create trigger roles_touch before update on organizations.roles
  for each row execute function organizations.touch_updated_at();
--> statement-breakpoint
create trigger members_touch before update on organizations.members
  for each row execute function organizations.touch_updated_at();
--> statement-breakpoint
create trigger tokens_touch before update on organizations.tokens
  for each row execute function organizations.touch_updated_at();
--> statement-breakpoint
create trigger brands_touch before update on dashboard.brands
  for each row execute function organizations.touch_updated_at();
--> statement-breakpoint

-- ===========================================================================
-- Row-level security, forced, with names that say who sees what.
-- ===========================================================================

alter table organizations.users enable row level security;
--> statement-breakpoint
alter table organizations.users force row level security;
--> statement-breakpoint
create policy "people see their own user" on organizations.users
  for select using (id = organizations.current_user_id());
--> statement-breakpoint

alter table organizations.teams enable row level security;
--> statement-breakpoint
alter table organizations.teams force row level security;
--> statement-breakpoint
create policy "members see their team" on organizations.teams
  for select using (organizations.is_member(id));
--> statement-breakpoint

alter table organizations.roles enable row level security;
--> statement-breakpoint
alter table organizations.roles force row level security;
--> statement-breakpoint
create policy "members see their team's roles" on organizations.roles
  for select using (organizations.is_member(team_id));
--> statement-breakpoint

alter table organizations.role_permissions enable row level security;
--> statement-breakpoint
alter table organizations.role_permissions force row level security;
--> statement-breakpoint
create policy "members see what their team's roles can do" on organizations.role_permissions
  for select using (organizations.is_member(team_id));
--> statement-breakpoint

alter table organizations.members enable row level security;
--> statement-breakpoint
alter table organizations.members force row level security;
--> statement-breakpoint
create policy "members see who is in their team" on organizations.members
  for select using (organizations.is_member(team_id));
--> statement-breakpoint

alter table organizations.tokens enable row level security;
--> statement-breakpoint
alter table organizations.tokens force row level security;
--> statement-breakpoint
create policy "token managers and creators see their team's tokens" on organizations.tokens
  for select using (
    organizations.has_permission(team_id, 'tokens:manage')
    or created_by = organizations.current_user_id()
  );
--> statement-breakpoint
create policy "token managers create tokens no stronger than themselves" on organizations.tokens
  for insert with check (
    created_by = organizations.current_user_id()
    and organizations.has_permission(team_id, 'tokens:manage')
    and organizations.holds_all(team_id, scopes)
  );
--> statement-breakpoint
create policy "token managers revoke their team's tokens" on organizations.tokens
  for update using (organizations.has_permission(team_id, 'tokens:manage'))
  with check (organizations.has_permission(team_id, 'tokens:manage'));
--> statement-breakpoint

alter table organizations.platform_admins enable row level security;
--> statement-breakpoint
alter table organizations.platform_admins force row level security;
--> statement-breakpoint
create policy "admins see the admins" on organizations.platform_admins
  for select using (organizations.is_platform_admin());
--> statement-breakpoint

alter table organizations.audit_log enable row level security;
--> statement-breakpoint
alter table organizations.audit_log force row level security;
--> statement-breakpoint
create policy "people write audit lines as themselves" on organizations.audit_log
  for insert with check (
    created_by is null or created_by = organizations.current_user_id()
  );
--> statement-breakpoint
create policy "admins and activity readers read the audit log" on organizations.audit_log
  for select using (
    organizations.is_platform_admin()
    or (team_id is not null and organizations.has_permission(team_id, 'activity:read'))
  );
--> statement-breakpoint

alter table dashboard.brands enable row level security;
--> statement-breakpoint
alter table dashboard.brands force row level security;
--> statement-breakpoint
create policy "members see their team's brand" on dashboard.brands
  for select using (organizations.is_member(team_id));
--> statement-breakpoint
create policy "preset writers create their team's brand" on dashboard.brands
  for insert with check (
    created_by = organizations.current_user_id()
    and organizations.has_permission(team_id, 'presets:write')
  );
--> statement-breakpoint
create policy "preset writers edit their team's brand" on dashboard.brands
  for update using (organizations.has_permission(team_id, 'presets:write'))
  with check (organizations.has_permission(team_id, 'presets:write'));
--> statement-breakpoint

-- A request authenticated with a team token (in /r) has no signed-in person;
-- the app sets app.token_team_id to the token's team for that transaction.
alter table feedback.events enable row level security;
--> statement-breakpoint
alter table feedback.events force row level security;
--> statement-breakpoint
create policy "events are recorded only for the caller's own team" on feedback.events
  for insert with check (
    team_id is null
    or organizations.is_member(team_id)
    or team_id = feedback.current_token_team_id()
  );
--> statement-breakpoint
create policy "members read their team's events" on feedback.events
  for select using (team_id is not null and organizations.is_member(team_id));
--> statement-breakpoint
create policy "admins read every event" on feedback.events
  for select using (organizations.is_platform_admin());
--> statement-breakpoint

-- ===========================================================================
-- Grants. app_user reads through the policies and writes only what a policy
-- allows; everything else goes through the functions above.
-- ===========================================================================

revoke all on all functions in schema organizations from public;
--> statement-breakpoint
revoke all on all functions in schema feedback from public;
--> statement-breakpoint
grant usage on schema organizations, dashboard, feedback to app_user;
--> statement-breakpoint

grant select on organizations.users, organizations.teams, organizations.roles,
  organizations.role_permissions, organizations.members,
  organizations.platform_admins to app_user;
--> statement-breakpoint
grant select, insert on organizations.tokens to app_user;
--> statement-breakpoint
grant update (revoked_at) on organizations.tokens to app_user;
--> statement-breakpoint
grant select, insert on organizations.audit_log to app_user;
--> statement-breakpoint
grant select, insert on dashboard.brands to app_user;
--> statement-breakpoint
grant update (design_md, light_theme, dark_params, dark_params_source, dark_overrides)
  on dashboard.brands to app_user;
--> statement-breakpoint
grant select, insert on feedback.events to app_user;
--> statement-breakpoint

grant execute on function
  organizations.team_permissions(),
  organizations.reserved_handles(),
  organizations.current_user_id(),
  organizations.is_member(uuid, uuid),
  organizations.has_permission(uuid, text, uuid),
  organizations.holds_all(uuid, text[], uuid),
  organizations.is_platform_admin(uuid),
  organizations.user_id_for(text),
  organizations.record_denial(uuid, text, uuid, uuid),
  organizations.sign_in(text, text),
  feedback.current_token_team_id()
to app_user;
