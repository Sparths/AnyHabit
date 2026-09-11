# AnyHabit MCP

Official-style MCP adapter for AnyHabit's existing REST API.

The server is intentionally a thin layer:

```text
AI client -> MCP -> AnyHabit MCP -> AnyHabit REST API
```

It never talks directly to SQLite.

## Configuration

There is **no `mcp/.env`**. Configuration lives in the repository root:

```text
AnyHabit/.env
```

Copy the root example once:

```bash
cp .env.example .env
```

Then set at least:

```env
ANYHABIT_MCP_URL=http://127.0.0.1
ANYHABIT_MCP_TOKEN=ahb_your_token
```

Create the token in AnyHabit under **Settings -> Developer**. A dedicated token
named `MCP` is recommended.

Existing process environment variables override values loaded from the root
`.env`, so MCP clients can still inject their own configuration.

## Install

```bash
cd mcp
uv sync
```

## Test with MCP Inspector TUI

Because the server automatically loads `../.env`, this is enough:

```bash
npx @modelcontextprotocol/inspector --tui -- uv run mcp run server.py
```

If you do not want to edit `.env`, pass values directly:

```bash
npx @modelcontextprotocol/inspector --tui \
  -e ANYHABIT_MCP_URL=http://127.0.0.1 ANYHABIT_MCP_TOKEN=ahb_your_token \
  -- \
  uv run mcp run server.py
```

## stdio for local AI clients

`mcp.json.example` shows the normal local configuration. The AI client launches
the process and communicates over stdin/stdout.

The MCP server itself loads AnyHabit settings from the root `.env`, so the MCP
client config does not need to contain the API token.

## Streamable HTTP

For a deployed/remote MCP endpoint, run the file directly instead of through
`mcp run`:

```env
ANYHABIT_MCP_TRANSPORT=streamable-http
ANYHABIT_MCP_HOST=127.0.0.1
ANYHABIT_MCP_PORT=8001
ANYHABIT_MCP_PATH=/mcp
```

Then:

```bash
uv run python server.py
```

The endpoint is then:

```text
http://127.0.0.1:8001/mcp
```

`docker-compose.mcp.example.yml` contains a service example that talks directly
to `backend:8000`.

## Tools

### System/account
- `health_check`
- `get_current_user`
- `update_preferences`

### Trackers
- `list_trackers`
- `search_trackers`
- `get_tracker`
- `get_tracker_bundle`
- `get_tracker_analytics`
- `create_tracker`
- `update_tracker`
- `start_tracker`
- `stop_tracker`
- `archive_tracker`
- `unarchive_tracker`
- `record_relapse`
- `delete_tracker`

### Logs
- `list_logs`
- `log_progress`
- `update_log`
- `delete_log`

### Journal
- `list_journal_entries`
- `add_journal_entry`
- `update_journal_entry`
- `delete_journal_entry`

### Dashboard
- `get_dashboard_summary`
- `get_recent_activity`
- `get_dashboard_home`
- `save_dashboard_home`

### Groups
- `list_groups`
- `get_group`
- `list_group_members`
- `create_group`
- `join_group`
- `rename_group`
- `rotate_group_join_code`
- `leave_group`
- `remove_group_member`
- `delete_group`

## Destructive operations

Permanent deletion/removal tools exist but are disabled by default.

To enable them:

```env
ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true
```

This gates:

- permanent tracker deletion
- log deletion
- journal deletion
- removing a group member
- deleting/disbanding a group

Archiving a tracker is not considered destructive because its history remains.

## Intentionally not exposed

The MCP server does not expose:

- deleting the AnyHabit account
- password changes
- creating/revoking API tokens
- destructive backup replacement/import
- webhook secret management

Those are security/administrative surfaces rather than normal habit-assistant
actions.

## Files

```text
mcp/
├── server.py
├── anyhabit_client.py
├── config.py
├── pyproject.toml
├── Dockerfile
├── .dockerignore
├── mcp.json.example
├── docker-compose.mcp.example.yml
├── README.md
└── tests/
    └── test_config.py
```
