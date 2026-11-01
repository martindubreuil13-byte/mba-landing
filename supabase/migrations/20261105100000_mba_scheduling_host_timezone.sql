-- MBA Scheduling, Stage G: the host's time zone is Asia/Bangkok (approved business decision).
-- Appointment times are stored as UTC instants and are NOT touched. What changes is the zone in which the host's weekly availability windows,
-- breaks and days off are read, and in which the admin screens, calendar events and host notices show times. Guests continue to see their own zone.
alter table public.sched_settings alter column home_time_zone set default 'Asia/Bangkok';
-- Only the untouched old default is replaced: a zone someone chose on purpose is left alone.
update public.sched_settings set home_time_zone = 'Asia/Bangkok', updated_at = now() where home_time_zone = 'America/Toronto';
notify pgrst, 'reload schema';
