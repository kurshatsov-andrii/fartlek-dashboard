-- Дописи Telegram (публічне прев’ю каналу), одна строка на post_id.
create table if not exists public.telegram_posts (
  post_id bigint primary key,
  channel_id text not null,
  channel_name text not null,
  text_content text not null default '',
  post_iso_date text not null default '',
  images jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  views bigint not null default 0,
  likes bigint not null default 0,
  raw_html text,
  synced_at timestamptz not null default now()
);

create index if not exists telegram_posts_synced_at_idx
  on public.telegram_posts (synced_at desc);

comment on table public.telegram_posts is
  'Сирі дані дописів з t.me/s/…; оновлення через API синхронізації, без звернення до Telegram з SSR дашборду.';
