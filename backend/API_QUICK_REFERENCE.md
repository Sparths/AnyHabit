# AnyHabit API — Quick Reference

One-page cheat sheet for AnyHabit **0.7.0**. For prose and full payload
descriptions see [README.md](README.md); for interactive docs open
`/docs` (Swagger) or `/redoc` on a running instance.

## Base URL

```
http://localhost:8000        # backend started directly
http://localhost             # through the nginx container (docker compose)
```

There is **no `/api` prefix** — routes are mounted at the root.

## Authentication

Every endpoint except `/`, `/health` and `/version` requires credentials. There
are two ways to present them.

**Personal access token — use this for scripts.** Create one under
Settings → Developer, or via `POST /developer/tokens`. It does not expire
unless you say so, and it is revocable.

```bash
export ANYHABIT_TOKEN=ahb_your_token_here
curl -H "Authorization: Bearer $ANYHABIT_TOKEN" http://localhost:8000/trackers/
```

**Session cookie — what the web UI uses.** Sign in and reuse the `HttpOnly`
cookie, or send the `access_token` from the login response as a bearer token.

```bash
curl -c cookies.txt -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"owner@anyhabit.local","password":"anyhabit"}'

curl -b cookies.txt http://localhost:8000/auth/me
```

---

## System

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/` | Liveness ping |
| `GET` | `/health` | Version, schema version, migrations applied on last boot, backup path |
| `GET` | `/version` | Version only |

## Auth and account

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/auth/config` | Public auth configuration, including whether registration is enabled |
| `POST` | `/auth/register` | Create an account. Password must be ≥ 8 characters. |
| `POST` | `/auth/login` | Sign in. Throttled after 10 failures per identifier. |
| `POST` | `/auth/logout` | Clear the session cookie |
| `GET` | `/auth/me` | Current user, including `timezone` and `week_start` |
| `PATCH` | `/auth/me` | Update `timezone`, `week_start` and/or `username` |
| `POST` | `/auth/password` | Change password (`current_password`, `new_password`) |
| `DELETE` | `/auth/me?confirm_username=<name>` | Permanently delete the account and everything it owns |

```bash
# Days should roll over at your midnight, not UTC's
curl -b cookies.txt -X PATCH http://localhost:8000/auth/me \
  -H 'Content-Type: application/json' \
  -d '{"timezone":"Europe/Berlin","week_start":"monday"}'
```

## Trackers

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/trackers/?include_archived=false` | List accessible trackers |
| `POST` | `/trackers/` | Create a tracker |
| `GET` | `/trackers/{id}/` | One tracker |
| `PATCH` | `/trackers/{id}/` | Partial update — only the fields you send change |
| `DELETE` | `/trackers/{id}` | Delete the tracker **and all of its history** |
| `GET` | `/trackers/{id}/analytics` | Streaks, consistency, charts, heatmap, mood trend |
| `GET` | `/trackers/{id}/bundle` | Tracker + logs + journals + analytics in one call |
| `POST` | `/trackers/{id}/reset?note=...` | Log a relapse; restarts the current run |
| `PUT` | `/trackers/{id}/start` \| `/stop` | Resume or pause |
| `PUT` | `/trackers/{id}/archive` \| `/unarchive` | Hide or restore, keeping all history |

```bash
curl -b cookies.txt -X POST http://localhost:8000/trackers/ \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Quit Smoking",
    "description": "Sleeping better is the point.",
    "category": "Health",
    "type": "quit",
    "unit": "Cigarettes",
    "units_per_amount": 20,
    "units_per": "day",
    "units_per_interval": 1,
    "impact_amount": 12.5,
    "impact_unit": "$",
    "impact_per": "day",
    "start_date": "2026-01-01T00:00:00Z"
  }'
```

**Tracker types**

| Type | Meaning | Counts |
| :--- | :--- | :--- |
| `quit` | Stop doing something | Time elapsed since the last relapse |
| `build` | Do more of something | The amounts you log |
| `boolean` | Done or not done each period | One completion per window |

## Logs

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/trackers/{id}/logs/?mine_only=true&limit=1000` | List logs |
| `POST` | `/trackers/{id}/logs/` | Add a log |
| `PATCH` | `/trackers/{id}/logs/{log_id}` | Correct amount, note or timestamp |
| `DELETE` | `/trackers/{id}/logs/{log_id}` | Remove a log |

```bash
# timestamp may be sent in the body, or as the legacy ?timestamp= parameter
curl -b cookies.txt -X POST http://localhost:8000/trackers/1/logs/ \
  -H 'Content-Type: application/json' \
  -d '{"amount": 30, "note": "morning run", "timestamp": "2026-08-21T07:30:00Z"}'
```

## Journals

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/trackers/{id}/journal/?mine_only=true&search=text` | List entries |
| `POST` | `/trackers/{id}/journal/` | Add an entry (`content`, optional `mood` 1–5) |
| `PUT` | `/trackers/{id}/journal/{entry_id}` | Edit your own entry |
| `DELETE` | `/trackers/{id}/journal/{entry_id}` | Delete your own entry |

Journal entries stay private to their author, even on a shared tracker.

## Groups

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/groups/` | Groups you own or belong to |
| `POST` | `/groups/` | Create a group |
| `POST` | `/groups/join` | Join with `{"join_code": "..."}` |
| `GET` | `/groups/{id}` | One group with its members |
| `GET` | `/groups/{id}/members` | Members only |
| `PATCH` | `/groups/{id}` | Rename (owner only) |
| `POST` | `/groups/{id}/rotate-code` | Issue a new join code (owner only) |
| `DELETE` | `/groups/{id}/members/{user_id}` | Remove a member (owner only) |
| `POST` | `/groups/{id}/leave` | Leave a group you do not own |
| `DELETE` | `/groups/{id}` | Disband; shared trackers become private, nothing is deleted |

## Dashboard

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | Totals, category breakdown, impact rows, streaks, today's progress |
| `GET` | `/dashboard/activity?limit=20` | Recent logs and journal entries across every tracker, plus a mood trend |
| `GET` | `/dashboard/home` | Saved widget layout |
| `PUT` | `/dashboard/home` | Save widget layout |

## Developer

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/developer/tokens` | List your tokens (values are never returned) |
| `POST` | `/developer/tokens` | Issue a token — the only response containing its value |
| `DELETE` | `/developer/tokens/{id}` | Revoke a token, effective immediately |
| `GET` | `/developer/webhooks` | List webhooks with their delivery stats |
| `POST` | `/developer/webhooks` | Register a webhook |
| `PATCH` | `/developer/webhooks/{id}` | Rename, re-point, re-subscribe or pause |
| `POST` | `/developer/webhooks/{id}/test` | Send a sample delivery |
| `DELETE` | `/developer/webhooks/{id}` | Remove a webhook |
| `GET` | `/developer/webhooks/events` | The event names you can subscribe to |
| `GET` | `/developer/metrics` | Prometheus exposition of your own trackers |

```bash
# Issue a token that never expires
curl -b cookies.txt -X POST http://localhost:8000/developer/tokens \
  -H 'Content-Type: application/json' \
  -d '{"name":"Home Assistant"}'
# => {"id":1,"name":"Home Assistant","token":"ahb_...","token_prefix":"ahb_AbCd"}
```

### Webhooks

AnyHabit POSTs JSON to your URL when something happens. Delivery is
best-effort on a background thread with a 5 second timeout — a webhook can
never slow down or fail the action that triggered it. Outcomes are recorded on
the webhook so a broken endpoint is visible in the UI.

| Event | Fires when |
| :--- | :--- |
| `log.created` | An activity is logged |
| `log.deleted` | A log entry is removed |
| `journal.created` | A journal entry is written |
| `tracker.created` | A tracker is created |
| `tracker.relapse` | A relapse is recorded |
| `tracker.archived` | A tracker is archived |
| `streak.milestone` | A streak reaches 3, 7, 14, 21, 30, 50, 100, 365 … |

Payload shape:

```json
{
  "event": "log.created",
  "sent_at": "2026-08-21T09:15:00+00:00",
  "version": "1.4.0",
  "data": {
    "log": { "id": 42, "amount": 30.0, "note": "morning run", "timestamp": "..." },
    "tracker": { "id": 7, "name": "Running", "unit": "Minutes", "type": "build" }
  }
}
```

Every request carries `X-AnyHabit-Event` and, when the webhook has a secret,
`X-AnyHabit-Signature: sha256=<hmac>` over the raw body. Verify it:

```python
import hashlib, hmac

expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
assert hmac.compare_digest(f"sha256={expected}", request.headers["X-AnyHabit-Signature"])
```

### Prometheus

```yaml
scrape_configs:
  - job_name: anyhabit
    metrics_path: /developer/metrics
    authorization:
      credentials: ahb_your_token_here
    static_configs:
      - targets: ["anyhabit.local"]
```

Exposes `anyhabit_trackers_total`, `anyhabit_trackers_active`,
`anyhabit_due_current_period`, `anyhabit_completed_current_period`,
`anyhabit_logs_total`, `anyhabit_journal_entries_total`, and per-tracker
`anyhabit_tracker_streak_current`, `anyhabit_tracker_progress_percent` and
`anyhabit_tracker_impact_value`. Metrics are scoped to the token's owner, so a
shared instance never leaks one person's habits into someone else's dashboard.

## Backup and restore

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/export/?data_type=all&format=json` | Export. JSON is restorable; CSV is not. |
| `POST` | `/import/?mode=merge&dry_run=true` | Import a JSON export |
| `POST` | `/export/import/` | Same importer, at the address v1.2.0 used |

`data_type` accepts `all`, `trackers_only`, `journals_only`, `specific` and
`backup`. `backup` is v1.2.0's name for a full JSON export and still works.

```bash
# Back up
curl -b cookies.txt 'http://localhost:8000/export/?data_type=all&format=json' -o backup.json

# See what an import would do, without writing anything
curl -b cookies.txt -X POST 'http://localhost:8000/import/?mode=merge&dry_run=true' \
  -F 'file=@backup.json'

# Actually import. Trackers match on name + category and logs on timestamp,
# so running this twice does not duplicate anything.
curl -b cookies.txt -X POST 'http://localhost:8000/import/?mode=merge&dry_run=false' \
  -F 'file=@backup.json'
```

`mode=replace` deletes your existing trackers first and additionally requires
`confirm=REPLACE%20MY%20DATA`.

### Backup compatibility

Exports are stamped with both `format: "anyhabit-backup"` and
`export_type: "backup"`, so a file produced here restores on v1.2.0 and a file
produced by v1.2.0 restores here. `POST /export/import/` remains available as
an alias of `POST /import/` for tooling written against v1.2.0; it accepts the
same `mode`, `dry_run` and `confirm` parameters.

---

## Response conventions

- Timestamps are ISO 8601 in UTC. Day and week boundaries in analytics are
  computed in the caller's `timezone` preference.
- Errors return `{"detail": "A readable sentence"}`. Validation failures
  (`422`) also include a machine-readable `errors` array.

| Status | Meaning |
| :--- | :--- |
| `400` | Bad request — the `detail` explains what to change |
| `401` | Not signed in, or the session expired |
| `403` | Signed in, but not allowed to touch this resource |
| `404` | Not found |
| `409` | Username or email already taken |
| `422` | Payload failed validation |
| `429` | Too many failed sign-in attempts; see the `Retry-After` header |
