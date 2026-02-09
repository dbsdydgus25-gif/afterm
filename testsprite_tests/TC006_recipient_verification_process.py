import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_recipient_verification_process():
    """
    Verify the recipient identity verification workflow,
    including access control and confirmation before viewing messages.
    """
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Create a test message that requires recipient verification
    create_message_payload = {
        "content": "Test message requiring recipient verification",
        "recipient_verification_required": True
    }
    message_id = None
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/messages",
            json=create_message_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Message creation failed: {create_resp.text}"
        message_data = create_resp.json()
        message_id = message_data.get("id")
        assert message_id is not None, "Message ID not returned in creation response"

        # Step 2: Try to access the message without recipient verification - expect access denied (403)
        access_resp = requests.get(
            f"{BASE_URL}/api/messages/{message_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert access_resp.status_code == 403, "Access to message without verification should be forbidden"

        # Step 3: Submit recipient verification details
        verification_payload = {
            "recipient_name": "John Doe",
            "verification_code": "123456"
        }
        verify_resp = requests.post(
            f"{BASE_URL}/api/messages/{message_id}/verify_recipient",
            json=verification_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert verify_resp.status_code == 200, f"Recipient verification failed: {verify_resp.text}"
        verify_data = verify_resp.json()
        assert verify_data.get("verified") is True, "Recipient verification response missing verified flag"

        # Step 4: Access the message again after successful verification - expect success (200)
        access_after_resp = requests.get(
            f"{BASE_URL}/api/messages/{message_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert access_after_resp.status_code == 200, f"Access to message after verification failed: {access_after_resp.text}"
        message_view_data = access_after_resp.json()
        assert "content" in message_view_data, "Message content missing in response"
        assert message_view_data["content"] == create_message_payload["content"], "Message content mismatch"

    finally:
        # Clean up - delete the test message if created
        if message_id:
            requests.delete(
                f"{BASE_URL}/api/messages/{message_id}",
                headers=headers,
                timeout=TIMEOUT
            )


test_recipient_verification_process()