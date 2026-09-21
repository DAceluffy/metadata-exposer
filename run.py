import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 5050
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"==================================================")
        print(f"  EXPOSER. // Minimal Metadata Inspector")
        print(f"  Serving at: {url}")
        print(f"  Directory:  {DIRECTORY}")
        print(f"  Press Ctrl+C to stop server")
        print(f"==================================================")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()

if __name__ == "__main__":
    start_server()
