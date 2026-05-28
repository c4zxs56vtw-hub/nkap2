from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from apps.accounts.views import LogoutAPIView, MeAPIView, NKAPTokenObtainPairView, RegisterAPIView, SubmitKYCAPIView, TontineMessagesAPIView, TontineMessagesSimulateAPIView, TransactionListAPIView, UploadAvatarAPIView


urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", NKAPTokenObtainPairView.as_view(), name="login"),
    path("submit-kyc/", SubmitKYCAPIView.as_view(), name="submit-kyc"),
    path("token/", NKAPTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("tontines/<int:tontine_id>/messages/", TontineMessagesAPIView.as_view(), name="tontine-messages"),
    path("tontines/<int:tontine_id>/messages/simulate/", TontineMessagesSimulateAPIView.as_view(), name="tontine-messages-simulate"),
    path("transactions/", TransactionListAPIView.as_view(), name="transactions"),
    path("avatar/", UploadAvatarAPIView.as_view(), name="upload-avatar"),
]
