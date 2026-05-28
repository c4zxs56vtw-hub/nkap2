from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.constants import KYCStatus


class AuthEndpointsTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.submit_kyc_url = reverse("submit-kyc")
        
        self.user_data = {
            "full_name": "Test User",
            "phone_number": "+237690000000",
            "pin": "1234"
        }

    def test_registration_and_login_flow(self):
        # 1. Test Registration
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["status"], KYCStatus.PENDING)
        self.assertEqual(response.data["user"]["phone_number"], "237690000000")
        self.assertEqual(response.data["user"]["first_name"], "Test")
        self.assertEqual(response.data["user"]["last_name"], "User")
        
        # Verify default tontines association
        self.assertIn("tontines", response.data["user"])
        self.assertEqual(len(response.data["user"]["tontines"]), 3)
        self.assertEqual(response.data["user"]["tontines"][0]["title"], "Voyage 2024")

        # 2. Test Registration Validation (duplicate phone number)
        response_dup = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Test Login
        login_data = {
            "phone_number": "237690000000",
            "pin": "1234"
        }
        response_login = self.client.post(self.login_url, login_data, format="json")
        self.assertEqual(response_login.status_code, status.HTTP_200_OK)
        self.assertIn("token", response_login.data)
        self.assertIn("status", response_login.data)
        self.assertEqual(response_login.data["status"], KYCStatus.PENDING)

        # Obtain token for authenticated requests
        token = response_login.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 4. Test KYC Submission
        test_file = SimpleUploadedFile("cni.jpg", b"dummy_image_content", content_type="image/jpeg")
        kyc_data = {
            "full_name": "Updated Test User Name",
            "mobile_money_number": "677889900",
            "identity_document": test_file
        }
        response_kyc = self.client.post(self.submit_kyc_url, kyc_data, format="multipart")
        self.assertEqual(response_kyc.status_code, status.HTTP_200_OK)
        self.assertEqual(response_kyc.data["status"], KYCStatus.PENDING)
        
        # Verify the user fields were updated in DB
        user = User.objects.get(phone_number="237690000000")
        self.assertEqual(user.first_name, "Updated")
        self.assertEqual(user.last_name, "Test User Name")
        self.assertEqual(user.mobile_money_number, "677889900")
        self.assertTrue(user.identity_document.name.startswith("kyc_documents/"))

        # 5. Test Messaging System (GET messages)
        messages_url = reverse("tontine-messages", kwargs={"tontine_id": 101})
        response_messages = self.client.get(messages_url)
        self.assertEqual(response_messages.status_code, status.HTTP_200_OK)
        # Verify seeded messages are returned
        self.assertGreaterEqual(len(response_messages.data), 5)
        # Check that the first message has senderName and role matching Sarah
        self.assertEqual(response_messages.data[0]["senderName"], "Sarah Douala")
        self.assertEqual(response_messages.data[0]["senderRole"], "TRÉSORIER")

        # 6. Test sending a message (POST message)
        post_msg_data = {"content": "Hello team!", "type": "text"}
        response_send = self.client.post(messages_url, post_msg_data, format="json")
        self.assertEqual(response_send.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_send.data["content"], "Hello team!")
        self.assertTrue(response_send.data["isMe"])

        # 7. Test chatbot trigger (sending message with momo/argent keyword)
        post_momo_data = {"content": "Je viens de payer par momo", "type": "text"}
        response_momo = self.client.post(messages_url, post_momo_data, format="json")
        self.assertEqual(response_momo.status_code, status.HTTP_201_CREATED)
        
        # Verify that bot responses were created in the DB
        response_messages_after = self.client.get(messages_url)
        # It should contain the user's message, Sarah's response, and the system verification message
        latest_msgs = response_messages_after.data[-2:]
        self.assertEqual(latest_msgs[0]["senderName"], "Sarah Douala")
        self.assertEqual(latest_msgs[0]["content"], "C’est parfait ! C’est bien reçu et enregistré. Merci pour ton versement rapide ! 👍🏽")
        self.assertEqual(latest_msgs[1]["type"], "system")
        self.assertEqual(latest_msgs[1]["content"], "Versement de 150 000 FCFA validé par le système.")

        # 8. Test Simulation endpoint
        sim_url = reverse("tontine-messages-simulate", kwargs={"tontine_id": 101})
        sim_data = {"type": "system_payment"}
        response_sim = self.client.post(sim_url, sim_data, format="json")
        self.assertEqual(response_sim.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_sim.data["type"], "system")
        self.assertEqual(response_sim.data["content"], "Versement de 150 000 FCFA validé par le système.")
