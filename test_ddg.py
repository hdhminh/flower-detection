from duckduckgo_search import DDGS
import json

def test_search():
    with DDGS() as ddgs:
        results = list(ddgs.images("hydrangea paniculata", max_results=5))
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    test_search()
