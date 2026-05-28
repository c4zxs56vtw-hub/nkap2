from __future__ import annotations

from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.serializers import LoginSerializer, LogoutSerializer, RegisterSerializer, UserSerializer, MessageSerializer, TransactionSerializer
from apps.common.constants import KYCStatus
from django.shortcuts import get_object_or_404
from apps.accounts.models import Tontine, Message, User, Transaction
from django.utils import timezone
import datetime


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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UploadAvatarAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'Aucune image fournie.'}, status=status.HTTP_400_BAD_REQUEST)

        # Supprimer l'ancien avatar s'il existe
        user = request.user
        if user.avatar:
            try:
                user.avatar.delete(save=False)
            except Exception:
                pass

        user.avatar = avatar
        user.save(update_fields=['avatar'])

        serializer = UserSerializer(user, context={'request': request})
        return Response({'avatarUrl': serializer.data.get('avatarUrl')}, status=status.HTTP_200_OK)


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


class TontineMessagesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, tontine_id):
        tontine = get_object_or_404(Tontine, id=tontine_id)
        messages = tontine.messages.all().order_by("created_at")
        serializer = MessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, tontine_id):
        tontine = get_object_or_404(Tontine, id=tontine_id)
        content = request.data.get("content", "").strip()
        message_type = request.data.get("type", "text")
        image = request.FILES.get("image")
        external_image_url = request.data.get("external_image_url")

        message = Message.objects.create(
            tontine=tontine,
            sender=request.user,
            content=content,
            message_type=message_type,
            image=image,
            external_image_url=external_image_url
        )

        # Trigger backend chatbot responses
        if message_type == "text" and content:
            self._trigger_bot_response(tontine, content)

        serializer = MessageSerializer(message, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _trigger_bot_response(self, tontine, content):
        text_lower = content.lower()
        
        def get_bot_user(phone):
            try:
                return User.objects.get(phone_number=phone)
            except User.DoesNotExist:
                return None

        if tontine.id == 101:  # Voyage 2024
            sarah = get_bot_user("237690000001")
            marc = get_bot_user("237690000002")

            if any(k in text_lower for k in ["argent", "envoyé", "payé", "momo", "versement"]):
                if sarah:
                    Message.objects.create(
                        tontine=tontine,
                        sender=sarah,
                        content="C’est parfait ! C’est bien reçu et enregistré. Merci pour ton versement rapide ! 👍🏽",
                        message_type="text"
                    )
                Message.objects.create(
                    tontine=tontine,
                    sender=None,
                    content="Versement de 150 000 FCFA validé par le système.",
                    message_type="system"
                )
            elif any(k in text_lower for k in ["voyage", "billet", "avion", "weekend", "vacances", "scolar", "école"]):
                if marc:
                    Message.objects.create(
                        tontine=tontine,
                        sender=marc,
                        content="Carrément ! Moi je regarde déjà les vols de nuit, c’est souvent moins cher et plus pratique.",
                        message_type="text"
                    )
            else:
                if sarah:
                    Message.objects.create(
                        tontine=tontine,
                        sender=sarah,
                        content="Salut ! J’espère que tout se passe bien de ton côté. On avance super bien sur cette tontine ! 🙌",
                        message_type="text"
                    )

        elif tontine.id == 102:  # Épargne Famille
            aminata = get_bot_user("237690000003")
            if any(k in text_lower for k in ["momo", "argent", "cotis", "payé", "versement"]):
                if aminata:
                    Message.objects.create(
                        tontine=tontine,
                        sender=aminata,
                        content="Merci pour le versement ! Je valide dès réception de la notification MoMo.",
                        message_type="text"
                    )

        elif tontine.id == 103:  # Scolarité Septembre
            marie = get_bot_user("237690000005")
            if any(k in text_lower for k in ["frais", "scolarité", "rentrée", "payé"]):
                if marie:
                    Message.objects.create(
                        tontine=tontine,
                        sender=marie,
                        content="Merci de veiller à ce que tout soit réglé avant le 15, c'est crucial pour l'école.",
                        message_type="text"
                    )


class TontineMessagesSimulateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, tontine_id):
        tontine = get_object_or_404(Tontine, id=tontine_id)
        sim_type = request.data.get("type")
        
        def get_bot_user(phone):
            try:
                return User.objects.get(phone_number=phone)
            except User.DoesNotExist:
                return None

        sarah = get_bot_user("237690000001")
        marc = get_bot_user("237690000002")

        if sim_type == "system_payment":
            msg = Message.objects.create(
                tontine=tontine,
                sender=None,
                content="Versement de 150 000 FCFA validé par le système.",
                message_type="system"
            )
        elif sim_type == "sarah_image":
            msg = Message.objects.create(
                tontine=tontine,
                sender=sarah,
                content="",
                message_type="image",
                external_image_url="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            )
        elif sim_type == "marc_message":
            msg = Message.objects.create(
                tontine=tontine,
                sender=marc,
                content="Confirmé pour ma part ! Je participe bien au prochain tour. On se tient au courant pour les billets. ✈️",
                message_type="text"
            )
        elif sim_type == "admin_broadcast":
            msg = Message.objects.create(
                tontine=tontine,
                sender=None,
                content="📢 Message officiel : Une maintenance programmée de la plateforme aura lieu ce dimanche à 22h. Les transactions de tontines resteront sécurisées.",
                message_type="text"
            )
        else:
            return Response({"error": "Invalid simulation type"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MessageSerializer(msg, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TransactionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by("-created_at")
        
        # Calcul des totaux sur les 30 derniers jours (transactions validées)
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        recent = transactions.filter(status="completed", created_at__gte=thirty_days_ago)
        
        total_in = sum(float(t.amount) for t in recent if float(t.amount) > 0)
        total_out = sum(abs(float(t.amount)) for t in recent if float(t.amount) < 0)
        
        serializer = TransactionSerializer(transactions, many=True)
        return Response({
            "transactions": serializer.data,
            "totals": {
                "in": total_in,
                "out": total_out,
            }
        }, status=status.HTTP_200_OK)
