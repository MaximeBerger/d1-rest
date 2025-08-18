#!/usr/bin/env python3

import argparse
import functools
import http.server
import socketserver
import sys
from typing import Type


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Simple HTTP handler that adds permissive CORS headers.

    Serves files from the provided directory and responds to OPTIONS preflight.
    """

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        # Optional: disable caching for easier dev
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802 (keep stdlib method name)
        self.send_response(200, "ok")
        self.end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Static file server with CORS enabled")
    parser.add_argument("--port", "-p", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument(
        "--dir",
        "-d",
        default="public",
        help="Directory to serve (default: public)",
    )
    args = parser.parse_args()

    handler_factory: Type[http.server.SimpleHTTPRequestHandler] | functools.partial
    # Use functools.partial to inject directory in handler (supported in Python 3.7+)
    handler_factory = functools.partial(CORSRequestHandler, directory=args.dir)

    with socketserver.TCPServer(("", args.port), handler_factory) as httpd:
        print(f"Serving '{args.dir}' at http://localhost:{args.port} with CORS enabled", file=sys.stderr)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Shutting down server...", file=sys.stderr)
        finally:
            httpd.server_close()


if __name__ == "__main__":
    main()


