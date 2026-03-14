from typing import Any
import requests
from bs4 import BeautifulSoup 
import re

HEADERS = {
    "User-Agent": "PrestonResearchBot (https://www.linkedin.com/in/preston-paris-gsu/)"
}
BASE_URL = "https://en.wikipedia.org"

class CleanOutput:
    '''Used to parse raw HTML'''
    def __init__(self) -> None:
        # 11 January 2024
        self.dateRegex = re.compile(r"\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,4}")

    def get_text(self, element) -> str:
        return element.get_text(strip=True)
    
    def contains_date(self, text: str) -> bool:
        return bool(self.dateRegex.search(text))

# initialize a clean output object
cleaner = CleanOutput()

def extract_links(soup, topic) -> list:
    """Find related wiki links on the page"""
    links = []

    # '/wiki/Iraq%E2%80%93Kuwait_border'
    tags = soup.find_all("a", string=lambda text: text and topic.lower() in text.lower())

    for tag in tags:
        href = tag.get("href")
        if href and href.startswith("/wiki") and ":" not in href:
            links.append(href)
    
    return links

def extract_dated_events(soup) -> list:
    """Extract paragraphs containing dates"""

    events = []
    for p in soup.select(".mw-parser-output p"):
        text = cleaner.get_text(p)

        if cleaner.contains_date(text):
            events.append(text)
    return events

def write_events(title, events) -> None:
    """Write dated events based on any page to file"""
    
    # Parse the page and extract the text
    safe_title = re.sub(r"[^\w\s-]", "", title)

    # Create relevant text file, dump dated events
    with open(f'{safe_title} Dump.txt', 'a') as f:
        for event in events:
            f.write(event + "\n")

def scrape_page(url, topic) -> Any:
    """Scrape 1 wikipedia page"""

    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        print("Failed:", url)
        return [], []
    

    soup = BeautifulSoup(response.text, "html.parser")
    page_title = soup.title.text.replace(" - Wikipedia", "")
    events = extract_dated_events(soup)
    links = extract_links(soup, topic)
    return page_title, events, links


def crawl(start_url, topic, max_pages=10) -> None:
    # Use the initial URL to do a controlled information dump

    visitedPages = set()
    queue = [start_url]
    all_events = []

    while queue and len(visitedPages) < max_pages:
        url = queue.pop(0)
        if url in visitedPages: 
            continue

        print("Scraping:", url)
        visitedPages.add(url)

        title, events, links = scrape_page(url, topic)
        all_events.extend(events)

        for link in links:
            full_url = BASE_URL + link
            if full_url not in visitedPages:
                queue.append(full_url)
        
    write_events("combined_events", all_events)

if __name__ == "__main__":
    initial_url = "https://en.wikipedia.org/wiki/Gulf_War"
    test_topic = "Iraq"
    crawl(initial_url, test_topic, max_pages=40)