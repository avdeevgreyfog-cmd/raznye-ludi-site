-- Set the planned dates for the Tominский лесопарк hike.
-- The exact clock time is still unknown; midnight is only a date placeholder.
update public.hike_events
set starts_at = timestamptz '2026-10-10 00:00:00+03',
    duration_days = 2,
    overnight = true,
    updated_at = now()
where slug = 'tominsky-lesopark';
