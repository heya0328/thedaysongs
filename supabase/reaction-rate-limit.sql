-- Rate limit storage for emoji reaction broadcasts.
-- One row per anonymous user, updated in place to keep table size bounded.
create table if not exists public.reaction_rate_limits (
  user_id text primary key,
  last_sent_at timestamptz not null,
  window_start timestamptz not null,
  count integer not null
);

alter table public.reaction_rate_limits enable row level security;

-- Only the service role (Edge Function) can read or write; no client access.
revoke all on public.reaction_rate_limits from anon, authenticated;

-- Atomic gatekeeper: called from the Edge Function via rpc().
-- Returns { ok: true } on success, or { ok: false, reason: '...' } on block.
create or replace function public.try_send_reaction(p_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window timestamptz := date_trunc('minute', v_now);
  v_row public.reaction_rate_limits%rowtype;
  v_min_gap_ms constant int := 1000;
  v_max_per_min constant int := 20;
begin
  if p_user_id is null or length(p_user_id) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_user');
  end if;

  select * into v_row
  from public.reaction_rate_limits
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.reaction_rate_limits (user_id, last_sent_at, window_start, count)
    values (p_user_id, v_now, v_window, 1);
    return jsonb_build_object('ok', true);
  end if;

  if extract(epoch from (v_now - v_row.last_sent_at)) * 1000 < v_min_gap_ms then
    return jsonb_build_object('ok', false, 'reason', 'too_fast');
  end if;

  if v_row.window_start < v_window then
    update public.reaction_rate_limits
    set last_sent_at = v_now, window_start = v_window, count = 1
    where user_id = p_user_id;
    return jsonb_build_object('ok', true);
  end if;

  if v_row.count >= v_max_per_min then
    return jsonb_build_object('ok', false, 'reason', 'quota');
  end if;

  update public.reaction_rate_limits
  set last_sent_at = v_now, count = v_row.count + 1
  where user_id = p_user_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.try_send_reaction(text) from public, anon, authenticated;
grant execute on function public.try_send_reaction(text) to service_role;
