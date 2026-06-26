-- À exécuter dans Supabase Dashboard → SQL Editor

create table if not exists outreach_events (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  event      text not null,  -- 'sent', 'open', 'click', 'bounce', 'unsubscribe'
  variant    text,
  sender     text,           -- adresse fichelocal.net utilisée
  url        text,           -- pour les clics
  created_at timestamptz default now()
);

create index if not exists outreach_events_email_idx   on outreach_events(email);
create index if not exists outreach_events_event_idx   on outreach_events(event, created_at desc);
create index if not exists outreach_events_variant_idx on outreach_events(variant);
