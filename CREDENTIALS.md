# External Services & Credentials

## 1. Supabase

- **Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Required env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Where to find**: Project Settings > API > Project URL / anon key / service_role key

## 2. Google OAuth (via Supabase)

- **Google Cloud Console**: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- **Supabase Auth Config**: [https://supabase.com/dashboard/project/_/auth/providers](https://supabase.com/dashboard/project/_/auth/providers)
- **Setup**: Create OAuth 2.0 Client ID (Web application), add redirect URI from Supabase Auth settings, paste Client ID & Secret into Supabase Google provider config

## 3. Google Maps JavaScript API

- **Console**: [https://console.cloud.google.com/apis/library/maps-backend.googleapis.com](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- **API Key**: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- **Required env var**: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- **Setup**: Enable "Maps JavaScript API", create an API key, optionally restrict to your domain

## 4. OneSignal (Push Notifications)

- **Dashboard**: [https://app.onesignal.com](https://app.onesignal.com)
- **Docs**: [https://documentation.onesignal.com/docs](https://documentation.onesignal.com/docs)
- **Required env vars**: `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
- **Where to find**: App Settings > Keys & IDs

## 5. Vercel (Hosting)

- **Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **CLI Setup**: `npm i -g vercel && vercel login`
- **No env var needed for dev** -- only required at deploy time
