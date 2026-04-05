# Deploy `process-scheduled-cards`

Daily (or hourly) job that moves `scheduled` orders due today to `ready_to_print`, or `skipped_no_subscription` when the buyer is no longer subscribed.

## Deploy the function

From the project root:

```bash
supabase functions deploy process-scheduled-cards
```

## Secrets

The function needs your Supabase project URL and **service role** key (bypasses RLS). Do not expose the service role key in client code.

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_URL` is often already available in the Edge runtime; setting it explicitly avoids ambiguity. Use the same values as in your app’s server environment.

## Invoke on a schedule

In the Supabase dashboard: **Edge Functions → process-scheduled-cards → Schedules**, or use `supabase functions schedule` if you use the CLI workflow.

Suggested cadence: once per day after midnight UTC (or align with your `scheduled_send_date` convention).

## Manual test

```bash
curl -i "https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-cards" \
  -H "Authorization: Bearer YOUR_ANON_OR_SERVICE_ROLE_JWT"
```

(Or use the dashboard “Invoke” UI.)

For local app fallback (Bearer `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/process-scheduled
```
