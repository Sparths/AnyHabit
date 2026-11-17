# Upgrading AnyHabit

**Short version: pull the new images and restart. Your data stays put.**

```bash
cd AnyHabit
git pull
docker compose pull
docker compose up -d
```

That is the whole procedure. The rest of this page explains what happens
underneath, and what to do in the rare case something goes wrong.

---

## Why your data survives

Your database lives in a Docker **volume** (`db_data`), not inside the
container image. Rebuilding or replacing containers never touches it —
`docker compose down` and `docker compose up -d --build` both leave the volume
alone.

On every start, AnyHabit:

1. **Checks which migrations have already been applied**, using a
   `schema_migrations` ledger inside your database.
2. **Takes a snapshot first** if there is anything to migrate and your database
   already contains data. The copy lands in `data/backups/` inside the same
   volume, named like `anyhabit-pre-migration-v1.3.0-20260821T101500Z.db`.
3. **Applies only the missing migrations**, one transaction each.

Every migration is **additive and idempotent**: it adds columns, tables and
indexes, and never drops or rewrites your entries. Running it twice changes
nothing the second time, so an interrupted upgrade is safe to retry.

Upgrading from any 0.1–0.6 release goes through the same path. Databases old
enough to predate user accounts get their trackers, logs and journals assigned
to the first account in the database, so nothing becomes orphaned.

You can confirm what happened after starting:

```bash
docker compose logs backend | grep -i migration
curl http://localhost/health
```

`/health` reports the version, the schema version, which migrations ran on the
last boot, and the path of any backup that was written. The same information is
in the app under **Settings → About**.

---

## Recommended: take your own backup first

The automatic snapshot is a safety net, not a substitute for a backup you
control. Before a major upgrade, do one of these:

**Option A — export from the app (easiest)**

Settings → Data → *Export data* → **Everything** + **JSON**. Keep the file
somewhere off the server. It can be restored later from
Settings → Data → *Restore data*, into this or any other AnyHabit install.

**Option B — copy the volume**

```bash
docker compose stop backend
docker run --rm -v anyhabit_db_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/anyhabit-backup-$(date +%F).tar.gz -C /data .
docker compose start backend
```

> The volume is usually named `<folder>_db_data`. Check with `docker volume ls`.

---

## Version-specific notes

### Upgrading to 1.3.0

Nothing is required of you, but a few things will look different:

- **Time zones.** Streaks and daily targets used to roll over at UTC midnight
  for everyone. Existing accounts keep UTC so no number changes on upgrade —
  set your real zone under **Settings → Preferences** when you are ready. Doing
  so only changes how existing entries are grouped into days; no stored data is
  rewritten, and switching back restores the previous figures exactly.
- **Relapses now reset a quit tracker's totals**, matching what the button has
  always claimed to do. "Avoided" and "Saved" count from your last relapse; the
  all-time totals are shown underneath so nothing looks lost.
- **Cookies.** `ANYHABIT_COOKIE_SECURE` now defaults to `auto` instead of
  `true`. If you reach AnyHabit over plain HTTP on a LAN address, this is the
  setting that makes signing in work; the old default made the browser discard
  the session cookie.
- **Passwords are now required to be at least 8 characters.** Existing
  passwords keep working regardless of length — the rule applies to new
  accounts and password changes.
- **Archiving.** Trackers you no longer follow can be archived instead of
  deleted, keeping their history.

Nothing needs to be re-entered, and no setting is mandatory.

---

## If something goes wrong

### Restore the automatic snapshot

```bash
# 1. Stop the app
docker compose stop backend

# 2. See what snapshots exist
docker compose run --rm --entrypoint sh backend -c "ls -la /app/data/backups"

# 3. Put one back (use the filename from step 2)
docker compose run --rm --entrypoint sh backend -c \
  "cp /app/data/backups/anyhabit-pre-migration-vX.Y.Z-TIMESTAMP.db /app/data/anyhabit.db"

# 4. Check out the version you were on, then start again
git checkout v0.6.2
docker compose up -d --build
```

### Restore a JSON export

Sign in, then Settings → Data → *Restore data*. Choose the file and click
**Preview import** — you get an exact count of what will be added before
anything is written. **Merge** adds only what is missing (safe to run twice);
**Replace** clears your existing trackers first and asks you to type a
confirmation phrase.

### Ask for help

Include the output of `curl http://localhost/health` and
`docker compose logs backend --tail 50` in your
[issue](https://github.com/Sparths/AnyHabit/issues) or
[Discord](https://discord.gg/ajknBq5zcH) message.

---

## Downgrading

Migrations only move forward. To return to an older release, restore a backup
taken *before* the upgrade and check out that version — a newer database opened
by older code will be missing columns it does not know about.
