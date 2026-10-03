"""Check production documents without relying on a history fallback server."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import os

root = Path(__file__).resolve().parents[1]
dist = root / "apps/docs/dist"
base = os.environ.get("CWA_BASE", "/cwa-design/")


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.h1 = 0
        self.ids = set()
        self.links = []
        self.resources = []
        self.canonicals = []
        self.title = False
        self.description = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "title":
            self.title = True
        if tag == "meta" and attrs.get("name") == "description":
            self.description = bool(attrs.get("content"))
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href", ""))
        if tag in ["script", "img", "source"] and attrs.get("src"):
            self.resources.append(attrs["src"])
        if tag == "link" and attrs.get("rel") in ["stylesheet", "icon", "modulepreload"]:
            self.resources.append(attrs.get("href", ""))


files = sorted(dist.rglob("*.html"))
docs = {file: Document(file.read_text()) for file in files if "storybook" not in file.parts}
errors = []
component_pages = [file for file in docs if file.parent.parent.name == "components"]
if len(component_pages) != 30:
    errors.append(f"Expected 30 component details, found {len(component_pages)}")
for file, doc in docs.items():
    name = str(file.relative_to(dist))
    if doc.h1 != 1:
        errors.append(f"{name}: expected one h1, got {doc.h1}")
    if not doc.title or not doc.description or len(doc.canonicals) != 1:
        errors.append(f"{name}: incomplete title/description/canonical")
    for url in doc.links + doc.resources:
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc:
            continue
        if not parsed.path:
            target = file
        elif parsed.path.startswith("/"):
            if base != "/" and not parsed.path.startswith(base):
                errors.append(f"{name}: URL escapes production base: {url}")
                continue
            relative = parsed.path[len(base):] if base != "/" else parsed.path[1:]
            target = dist / unquote(relative)
        else:
            target = file.parent / unquote(parsed.path)
        if target.is_dir():
            target = target / "index.html"
        target = target.resolve()
        if not target.is_relative_to(dist.resolve()) or not target.exists():
            errors.append(f"{name}: missing local destination {url}")
            continue
        if parsed.fragment and target.suffix == ".html" and target in docs:
            if unquote(parsed.fragment) not in docs[target].ids:
                errors.append(f"{name}: missing anchor {url}")
    expected_path = "/404.html" if name == "404.html" else "/" + name.removesuffix("index.html")
    if doc.canonicals and urlsplit(doc.canonicals[0]).path != base + expected_path.lstrip("/"):
        errors.append(f"{name}: incorrect canonical {doc.canonicals[0]}")

result = {"date": "2026-10-03", "base": base, "htmlPages": len(docs),
          "componentDetails": len(component_pages), "errors": errors}
output = root / "reports/optimization/static-site-results.json"
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(result, ensure_ascii=False))
raise SystemExit(1 if errors else 0)
