import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / 'data' / 'questions.json'
print(f"Reading data from: {DATA_FILE}")

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/questions.json'):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
            except FileNotFoundError:
                self.send_error(404, 'questions.json not found')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/submit':
            length = int(self.headers['Content-Length'])
            body = self.rfile.read(length)
            new_data = json.loads(body)

            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)

            last_id = max((item.get('id', 0) for item in data), default=0)
            new_id = last_id + 1
            new_data['id'] = new_id

            data.append(new_data)
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success', 'id': new_id}).encode('utf-8'))
        else:
            self.send_error(404, 'Not found')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.end_headers()

if __name__ == '__main__':
    PORT = 8000
    print(f"Serving on http://localhost:{PORT}")
    httpd = HTTPServer(('localhost', PORT), Handler)
    httpd.serve_forever()
