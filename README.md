This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Booking app setup

This project includes a booking page and admin settings page.

### Environment variables

Add these in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AUTH_SECRET=your_random_auth_secret
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_CALENDAR_ID=your_calendar_id
```

### Supabase migration

Run these SQL scripts in your Supabase database, or use the files in `supabase/migrations/`:

The project now includes:

- `supabase/migrations/0001_add_booking_fields.sql`
- `supabase/migrations/0002_grant_service_role_permissions.sql`
- `supabase/migrations/0003_add_title_to_settings.sql`
- `supabase/migrations/0004_add_users_table.sql`
- `supabase/migrations/0005_grant_users_permissions.sql`


```sql
-- Migration: Add booking support and improve settings schema

CREATE TABLE IF NOT EXISTS settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  slot_length smallint NOT NULL,
  slot_intervall smallint NOT NULL,
  notification_email text NOT NULL,
  slack_webhook text,
  is_active boolean NOT NULL DEFAULT true,
  availability_start timestamptz NOT NULL,
  availability_end timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_email text NOT NULL,
  car_number text NOT NULL,
  external_id text,
  status text NOT NULL DEFAULT 'confirmed',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  google_event_id text,
  settings_id bigint REFERENCES settings(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_start_at_unique ON bookings(start_at);
CREATE UNIQUE INDEX IF NOT EXISTS settings_active_unique ON settings(is_active) WHERE is_active;
```

### Next steps

- Run `npm run seed:user -- --email admin@example.com --password secret` to create the first app user.
- Visit `/` to log in and manage settings.
- Visit `/admin` to configure slot length, interval, availability window, and notification settings.
- Visit `/` to book a slot and create a Google Calendar appointment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
