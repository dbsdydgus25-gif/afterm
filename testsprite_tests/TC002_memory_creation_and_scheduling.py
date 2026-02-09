import requests
import uuid
import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Dummy user credentials for authentication (should exist in test environment)
USER_EMAIL = "testuser@example.com"
USER_PASSWORD = "TestPassword123!"

def authenticate_user(email, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "access_token" in data and data["access_token"], "Authentication token missing in login response"
    return data["access_token"]

def create_memory(token, title, content, scheduled_send_dt, is_draft):
    url = f"{BASE_URL}/api/memories"
    payload = {
        "title": title,
        "content": content,
        "scheduledSendDateTime": scheduled_send_dt,
        "isDraft": is_draft
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "id" in data, "Memory creation response missing 'id'"
    return data

def update_memory(token, memory_id, updated_fields):
    url = f"{BASE_URL}/api/memories/{memory_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    response = requests.put(url, json=updated_fields, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    return data

def get_memory(token, memory_id):
    url = f"{BASE_URL}/api/memories/{memory_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    return data

def delete_memory(token, memory_id):
    url = f"{BASE_URL}/api/memories/{memory_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    if response.status_code not in [200, 204, 404]:
        response.raise_for_status()

def test_memory_creation_and_scheduling():
    token = authenticate_user(USER_EMAIL, USER_PASSWORD)

    memory_id = None
    try:
        unique_title = f"Test Memory Draft {uuid.uuid4()}"
        content = "This is a draft memory content."
        scheduled_dt = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z"
        draft_memory = create_memory(token, unique_title, content, scheduled_dt, is_draft=True)
        memory_id = draft_memory["id"]
        assert draft_memory["title"] == unique_title
        assert draft_memory["content"] == content
        assert draft_memory["isDraft"] is True
        assert draft_memory["scheduledSendDateTime"] == scheduled_dt

        update_fields = {"content": "Updated draft content to simulate user editing."}
        updated_memory = update_memory(token, memory_id, update_fields)
        assert updated_memory["content"] == update_fields["content"]
        assert updated_memory["isDraft"] is True

        final_update = {"isDraft": False}
        finalized_memory = update_memory(token, memory_id, final_update)
        assert finalized_memory["isDraft"] is False

        fetched_memory = get_memory(token, memory_id)
        assert fetched_memory["id"] == memory_id
        assert fetched_memory["title"] == unique_title
        assert fetched_memory["isDraft"] is False
        assert fetched_memory["scheduledSendDateTime"] == scheduled_dt
        assert fetched_memory["content"] == updated_memory["content"]

    finally:
        if memory_id:
            delete_memory(token, memory_id)

test_memory_creation_and_scheduling()
