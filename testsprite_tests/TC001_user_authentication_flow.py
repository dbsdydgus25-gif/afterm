import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_user_authentication_flow():
    session = requests.Session()

    signup_url = f"{BASE_URL}/api/auth/signup"
    login_url = f"{BASE_URL}/api/auth/signin"
    profile_url = f"{BASE_URL}/api/auth/profile"
    logout_url = f"{BASE_URL}/api/auth/signout"
    social_providers = {
        "google": f"{BASE_URL}/api/auth/social/google",
        "github": f"{BASE_URL}/api/auth/social/github",
        "facebook": f"{BASE_URL}/api/auth/social/facebook"
    }

    test_user = {
        "email": f"testuser_{int(time.time())}@example.com",
        "password": "TestPassword123!"
    }

    try:
        # 1. Sign up new user using email/password
        signup_payload = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        r_signup = session.post(signup_url, json=signup_payload, timeout=TIMEOUT)
        assert r_signup.status_code == 201 or r_signup.status_code == 200, f"Signup failed: {r_signup.text}"
        signup_data = r_signup.json()
        assert "access_token" in signup_data and signup_data["access_token"], "No access_token in signup response"

        # Use token for authenticated requests
        session.headers.update({"Authorization": f"Bearer {signup_data['access_token']}"})

        # 2. Verify session persistence by fetching profile info (simulate middleware redirect check)
        r_profile = session.get(profile_url, timeout=TIMEOUT)
        assert r_profile.status_code == 200, f"Profile fetch failed after signup: {r_profile.text}"
        profile_data = r_profile.json()
        assert profile_data.get("email") == test_user["email"], "Profile email does not match signup email"

        # 3. Logout the user
        r_logout = session.post(logout_url, timeout=TIMEOUT)
        assert r_logout.status_code == 200, f"Logout failed: {r_logout.text}"

        # 4. Login with email/password
        login_payload = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        r_login = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert r_login.status_code == 200, f"Login failed: {r_login.text}"
        login_data = r_login.json()
        assert "access_token" in login_data and login_data["access_token"], "No access_token in login response"

        # Update Authorization header with new token
        session.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})

        # Verify session persistence again
        r_profile_after_login = session.get(profile_url, timeout=TIMEOUT)
        assert r_profile_after_login.status_code == 200, f"Profile fetch failed after login: {r_profile_after_login.text}"
        profile_data_after_login = r_profile_after_login.json()
        assert profile_data_after_login.get("email") == test_user["email"], "Profile email mismatch after login"

        # 5. Test social login options available endpoints (simulate requesting social login URLs)
        for provider, url in social_providers.items():
            r_social = session.get(url, allow_redirects=False, timeout=TIMEOUT)
            # Expect redirect to social provider auth URL (HTTP 302)
            assert r_social.status_code in [302, 307], f"Social login {provider} endpoint failed: {r_social.text}"
            location = r_social.headers.get("Location")
            assert location and provider in location.lower(), f"Social login {provider} redirect URL missing or incorrect"

        # 6. Simulate token persistence and middleware redirect logic by refreshing token and profile fetch
        # Here, we simulate by reusing token and fetching profile multiple times
        for _ in range(2):
            r_profile_repeat = session.get(profile_url, timeout=TIMEOUT)
            assert r_profile_repeat.status_code == 200, f"Profile fetch failed during session persistence test: {r_profile_repeat.text}"
            assert r_profile_repeat.json().get("email") == test_user["email"], "Session email mismatch on repeated fetch after login"

    finally:
        # Cleanup: if signed up and have token, delete user account if API supports
        # Assuming there's an endpoint DELETE /api/auth/user to delete current user
        if "Authorization" in session.headers:
            delete_user_url = f"{BASE_URL}/api/auth/user"
            try:
                r_delete = session.delete(delete_user_url, timeout=TIMEOUT)
                assert r_delete.status_code == 200 or r_delete.status_code == 204, f"User deletion failed: {r_delete.text}"
            except Exception:
                pass

test_user_authentication_flow()
