import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Assuming the API requires authentication, but since no auth details are given,
# we will simulate with headers placeholder. Adjust as needed.
HEADERS = {
    "Content-Type": "application/json",
    # "Authorization": "Bearer <token>",  # Include if authentication is required
}

def test_digital_vault_storage_security():
    """
    Test the secure storage and management of digital assets and sensitive legacy information
    in the digital vault, ensuring data privacy and access control.
    """
    vault_item_id = None
    try:
        # Step 1: Create a new digital vault item with sensitive data
        create_payload = {
            "name": "Test Sensitive Legacy Item " + str(uuid.uuid4()),
            "description": "Confidential test legacy data.",
            "item_type": "document",
            "content": "EncryptedContentPlaceholder==",
            "access_level": "private"  # enforcing access control
        }
        create_response = requests.post(
            f"{BASE_URL}/api/vault/items",
            json=create_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"Expected 201 Created, got {create_response.status_code}"
        created_item = create_response.json()
        vault_item_id = created_item.get("id")
        assert vault_item_id is not None, "Created vault item ID is None"

        # Step 2: Retrieve the vault item to verify storage and access control
        get_response = requests.get(
            f"{BASE_URL}/api/vault/items/{vault_item_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Expected 200 OK, got {get_response.status_code}"
        retrieved_item = get_response.json()
        assert retrieved_item.get("id") == vault_item_id, "Retrieved item ID mismatch"
        assert retrieved_item.get("access_level") == "private", "Access level not as expected"
        # Verify sensitive content is present but in secure form
        assert "content" in retrieved_item and retrieved_item["content"] == create_payload["content"], "Content mismatch or missing"

        # Step 3: Attempt unauthorized access simulation (no auth header)
        unauthorized_response = requests.get(
            f"{BASE_URL}/api/vault/items/{vault_item_id}",
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        assert unauthorized_response.status_code in (401, 403), f"Expected 401 or 403 for unauthorized access, got {unauthorized_response.status_code}"

        # Step 4: Update the vault item to change access level and verify update
        update_payload = {
            "access_level": "restricted"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/vault/items/{vault_item_id}",
            json=update_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert update_response.status_code == 200, f"Expected 200 OK on update, got {update_response.status_code}"
        updated_item = update_response.json()
        assert updated_item.get("access_level") == "restricted", "Access level update failed"

        # Step 5: Delete the vault item to clean up
        delete_response = requests.delete(
            f"{BASE_URL}/api/vault/items/{vault_item_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert delete_response.status_code == 204, f"Expected 204 No Content on delete, got {delete_response.status_code}"
        vault_item_id = None  # Deleted successfully, avoid deletion in finally

    finally:
        # Cleanup in case of test failure before deletion
        if vault_item_id is not None:
            try:
                requests.delete(
                    f"{BASE_URL}/api/vault/items/{vault_item_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_digital_vault_storage_security()
