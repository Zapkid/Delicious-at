# Supabase CLI (this repo)

The [Supabase CLI](https://supabase.com/docs/guides/cli) manages local Postgres (Docker), migrations in `supabase/migrations/`, and linking to your hosted project.

## Install

1. **CLI (pinned in this project)**  
   After `npm install`, run commands via `npx supabase …` or the npm scripts below.

2. **Docker Desktop** (required for `db:start` / `db:reset`)  
   Local Supabase runs Postgres, Auth, Studio, etc. in containers. [Install Docker](https://docs.docker.com/get-docker/) and keep it running.

3. **Optional: global CLI**  
   `brew install supabase/tap/supabase` (macOS) avoids `npx` if you prefer.

## Quick reference

| Goal | Command |
| --- | --- |
| Start local stack | `npm run db:start` |
| Stop local stack | `npm run db:stop` |
| API / DB URLs and keys | `npm run db:status` |
| Apply migrations + seed locally | `npm run db:reset` |
| Push migrations to **linked** remote | `npm run db:push` |
| Diff remote vs local → new migration | `npm run db:diff` |
| Link folder to hosted project | `npm run db:link` |
| Regenerate `src/lib/supabase/types.ts` from local DB | `npm run db:types` |

Pass extra CLI args after `--`, e.g. `npx supabase migration new add_coupons`.

## Local development

1. `npm run db:start` — first run pulls images and can take a few minutes.
2. `npm run db:status` — copy **API URL** and **anon key** into `.env.local` if you want the Next app to talk to local Supabase instead of production (use the `publishable` / `anon` key from the status output).
3. `npm run db:reset` — reapplies all files in `supabase/migrations/` in order, then runs `supabase/seed.sql`.

Default local ports (see `supabase/config.toml`): API `54321`, DB `54322`, Studio `54323`.

## Hosted project (staging / production)

1. Log in once: `npx supabase login` (opens browser).
2. Link: `npm run db:link` — choose organization and project (stores connection in `.supabase/`; that folder is gitignored by the CLI).
3. Push pending migrations: `npm run db:push`.

**Safety:** `db:push` applies migration files that are not yet recorded on the remote. Review SQL in PRs; avoid editing applied migrations—instead add a new file under `supabase/migrations/`.

## New migration workflow

1. Create a file: `npx supabase migration new describe_change`  
   (creates a timestamped SQL file in `supabase/migrations/`.)
2. Edit the SQL.
3. Test locally: `npm run db:reset`.
4. Commit the migration file and deploy to remote with `npm run db:push` after linking.

Alternatively, prototype in Studio SQL editor, then capture schema with `npm run db:diff` (requires a clean link and care with generated SQL).

## Types

`npm run db:types` overwrites `src/lib/supabase/types.ts` from the **local** database schema. Start the stack (`db:start`) and ensure migrations are applied (`db:reset`) first.

To generate from the **linked** hosted project instead: `npx supabase gen types --linked > src/lib/supabase/types.ts`.

## Troubleshooting

- **Cannot find project ref / Have you run supabase link?** — Remote commands (`db push`, `gen types --linked`, etc.) need a **hosted** project. Run `npx supabase login`, then `npm run db:link` (or `npx supabase link --project-ref <id>`). The ref is **Project Settings → General → Reference ID** in the dashboard, not `project_id` in `config.toml` (that label is for the local stack only).
- **`db push` fails with “already exists” (types, tables, constraints)** — The remote database was likely created or updated **outside** the CLI migration history (Studio SQL, old deploy, etc.), so Supabase tries to re-apply files that are already on the server. Check `npx supabase migration list`: if **Remote** is empty but the schema is there, mark matching versions as recorded: `npx supabase migration repair --status applied 001 --yes` (repeat `002`, … for each file that’s already reflected in the DB), then run `npx supabase db push --yes` again. Only repair versions you know are truly applied; otherwise you can skip real migrations and leave the DB out of sync.
- **Port in use:** Change `[api]`, `[db]`, or `[studio]` ports in `supabase/config.toml`, or stop the conflicting service.
- **Version mismatch:** `supabase/config.toml` sets `[db] major_version` — align with your hosted Postgres (Dashboard → Database → version, or run `SHOW server_version;`).
- **Auth redirects:** For local sign-in, adjust `site_url` / `additional_redirect_urls` under `[auth]` in `supabase/config.toml` to match your app URL (e.g. `http://localhost:3000`).

Official reference: [Supabase CLI config](https://supabase.com/docs/guides/cli/config).
