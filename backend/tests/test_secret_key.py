"""The login signing key: never a publicly known value, and stable across restarts.

Run with:  python -m backend.tests.test_secret_key
"""

from __future__ import annotations

import os
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

PRINT_KEY = "from backend import security; print(security.SECRET_KEY_SOURCE, security.SECRET_KEY)"


def _start_backend_process(data_dir: Path) -> subprocess.Popen:
    """Load the signing key the way a fresh backend process would."""
    env = os.environ.copy()
    env["ANYHABIT_DATA_DIR"] = str(data_dir)
    env.pop("ANYHABIT_SECRET_KEY", None)
    return subprocess.Popen([sys.executable, "-c", PRINT_KEY], env=env, stdout=subprocess.PIPE, text=True)


def main() -> int:
    workdir = Path(tempfile.mkdtemp(prefix="anyhabit-secret-"))
    data_dir = workdir / "data"
    os.environ["ANYHABIT_DATA_DIR"] = str(data_dir)
    os.environ.pop("ANYHABIT_SECRET_KEY", None)
    os.environ["ANYHABIT_COOKIE_SECURE"] = "false"
    os.environ["ANYHABIT_BOOTSTRAP_PASSWORD"] = "secret-test-password"

    import jwt
    from fastapi.testclient import TestClient

    from backend import security
    from backend.main import app

    failures: list[str] = []

    def check(label: str, condition: bool, detail: str = "") -> None:
        if condition:
            print(f"  PASS  {label}")
        else:
            failures.append(f"{label} {detail}".strip())
            print(f"  FAIL  {label} {detail}")

    try:
        # --- A fresh install with no key configured ---------------------------
        key_file = data_dir / "secret_key"
        check("no key configured: a key is generated", security.SECRET_KEY_SOURCE == "created", security.SECRET_KEY_SOURCE)
        check("the key is stored in the data directory", key_file.read_text().strip() == security.SECRET_KEY)
        check("the key is random, not the old public one",
              len(security.SECRET_KEY) == 64 and security.SECRET_KEY != security.LEGACY_PUBLIC_SECRET)
        mode = stat.S_IMODE(key_file.stat().st_mode)
        check("the key file is private (0600)", mode == 0o600, oct(mode))

        client = TestClient(app)
        login = client.post(
            "/auth/login", json={"identifier": "owner@anyhabit.local", "password": "secret-test-password"}
        )
        check("signing in works", login.status_code == 200, str(login.status_code))
        session_token = login.json().get("access_token", "")
        check("the session is accepted", client.get("/auth/me").status_code == 200)

        # --- The old public key no longer opens anything ----------------------
        now = datetime.now(timezone.utc)
        forged = jwt.encode(
            {"sub": "1", "iat": now, "exp": now + timedelta(hours=1)},
            security.LEGACY_PUBLIC_SECRET,
            algorithm=security.JWT_ALGORITHM,
        )
        response = TestClient(app).get("/auth/me", headers={"Authorization": f"Bearer {forged}"})
        check("a token forged with the old public key is rejected", response.status_code == 401, str(response.status_code))

        # --- A restart reuses the stored key, so sessions survive it ----------
        restarted = _start_backend_process(data_dir)
        source, _, restarted_key = restarted.communicate(timeout=60)[0].strip().partition(" ")
        check("after a restart the stored key is reused", source == "file" and restarted_key == security.SECRET_KEY,
              source)
        try:
            jwt.decode(session_token, restarted_key, algorithms=[security.JWT_ALGORITHM])
            survived = True
        except jwt.PyJWTError:
            survived = False
        check("a session from before the restart is still valid", survived)

        # --- Workers starting at the same moment agree on one key -------------
        race_dir = workdir / "race"
        workers = [_start_backend_process(race_dir) for _ in range(8)]
        keys = {worker.communicate(timeout=60)[0].strip().partition(" ")[2] for worker in workers}
        stored = (race_dir / "secret_key").read_text().strip()
        check("concurrently started workers all use the same key", keys == {stored}, f"{len(keys)} different keys")

        # --- The resolver on its own -------------------------------------------
        scratch = workdir / "unit"

        os.environ["ANYHABIT_SECRET_KEY"] = "configured-key"
        key, source, warning = security._resolve_secret_key(scratch / "env" / "secret_key")
        check("ANYHABIT_SECRET_KEY wins when set", key == "configured-key" and source == "env" and warning is None)
        check("a configured key writes no file", not (scratch / "env" / "secret_key").exists())

        os.environ["ANYHABIT_SECRET_KEY"] = security.LEGACY_PUBLIC_SECRET
        key, source, warning = security._resolve_secret_key(scratch / "legacy" / "secret_key")
        check("the old public key is ignored even when set explicitly",
              key != security.LEGACY_PUBLIC_SECRET and source == "created" and bool(warning), source)
        os.environ.pop("ANYHABIT_SECRET_KEY")

        empty = scratch / "empty" / "secret_key"
        empty.parent.mkdir(parents=True)
        empty.write_text("")
        key, source, _ = security._resolve_secret_key(empty)
        check("an empty key file is replaced with a real key",
              source == "created" and len(key) == 64 and empty.read_text().strip() == key, source)
        again, source, _ = security._resolve_secret_key(empty)
        check("an existing key file is reused", again == key and source == "file", source)

        blocker = scratch / "not-a-directory"
        blocker.write_text("")
        key, source, warning = security._resolve_secret_key(blocker / "secret_key")
        check("an unwritable location gives a temporary random key, never the old one",
              source == "ephemeral" and len(key) == 64 and bool(warning), source)

        leftovers = [*data_dir.glob(".secret_key-*"), *race_dir.glob(".secret_key-*"), *scratch.rglob(".secret_key-*")]
        check("no temporary files are left behind", not leftovers, str(leftovers))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    print()
    if failures:
        print(f"{len(failures)} CHECK(S) FAILED:")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("ALL SECRET KEY CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
