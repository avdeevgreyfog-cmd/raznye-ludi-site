-- Fix agreed Tominsky hike schedule.
update public.hike_events
set starts_at = timestamptz '2026-10-10 10:00:00+03',
    meeting_label = '09:00 · место сбора уточняется',
    duration_days = 2,
    overnight = true,
    updated_at = now()
where slug = 'tominsky-lesopark';
