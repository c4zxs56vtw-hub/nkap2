from __future__ import annotations

from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.serializers import LoginSerializer, LogoutSerializer, RegisterSerializer, UserSerializer
from apps.common.constants import KYCStatus


class RegisterAPIView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "status": user.kyc_status,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class MeAPIView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class NKAPTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]


class SubmitKYCAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        user = request.user
        full_name = request.data.get("full_name")
        mobile_money_number = request.data.get("mobile_money_number")
        identity_document = request.FILES.get("identity_document")

        if full_name:
            parts = full_name.strip().split(' ', 1)
            if len(parts) == 2:
                user.first_name, user.last_name = parts
            else:
                user.first_name = parts[0]
                user.last_name = ""

        if mobile_money_number:
            user.mobile_money_number = mobile_money_number

        if identity_document:
            user.identity_document = identity_document

        user.kyc_status = KYCStatus.PENDING
        user.save()

        return Response({
            "status": user.kyc_status,
            "message": "Dossier KYC soumis avec succès."
        }, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
