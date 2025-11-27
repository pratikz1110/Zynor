import time
import uuid
import logging
from typing import Callable
from starlette.types import ASGIApp, Receive, Scope, Send

logger = logging.getLogger("app.request")


class RequestLoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        start = time.perf_counter()
        req_id = str(uuid.uuid4())
        method = scope.get("method")
        path = scope.get("path")
        client = ""
        if scope.get("client"):
            client = f"{scope['client'][0]}:{scope['client'][1]}"

        status_code_holder = {"code": None}

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code_holder["code"] = message["status"]
                # expose request id to the client
                headers = [(k.lower(), v) for (k, v) in message.get("headers", [])]
                headers.append((b"x-request-id", req_id.encode("utf-8")))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "rid=%s | %s %s | status=%s | duration_ms=%.2f | client=%s",
                req_id, method, path, status_code_holder["code"], duration_ms, client
            )





















