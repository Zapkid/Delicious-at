# Tastey

Marketplace-style web app: shops, items, orders, and admin tools. Built with **Next.js** (App Router), **Supabase** (Postgres + Auth), and **next-intl** for localized routes.

## Stack

- Next.js 16, React 19, TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS 4, Radix UI
- Vitest (integration), Playwright (e2e)

## Prerequisites

- **Node.js** (LTS) and npm
- **Docker Desktop** — required for the local Supabase stack (`npm run db:start`)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Environment variables — copy the example file and fill in values:

   ```bash
   cp .env.example .env.local
   ```

   Required for the app to run:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the client)

   Optional entries in `.env.example` (Maps, OneSignal, `NEXT_PUBLIC_APP_URL`) apply if you use those features.

3. Local database (optional but typical for development):

   ```bash
   npm run db:start    # first run can take a few minutes
   npm run db:reset    # migrations + seed
   ```

   Point `.env.local` at the URLs and keys from `npm run db:status` when using local Supabase.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Routes are locale-prefixed (default locale: `he`); middleware handles redirects.

## Supabase

Migrations live in `supabase/migrations/`. Hosted projects: link and push from the CLI.

Details: [docs/supabase-cli.md](./docs/supabase-cli.md).

## Auth (Google)

Sign-in uses OAuth with redirect `…/auth/callback`. In the Supabase dashboard (**Authentication → URL configuration**), set **Site URL** and add that callback URL under **Redirect URLs** for every environment you use (localhost, preview, production).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build and run |
| `npm run lint` | ESLint |
| `npm run db:start` / `db:stop` / `db:status` | Local Supabase stack |
| `npm run db:reset` | Reapply migrations + seed locally |
| `npm run db:push` | Push migrations to linked remote project |
| `npm run db:types` | Regenerate `src/lib/supabase/types.ts` from local DB |
| `npm run seed:demo` | Demo seed script (needs service role + URL in env) |
| `npm run test` | Integration + e2e tests |

## Deploying on Vercel

`.env.local` is gitignored and is **not** uploaded with the repo. You must define the same variables in Vercel.

1. **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add (at minimum), for **Production** and **Preview** as needed:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL (`https://….supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project **anon** key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project **service_role** key (sensitive) |

3. **Deployments** → open the latest deployment → **⋯** → **Redeploy** (env changes do not apply to past builds until you redeploy).

4. In **Supabase → Authentication → URL configuration**, set **Site URL** and **Redirect URLs** to your Vercel URL(s), including `https://<your-domain>/auth/callback`.

### If every page returns 500 / “Internal Server Error”

That usually means `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing on Vercel. The app’s Edge proxy (`src/proxy.ts`) runs on each request and needs those two variables. After adding them, redeploy.

Check **Vercel → Deployment → Logs** (or **Functions**) for errors. Avoid using `http://127.0.0.1` Supabase URLs on Vercel—use your cloud project URL.

## License

Add a `LICENSE` file when you decide how you want to share this repo.
