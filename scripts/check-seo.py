"""Read-only checks for priority public SEO routes. Run with Python 3."""

import concurrent.futures
import json
import re
import sys
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = "https://www.aimag.kz"
PATHS = [
    "/kabeli-sip",
    "/kabeli-vvg-avvg",
    "/elektromontazh",
    "/catalog?cat=kabel-provod",
    "/catalog?cat=izolyatory-armatura",
    "/catalog?cat=armatura-sip",
    "/catalog?cat=vysokovoltnoe",
    *[
        f"/blog/{slug}"
        for slug in [
            "kupit-sip-3-kazakhstan",
            "kupit-sip-4-kazakhstan",
            "kupit-vvgng-kazakhstan",
            "kupit-izolyatory-kazakhstan",
            "kupit-silovoy-transformator-kazakhstan",
            "kupit-ktp-kazakhstan",
            "komplektaciya-obekta-elektromontazh-pod-klyuch",
        ]
    ],
]


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "AIMAG-SEO-Check/1.0"})
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.status, response.geturl(), response.headers, response.read().decode("utf-8")


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.robots = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and "canonical" in (values.get("rel") or "").lower().split():
            self.canonicals.append(values.get("href"))
        if tag == "meta" and (values.get("name") or "").lower() in ["robots", "googlebot"]:
            self.robots.append(values.get("content") or "")


def main():
    try:
        _, _, _, robots_text = fetch(f"{BASE}/robots.txt")
        rules = urllib.robotparser.RobotFileParser()
        rules.parse(robots_text.splitlines())
        _, _, _, sitemap_text = fetch(f"{BASE}/sitemap.xml")
        root = ET.fromstring(sitemap_text)
        locations = [element.text for element in root.findall(".//{*}loc")]
        urls = set(locations)
        if len(locations) != len(urls):
            raise ValueError("Duplicate URLs in sitemap")
        if not urls:
            raise ValueError("Empty sitemap")
    except Exception as error:
        print(f"FAIL robots/sitemap: {error}")
        return 1

    def check(path):
        url = BASE + path
        problems = []
        try:
            status, final_url, headers, html = fetch(url)
            metadata = Metadata()
            metadata.feed(html)
            if status != 200 or final_url != url:
                problems.append(f"unexpected response: {status}, {final_url}")
            if metadata.canonicals != [url]:
                problems.append(f"canonical: {metadata.canonicals}")
            directives = metadata.robots + headers.get_all("X-Robots-Tag", [])
            if any(re.search(r"\b(noindex|none)\b", value, re.I) for value in directives):
                problems.append("noindex directive")
            if not rules.can_fetch("Googlebot", url):
                problems.append("blocked by robots.txt")
            if url not in urls:
                problems.append("missing from sitemap")
        except Exception as error:
            problems.append(str(error))
        return {"path": path, "ok": not problems, "problems": problems}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, PATHS))
    print(json.dumps({"sitemap_urls": len(urls), "pages": results}, ensure_ascii=False, indent=2))
    print("Checks measure crawl eligibility, not actual indexing or search rankings.")
    return int(any(not result["ok"] for result in results))


if __name__ == "__main__":
    sys.exit(main())
