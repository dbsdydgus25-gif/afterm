import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

AUTH_TOKEN = None  # Set this to a valid token if authentication is required

headers = {
    "Content-Type": "application/json",
}
if AUTH_TOKEN:
    headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

def test_online_memorial_space_management():
    memorial_space_id = None
    try:
        # 1. Create a new public memorial space
        public_memorial_payload = {
            "name": f"Public Memorial {uuid.uuid4()}",
            "description": "A public memorial space created for testing.",
            "visibility": "public",
            "accessControl": {}
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/space",
            json=public_memorial_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        memorial_space = create_resp.json()
        memorial_space_id = memorial_space.get("id")
        assert memorial_space.get("name") == public_memorial_payload["name"]
        assert memorial_space.get("visibility") == "public"

        # 2. Retrieve the created public memorial space
        get_resp = requests.get(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Expected 200 OK, got {get_resp.status_code}"
        retrieved = get_resp.json()
        assert retrieved.get("id") == memorial_space_id
        assert retrieved.get("visibility") == "public"

        # 3. Update the memorial space to private
        update_payload = {
            "visibility": "private",
            "accessControl": {
                "allowedUsers": ["user-123@example.com", "user-456@example.com"]
            },
            "description": "Changed to private memorial space with access control."
        }
        update_resp = requests.put(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Expected 200 OK on update, got {update_resp.status_code}"
        updated = update_resp.json()
        assert updated.get("visibility") == "private"
        assert "accessControl" in updated and isinstance(updated["accessControl"], dict)

        # 4. Attempt to access the private memorial space without authorization
        # Remove Authorization header to simulate unauthenticated user
        no_auth_headers = {k: v for k, v in headers.items() if k != "Authorization"}
        access_resp = requests.get(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            headers=no_auth_headers,
            timeout=TIMEOUT
        )
        # Expect denied access (either 401 or 403)
        assert access_resp.status_code in [401, 403], f"Expected 401 or 403 for unauthorized access, got {access_resp.status_code}"

        # 5. Access the private memorial space with authorization
        access_auth_resp = requests.get(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert access_auth_resp.status_code == 200, f"Expected 200 OK for authorized access, got {access_auth_resp.status_code}"
        mem_space_auth = access_auth_resp.json()
        assert mem_space_auth.get("visibility") == "private"

        # 6. List all memorial spaces for the authenticated user and verify presence
        list_resp = requests.get(
            f"{BASE_URL}/api/space",
            headers=headers,
            timeout=TIMEOUT
        )
        assert list_resp.status_code == 200, f"Expected 200 OK for listing, got {list_resp.status_code}"
        memorial_list = list_resp.json()
        assert any(ms.get("id") == memorial_space_id for ms in (memorial_list if isinstance(memorial_list, list) else []))

        # 7. Delete the created memorial space
        delete_resp = requests.delete(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert delete_resp.status_code in [200, 204], f"Expected 200 OK or 204 No Content on delete, got {delete_resp.status_code}"

        # Confirm deletion by trying to get it again
        confirm_resp = requests.get(
            f"{BASE_URL}/api/space/{memorial_space_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert confirm_resp.status_code == 404, f"Expected 404 Not Found after deletion, got {confirm_resp.status_code}"
        memorial_space_id = None  # Already deleted

    finally:
        # Cleanup if the memorial space still exists
        if memorial_space_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/space/{memorial_space_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_online_memorial_space_management()
