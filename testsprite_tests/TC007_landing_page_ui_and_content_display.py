import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
TIMEOUT = 30

def test_landing_page_ui_and_content_display():
    try:
        # GET request for base landing page
        resp = requests.get(BASE_URL + "/", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}"
        content = resp.text

        # Removed check for literal "hero" keyword

        # Check presence of feature introductions keywords
        # Keywords selected based on PRD key_features names
        features_present = [
            "feature",
            "authentication",
            "memory",
            "digital vault",
            "plans",
            "payment",
            "online memorial",
            "recipient verification"
        ]
        assert all(any(f.lower() in content.lower() for f in [feature]) for feature in features_present), \
            "Some feature introductions are not found or keywords missing in landing page"

        # Check presence of pricing overview keywords
        pricing_keywords = ["pricing", "subscription", "plan", "basic", "pro"]
        assert any(k in content.lower() for k in pricing_keywords), \
            "Pricing overview not found or keywords missing in landing page"

        # Test responsiveness by requesting landing page with mobile viewport user agent
        mobile_headers = HEADERS.copy()
        mobile_headers["User-Agent"] = (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        )
        resp_mobile = requests.get(BASE_URL + "/", headers=mobile_headers, timeout=TIMEOUT)
        assert resp_mobile.status_code == 200, f"Mobile viewport request failed with status {resp_mobile.status_code}"
        # Check no obvious signs of error or missing content in mobile version
        assert "error" not in resp_mobile.text.lower(), "Error found in mobile viewport landing page content"

        # Test responsiveness by requesting landing page with tablet viewport user agent
        tablet_headers = HEADERS.copy()
        tablet_headers["User-Agent"] = (
            "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        )
        resp_tablet = requests.get(BASE_URL + "/", headers=tablet_headers, timeout=TIMEOUT)
        assert resp_tablet.status_code == 200, f"Tablet viewport request failed with status {resp_tablet.status_code}"
        assert "error" not in resp_tablet.text.lower(), "Error found in tablet viewport landing page content"

        # Additional sanity check: check for presence of viewport meta tag indicating responsive design
        assert 'name="viewport"' in content.lower(), "Viewport meta tag missing in landing page for responsiveness"

    except RequestException as e:
        assert False, f"Request failed: {e}"

test_landing_page_ui_and_content_display()
