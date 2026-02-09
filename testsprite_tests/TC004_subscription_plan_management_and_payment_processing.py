import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Dummy user credentials for authentication (replace with valid test user credentials)
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def test_subscription_plan_management_and_payment_processing():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    # Authenticate user to get access token
    login_payload = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }

    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert "access_token" in login_data, "No access_token in login response"
    access_token = login_data["access_token"]
    session.headers.update({"Authorization": f"Bearer {access_token}"})

    # Step 1: Retrieve available subscription plans
    plans_resp = session.get(
        f"{BASE_URL}/api/subscription/plans",
        timeout=TIMEOUT
    )
    assert plans_resp.status_code == 200, f"Failed to get subscription plans: {plans_resp.text}"
    plans_data = plans_resp.json()
    assert isinstance(plans_data, list) and len(plans_data) > 0, "No subscription plans found"

    # Select a plan to subscribe (prefer 'Pro', fallback to first plan)
    selected_plan = next((p for p in plans_data if p.get("tier") == "Pro"), plans_data[0])
    plan_id = selected_plan.get("id")
    assert plan_id, "Selected plan does not have an ID"

    # Step 2: Initiate subscription plan selection
    select_plan_payload = {"plan_id": plan_id}
    select_plan_resp = session.post(
        f"{BASE_URL}/api/subscription/select-plan",
        json=select_plan_payload,
        timeout=TIMEOUT
    )
    assert select_plan_resp.status_code == 200, f"Plan selection failed: {select_plan_resp.text}"
    select_plan_data = select_plan_resp.json()
    assert select_plan_data.get("success") is True, "Plan selection response unsuccessful"

    # Step 3: Simulate payment processing via Toss Payments
    payment_init_resp = session.post(
        f"{BASE_URL}/api/payment/toss/initiate",
        json={"plan_id": plan_id},
        timeout=TIMEOUT
    )
    assert payment_init_resp.status_code == 200, f"Payment initiation failed: {payment_init_resp.text}"
    payment_init_data = payment_init_resp.json()
    assert "payment_id" in payment_init_data, "Payment initiation missing payment_id"

    payment_id = payment_init_data["payment_id"]

    # Step 4: Simulate payment confirmation callback (normally from Toss Payments webhook)
    payment_confirm_payload = {
        "payment_id": payment_id,
        "status": "SUCCESS",
        "transaction_id": str(uuid.uuid4())
    }
    payment_confirm_resp = session.post(
        f"{BASE_URL}/api/payment/toss/confirm",
        json=payment_confirm_payload,
        timeout=TIMEOUT
    )
    assert payment_confirm_resp.status_code == 200, f"Payment confirmation failed: {payment_confirm_resp.text}"
    payment_confirm_data = payment_confirm_resp.json()
    assert payment_confirm_data.get("payment_status") == "SUCCESS", "Payment not successful"

    # Step 5: Verify user subscription status updated immediately
    user_status_resp = session.get(
        f"{BASE_URL}/api/user/subscription-status",
        timeout=TIMEOUT
    )
    assert user_status_resp.status_code == 200, f"Failed to get subscription status: {user_status_resp.text}"
    user_status_data = user_status_resp.json()
    assert user_status_data.get("plan_id") == plan_id, f"User plan not updated to selected plan {plan_id}"

    # Step 6: Verify database records (simulated by fetching subscription record endpoint)
    subscription_record_resp = session.get(
        f"{BASE_URL}/api/subscription/records/{user_status_data.get('user_id')}",
        timeout=TIMEOUT
    )
    assert subscription_record_resp.status_code == 200, f"Failed to get subscription records: {subscription_record_resp.text}"
    subscription_records = subscription_record_resp.json()
    assert any(r["plan_id"] == plan_id and r["payment_status"] == "SUCCESS" for r in subscription_records), \
        "Subscription record with successful payment not found"

    # Clean-up not needed as this is a subscription update test on existing user

test_subscription_plan_management_and_payment_processing()