"""Trusted acquisition and a read-only loopback font store; never a proxy."""
import argparse
import hashlib
import http.server
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
PORT = 43197
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError('Font redirect forbidden')


def download(url):
    # URLs originate only in the independently reviewed lock, never a request.
    from urllib.parse import urlsplit
    u = urlsplit(url)
    assert u.scheme == 'https' and u.hostname in ('fonts.googleapis.com', 'fonts.gstatic.com')
    assert not u.username and not u.password and u.port in (None, 443) and not u.fragment
    assert ((u.hostname == 'fonts.googleapis.com' and u.path == '/css2') or
            (u.hostname == 'fonts.gstatic.com' and (u.path.startswith('/s/') or u.path == '/l/font')))
    request = urllib.request.Request(url, headers={'User-Agent': UA}, method='GET')
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=20) as r:
        assert r.status == 200 and r.geturl() == url
        data = r.read(4 * 1024 * 1024 + 1)
        assert len(data) <= 4 * 1024 * 1024
        return data


def stage(destination):
    lock = json.loads((ROOT / 'fonts-lock.json').read_text())
    destination.mkdir(parents=True, exist_ok=False)
    mapping = {}
    for asset in lock['assets']:
        data = download(asset['url'])
        assert hashlib.sha256(data).hexdigest() == asset['sha256'], 'Font drift; require new review'
        assert data[:4] in (b'wOF2', b'wOFF', b'\x00\x01\x00\x00', b'OTTO'), 'Not a font'
        (destination / asset['sha256']).write_bytes(data)
    # Immutable genuine CSS is captured in the reviewed lock; only asset URLs change.
    for css in lock['stylesheets']:
        text = css['body']
        assert hashlib.sha256(text.encode()).hexdigest() == css['sha256']
        for asset in lock['assets']:
            text = text.replace(asset['url'], f'http://127.0.0.1:{PORT}/{asset["sha256"]}')
        assert 'https://' not in text and 'http://' in text
        mapping[css['url']] = text
    (destination / 'responses.cjs').write_text('module.exports = ' + json.dumps(mapping) + ';\n')
    (destination / 'manifest.json').write_text(json.dumps(lock, indent=2) + '\n')


def handler(root):
    lock = json.loads((root / 'manifest.json').read_text())
    assets = {f'/{a["sha256"]}': a for a in lock['assets']}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path not in assets:
                self.send_error(404)
                return
            entry = assets[self.path]
            data = (root / entry['sha256']).read_bytes()
            if hashlib.sha256(data).hexdigest() != entry['sha256']:
                self.send_error(500)
                return
            self.send_response(200)
            self.send_header('Content-Type', 'font/woff2')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            print(json.dumps({'event': 'FONT_ASSET', 'path': self.path, 'bytes': len(data)}), flush=True)

        def log_message(self, *args):
            pass

    return Handler


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('mode', choices=['stage', 'serve'])
    p.add_argument('directory', type=pathlib.Path)
    args = p.parse_args()
    if args.mode == 'stage':
        stage(args.directory)
    else:
        http.server.HTTPServer(('127.0.0.1', PORT), handler(args.directory)).serve_forever()
