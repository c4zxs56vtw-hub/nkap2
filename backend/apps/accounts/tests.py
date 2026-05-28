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
