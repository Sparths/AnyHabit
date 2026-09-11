from __future__ import annotations

from typing import Any

import httpx

from config import Settings


class AnyHabitError(RuntimeError):
    """Readable error surfaced by AnyHabit MCP tools."""


class AnyHabitClient:
    """Thin client around AnyHabit's public REST API."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.http = httpx.Client(
            base_url=settings.base_url,
            timeout=settings.timeout_seconds,
            follow_redirects=True,
            headers={
                "Accept": "application/json",
                "User-Agent": "AnyHabit-MCP/0.1.0",
            },
        )

    def require_destructive(self, action: str) -> None:
        if not self.settings.allow_destructive:
            raise AnyHabitError(
                f"{action} is disabled. Set "
                "ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true only if you intentionally "
                "want to allow irreversible MCP actions."
            )

    def _auth_headers(self, auth: bool) -> dict[str, str]:
        if not auth:
            return {}
        if not self.settings.token:
            raise AnyHabitError(
                "ANYHABIT_MCP_TOKEN is not configured. Create a personal access "
                "token in AnyHabit under Settings -> Developer."
            )
        return {"Authorization": f"Bearer {self.settings.token}"}

    @staticmethod
    def _extract_error(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return response.text.strip() or f"HTTP {response.status_code}"

        if isinstance(payload, dict):
            detail = payload.get("detail") or payload.get("message")
            if isinstance(detail, list):
                return "; ".join(
                    item.get("msg", str(item))
                    if isinstance(item, dict)
                    else str(item)
                    for item in detail
                )
            if detail:
                return str(detail)
            if payload.get("errors"):
                return str(payload["errors"])

        return str(payload)

    def request(
        self,
        method: str,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        try:
            response = self.http.request(
                method,
                path,
                headers=self._auth_headers(auth),
                params=params,
                json=json_body,
            )
        except httpx.RequestError as exc:
            raise AnyHabitError(
                f"Could not reach AnyHabit at {self.settings.base_url}: {exc}"
            ) from exc

        if response.is_error:
            raise AnyHabitError(
                f"AnyHabit returned HTTP {response.status_code}: "
                f"{self._extract_error(response)}"
            )

        if response.status_code == 204 or not response.content:
            return None

        if "application/json" in response.headers.get("content-type", ""):
            return response.json()

        return response.text

    def get(
        self,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
    ) -> Any:
        return self.request("GET", path, auth=auth, params=params)

    def post(
        self,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        return self.request(
            "POST", path, auth=auth, params=params, json_body=json_body
        )

    def put(
        self,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        return self.request(
            "PUT", path, auth=auth, params=params, json_body=json_body
        )

    def patch(
        self,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        return self.request(
            "PATCH", path, auth=auth, params=params, json_body=json_body
        )

    def delete(
        self,
        path: str,
        *,
        auth: bool = True,
        params: dict[str, Any] | None = None,
    ) -> Any:
        return self.request("DELETE", path, auth=auth, params=params)
