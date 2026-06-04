from __future__ import annotations

from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.serializers import LoginSerializer, LogoutSerializer, RegisterSerializer, UserSerializer, MessageSerializer, TransactionSerializer, AdminTransactionSerializer, NotificationSerializer, AdminNotificationSerializer, AuditLogSerializer
from apps.common.constants import KYCStatus
from django.shortcuts import get_object_or_404
from apps.accounts.models import Tontine, Message, User, Transaction, Notification, AuditLog, PlatformSetting
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
        response = Response({
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "status": user.kyc_status,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
        
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=30 * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=7 * 24 * 60 * 60,
        )
        return response


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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        # Handle PIN / Password Change
        password = request.data.get("password") or request.data.get("pin")
        if password:
            password = str(password).strip()
            if len(password) < 4:
                return Response({"error": "Le mot de passe / PIN doit faire au moins 4 caractères."}, status=status.HTTP_400_BAD_REQUEST)
            instance.set_password(password)
            instance.save()

        # Handle split full name update
        name = request.data.get("name")
        if name is not None:
            parts = str(name).strip().split(' ', 1)
            if len(parts) == 2:
                instance.first_name = parts[0]
                instance.last_name = parts[1]
            else:
                instance.first_name = parts[0]
                instance.last_name = ""
            instance.save()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


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

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get("token") or response.data.get("access")
            refresh_token = response.data.get("refresh")
            if access_token:
                response.set_cookie(
                    key="access_token",
                    value=str(access_token),
                    httponly=True,
                    samesite="Lax",
                    secure=False,
                    max_age=30 * 60,
                )
            if refresh_token:
                response.set_cookie(
                    key="refresh_token",
                    value=str(refresh_token),
                    httponly=True,
                    samesite="Lax",
                    secure=False,
                    max_age=7 * 24 * 60 * 60,
                )
        return response


class NKAPTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        refresh_token = request.data.get("refresh") or request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Token refresh absent"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            
        res_data = serializer.validated_data
        response = Response(res_data, status=status.HTTP_200_OK)
        
        access = res_data.get("access")
        if access:
            response.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=30 * 60,
            )
            
        new_refresh = res_data.get("refresh")
        if new_refresh:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh,
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=7 * 24 * 60 * 60,
            )
            
        return response


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
        try:
            serializer = LogoutSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        except Exception:
            pass
        
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


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


class IsNkapAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role != "MEMBER"


class AdminUserListAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        users = User.objects.all().exclude(id=request.user.id)
        
        data = []
        for user in users:
            kyc_status = 'NON DÉPOSÉ'
            if user.kyc_status == 'VERIFIED':
                kyc_status = 'VÉRIFIÉ'
            elif user.kyc_status == 'REJECTED':
                kyc_status = 'REFUSÉ'
            elif user.kyc_status in ['PENDING', 'SUBMITTED', 'UNDER_REVIEW']:
                kyc_status = 'EN ATTENTE'
                
            tontines_count = user.tontines.count()
            
            colors = ['#006c49', '#059669', '#10b981', '#34d399', '#047857', '#065f46']
            avatar_color = colors[user.id % len(colors)]
            
            last_msg = "Aucun message d'assistance"
            last_msg_time = ""
            
            # Find the support tontine for this user to get the last support message
            support_tontine = Tontine.objects.filter(title__startswith="Support -", members=user).first()
            if support_tontine:
                msg = support_tontine.messages.order_by('-created_at').first()
                if msg:
                    last_msg = msg.content
                    local_dt = timezone.localtime(msg.created_at)
                    last_msg_time = local_dt.strftime("%H:%M")
                
            data.append({
                "id": str(user.id),
                "name": user.get_full_name() or user.phone_number,
                "avatarColor": avatar_color,
                "kycStatus": kyc_status,
                "rawKycStatus": user.kyc_status,
                "kycRejectionReason": user.kyc_rejection_reason,
                "identityDocument": request.build_absolute_uri(user.identity_document.url) if user.identity_document else "",
                "mobileMoneyNumber": user.mobile_money_number,
                "isBlacklisted": user.is_blacklisted,
                "blacklistedReason": user.blacklisted_reason,
                "isActive": user.is_active,
                "role": user.role,
                "lastMessage": last_msg,
                "lastMessageTime": last_msg_time,
                "unreadCount": 0,
                "phone": user.phone_number,
                "tontinesCount": tontines_count
            })
            
        return Response(data, status=status.HTTP_200_OK)


class AdminStatsAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        total_users = User.objects.count()
        pending_kyc = User.objects.filter(kyc_status__in=['PENDING', 'SUBMITTED', 'UNDER_REVIEW']).count()
        verified_kyc = User.objects.filter(kyc_status='VERIFIED').count()
        
        total_tontines = Tontine.objects.count()
        total_funds = sum(float(u.balance) for u in User.objects.all())
        total_pool = sum(float(t.pool_amount) for t in Tontine.objects.all())
        
        data = {
            "totalUsers": total_users,
            "pendingKyc": pending_kyc,
            "verifiedKyc": verified_kyc,
            "totalTontines": total_tontines,
            "totalFunds": total_funds,
            "totalPool": total_pool
        }
        
        return Response(data, status=status.HTTP_200_OK)


class AdminKycUpdateAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        kyc_status = request.data.get("status")
        reason = request.data.get("reason", "")

        if kyc_status not in ["VERIFIED", "REJECTED", "PENDING", "SUBMITTED", "UNDER_REVIEW"]:
            return Response({"error": "Statut KYC invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.kyc_status = kyc_status
        if kyc_status == "REJECTED":
            user.kyc_rejection_reason = reason
        else:
            user.kyc_rejection_reason = ""
        user.save(update_fields=["kyc_status", "kyc_rejection_reason"])

        # Log this action
        if kyc_status == "VERIFIED":
            AuditLog.objects.create(
                admin=request.user,
                action="KYC_APPROVE",
                details=f"A approuvé le dossier KYC du membre {user.get_full_name() or user.phone_number}."
            )
        elif kyc_status == "REJECTED":
            AuditLog.objects.create(
                admin=request.user,
                action="KYC_REJECT",
                details=f"A rejeté le dossier KYC du membre {user.get_full_name() or user.phone_number} (Raison : {reason})."
            )
        else:
            AuditLog.objects.create(
                admin=request.user,
                action="KYC_UPDATE",
                details=f"A modifié le statut KYC du membre {user.get_full_name() or user.phone_number} en '{kyc_status}'."
            )

        return Response({
            "message": "Statut KYC mis à jour avec succès.",
            "user": {
                "id": str(user.id),
                "kycStatus": user.kyc_status,
                "kycRejectionReason": user.kyc_rejection_reason
            }
        }, status=status.HTTP_200_OK)


class AdminUserLockAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        is_blacklisted = request.data.get("is_blacklisted")
        reason = request.data.get("reason", "")

        if is_blacklisted is None:
            return Response({"error": "Le paramètre is_blacklisted est requis."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_blacklisted = bool(is_blacklisted)
        if user.is_blacklisted:
            user.blacklisted_reason = reason
        else:
            user.blacklisted_reason = ""
        user.save(update_fields=["is_blacklisted", "blacklisted_reason"])

        # Log this action
        if user.is_blacklisted:
            AuditLog.objects.create(
                admin=request.user,
                action="USER_LOCK",
                details=f"A banni (mis sur liste noire) l'utilisateur {user.get_full_name() or user.phone_number} (Raison : {reason})."
            )
        else:
            AuditLog.objects.create(
                admin=request.user,
                action="USER_UNLOCK",
                details=f"A réhabilité/débloqué l'utilisateur {user.get_full_name() or user.phone_number}."
            )

        return Response({
            "message": "Statut de blocage de l'utilisateur mis à jour.",
            "user": {
                "id": str(user.id),
                "is_blacklisted": user.is_blacklisted,
                "blacklistedReason": user.blacklisted_reason
            }
        }, status=status.HTTP_200_OK)


def get_or_create_support_tontine(user):
    tontine = Tontine.objects.filter(title__startswith="Support -", members=user).first()
    if not tontine:
        tontine = Tontine.objects.create(
            title=f"Support - {user.get_full_name() or user.phone_number}",
            subtitle="Assistance en direct",
            pool_amount=0,
            active_members=2,
            progress=0,
            icon="chat",
        )
        tontine.members.add(user)
        admins = User.objects.exclude(role="MEMBER")
        if admins.exists():
            tontine.members.add(*admins)
    return tontine

class AdminSupportMessagesAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        tontine = get_or_create_support_tontine(user)
        if request.user not in tontine.members.all():
            tontine.members.add(request.user)

        messages = tontine.messages.all().order_by("created_at")
        serializer = MessageSerializer(messages, many=True, context={"request": request})
        return Response({
            "tontine_id": tontine.id,
            "messages": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        content = request.data.get("content", "").strip()
        if not content:
            return Response({"error": "Le contenu du message ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

        tontine = get_or_create_support_tontine(user)
        if request.user not in tontine.members.all():
            tontine.members.add(request.user)

        message = Message.objects.create(
            tontine=tontine,
            sender=request.user,
            content=content,
            message_type="text"
        )

        serializer = MessageSerializer(message, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminUserSuspendAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        is_active = request.data.get("is_active")

        if is_active is None:
            return Response({"error": "Le paramètre is_active est requis."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = bool(is_active)
        user.save(update_fields=["is_active"])

        # Log this action
        if user.is_active:
            AuditLog.objects.create(
                admin=request.user,
                action="USER_UNSUSPEND",
                details=f"A réactivé le compte de l'utilisateur {user.get_full_name() or user.phone_number}."
            )
        else:
            AuditLog.objects.create(
                admin=request.user,
                action="USER_SUSPEND",
                details=f"A suspendu le compte de l'utilisateur {user.get_full_name() or user.phone_number}."
            )

        status_text = "activé" if user.is_active else "suspendu"
        return Response({
            "message": f"Utilisateur {status_text} avec succès.",
            "user": {
                "id": str(user.id),
                "is_active": user.is_active
            }
        }, status=status.HTTP_200_OK)


from apps.common.utils import normalize_phone_number
from apps.common.constants import UserRole

class AdminCreateAdminAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def post(self, request):
        phone_number = request.data.get("phone_number")
        full_name = request.data.get("full_name")
        pin = request.data.get("pin")
        role = request.data.get("role", UserRole.SUPER_ADMIN)
        email = request.data.get("email", "")

        if not phone_number or not full_name or not pin:
            return Response({"error": "Le numéro de téléphone, le nom complet et le code PIN sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate PIN
        if not str(pin).isdigit() or len(str(pin)) != 4:
            return Response({"error": "Le code PIN doit comporter exactement 4 chiffres."}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize phone
        phone_number = normalize_phone_number(phone_number)
        if not phone_number:
            return Response({"error": "Le numéro de téléphone est invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(phone_number=phone_number).exists():
            return Response({"error": "Ce numéro de téléphone est déjà associé à un compte."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate role
        if role not in [UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SECURITY_ADMIN, UserRole.SUPPORT_ADMIN]:
            return Response({"error": "Rôle d'administrateur invalide."}, status=status.HTTP_400_BAD_REQUEST)

        # Split name
        parts = full_name.strip().split(' ', 1)
        if len(parts) == 2:
            first_name, last_name = parts
        else:
            first_name = parts[0]
            last_name = ""

        # Create user
        user = User.objects.create_user(
            phone_number=phone_number,
            username=phone_number,
            password=pin,
            first_name=first_name,
            last_name=last_name,
            role=role,
            email=email,
            kyc_status="VERIFIED"
        )

        AuditLog.objects.create(
            admin=request.user,
            action="ADMIN_CREATE",
            details=f"A créé un nouvel administrateur {user.get_full_name() or user.phone_number} (Rôle: {user.role})."
        )

        return Response({
            "message": "Nouvel administrateur créé avec succès.",
            "user": {
                "id": str(user.id),
                "phone": user.phone_number,
                "name": user.get_full_name(),
                "role": user.role,
                "email": user.email
            }
        }, status=status.HTTP_201_CREATED)


class AdminTontineListCreateAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        tontines = Tontine.objects.all().order_by("-created_at")
        
        data = []
        for t in tontines:
            data.append({
                "id": t.id,
                "title": t.title,
                "subtitle": t.subtitle,
                "poolAmount": float(t.pool_amount),
                "activeMembers": t.active_members,
                "progress": t.progress,
                "icon": t.icon,
                "iconBg": t.icon_bg,
                "iconColor": t.icon_color,
                "treasurerName": t.treasurer_name,
                "memberName": t.member_name,
                "created_at": t.created_at.strftime("%d/%m/%Y"),
                "members": [
                    {
                        "id": str(u.id),
                        "name": u.get_full_name() or u.phone_number,
                        "phone": u.phone_number
                    }
                    for u in t.members.all()
                ]
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get("title")
        subtitle = request.data.get("subtitle", "")
        pool_amount = request.data.get("pool_amount", 0)
        progress = request.data.get("progress", 0)
        icon = request.data.get("icon", "airplane")
        treasurer_name = request.data.get("treasurer_name", "")
        member_name = request.data.get("member_name", "")
        member_ids = request.data.get("members", [])

        if not title:
            return Response({"error": "Le titre de la tontine est requis."}, status=status.HTTP_400_BAD_REQUEST)

        icon_bg = request.data.get("icon_bg", "#006c491a")
        icon_color = request.data.get("icon_color", "#006c49")

        tontine = Tontine.objects.create(
            title=title,
            subtitle=subtitle,
            pool_amount=float(pool_amount),
            active_members=0,
            progress=int(progress),
            icon=icon,
            icon_bg=icon_bg,
            icon_color=icon_color,
            treasurer_name=treasurer_name,
            member_name=member_name
        )

        if member_ids:
            users = User.objects.filter(id__in=member_ids)
            tontine.members.add(*users)
            tontine.active_members = tontine.members.count()
            tontine.save()

        AuditLog.objects.create(
            admin=request.user,
            action="TONTINE_CREATE",
            details=f"A créé la tontine \"{tontine.title}\" (Montant: {int(tontine.pool_amount):,} FCFA).".replace(",", " ")
        )

        return Response({
            "message": "Tontine créée avec succès.",
            "id": tontine.id
        }, status=status.HTTP_201_CREATED)


class AdminTontineDetailAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def put(self, request, tontine_id):
        tontine = get_object_or_404(Tontine, id=tontine_id)
        
        title = request.data.get("title")
        subtitle = request.data.get("subtitle")
        pool_amount = request.data.get("pool_amount")
        progress = request.data.get("progress")
        icon = request.data.get("icon")
        treasurer_name = request.data.get("treasurer_name")
        member_name = request.data.get("member_name")
        member_ids = request.data.get("members")

        if title is not None:
            tontine.title = title
        if subtitle is not None:
            tontine.subtitle = subtitle
        if pool_amount is not None:
            tontine.pool_amount = float(pool_amount)
        if progress is not None:
            tontine.progress = int(progress)
        if icon is not None:
            tontine.icon = icon
        if treasurer_name is not None:
            tontine.treasurer_name = treasurer_name
        if member_name is not None:
            tontine.member_name = member_name

        if member_ids is not None:
            tontine.members.clear()
            users = User.objects.filter(id__in=member_ids)
            tontine.members.add(*users)
            tontine.active_members = tontine.members.count()

        tontine.save()

        AuditLog.objects.create(
            admin=request.user,
            action="TONTINE_UPDATE",
            details=f"A mis à jour les détails de la tontine \"{tontine.title}\"."
        )

        return Response({
            "message": "Tontine mise à jour avec succès.",
            "id": tontine.id
        }, status=status.HTTP_200_OK)

    def delete(self, request, tontine_id):
        tontine = get_object_or_404(Tontine, id=tontine_id)
        tontine_title = tontine.title
        tontine.delete()

        AuditLog.objects.create(
            admin=request.user,
            action="TONTINE_DELETE",
            details=f"A supprimé la tontine \"{tontine_title}\" (ID: {tontine_id})."
        )

        return Response({"message": "Tontine supprimée avec succès."}, status=status.HTTP_200_OK)


class UserSupportMessagesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tontine = get_or_create_support_tontine(user)

        messages = tontine.messages.all().order_by("created_at")
        serializer = MessageSerializer(messages, many=True, context={"request": request})
        return Response({
            "tontine_id": tontine.id,
            "messages": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        content = request.data.get("content", "").strip()
        if not content:
            return Response({"error": "Le contenu du message ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

        tontine = get_or_create_support_tontine(user)

        message = Message.objects.create(
            tontine=tontine,
            sender=user,
            content=content,
            message_type="text"
        )

        serializer = MessageSerializer(message, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminTransactionListAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        transactions = Transaction.objects.all().order_by("-created_at")
        
        # Calculate stats for the admin
        total_volume = sum(abs(float(t.amount)) for t in transactions)
        total_deposits = sum(float(t.amount) for t in transactions if float(t.amount) > 0 and t.status == 'completed')
        total_withdrawals = sum(abs(float(t.amount)) for t in transactions if float(t.amount) < 0 and t.status == 'completed')
        pending_count = transactions.filter(status='pending').count()
        
        serializer = AdminTransactionSerializer(transactions, many=True)
        
        return Response({
            "transactions": serializer.data,
            "stats": {
                "totalVolume": total_volume,
                "totalDeposits": total_deposits,
                "totalWithdrawals": total_withdrawals,
                "pendingCount": pending_count,
            }
        }, status=status.HTTP_200_OK)


class AdminTransactionStatusUpdateAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def post(self, request, transaction_id):
        transaction = get_object_or_404(Transaction, id=transaction_id)
        new_status = request.data.get("status")
        if new_status not in ["completed", "failed", "pending"]:
            return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = transaction.status
        if old_status == new_status:
            return Response({"message": "Statut inchangé."}, status=status.HTTP_200_OK)
        
        user = transaction.user
        amount = transaction.amount
        
        # Adjust user's balance based on transitions
        # Transition 1: From completed to something else (failed/pending) -> Revert the balance change
        if old_status == "completed":
            user.balance -= amount
        
        # Transition 2: From something else to completed -> Apply the balance change
        if new_status == "completed":
            user.balance += amount
            
        user.save()
        transaction.status = new_status
        transaction.save()

        AuditLog.objects.create(
            admin=request.user,
            action="TRANSACTION_STATUS_UPDATE",
            details=f"A modifié le statut de la transaction {transaction.label} (ID: {transaction.id}, Utilisateur: {user.get_full_name() or user.phone_number}) de '{old_status}' à '{new_status}'."
        )
        
        return Response({
            "message": f"Statut de la transaction mis à jour en '{new_status}' avec succès.",
            "transaction_id": transaction.id,
            "new_status": transaction.status,
            "new_balance": float(user.balance)
        }, status=status.HTTP_200_OK)


class UserNotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        # Fetch both targeted notifications and broadcast (user=None) notifications
        notifications = Notification.objects.filter(
            Q(user=request.user) | Q(user__isnull=True)
        ).order_by("-created_at")
        
        serializer = NotificationSerializer(notifications, many=True)
        unread_count = notifications.filter(is_read=False).count()
        
        return Response({
            "notifications": serializer.data,
            "unreadCount": unread_count
        }, status=status.HTTP_200_OK)


class UserNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, id=pk)
        # Check permissions: can only mark as read if it is targeted to them or is a broadcast message
        if notification.user and notification.user != request.user:
            return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
            
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marquée comme lue."}, status=status.HTTP_200_OK)


class AdminNotificationListCreateAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        notifications = Notification.objects.all().order_by("-created_at")
        serializer = AdminNotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get("title", "").strip()
        content = request.data.get("content", "").strip()
        user_id = request.data.get("userId")  # ID of a specific user or 'all' / None
        
        if not title or not content:
            return Response({"error": "Le titre et le contenu ne peuvent pas être vides."}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user = None
        if user_id and user_id != "all":
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
                
        notification = Notification.objects.create(
            user=target_user,
            title=title,
            content=content
        )

        AuditLog.objects.create(
            admin=request.user,
            action="NOTIFICATION_SEND",
            details=f"A envoyé une notification '{title}' à {target_user.get_full_name() or target_user.phone_number if target_user else 'tous les utilisateurs (diffusion)'}."
        )
        
        serializer = AdminNotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminAuditLogListAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        logs = AuditLog.objects.all().order_by("-created_at")
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDetail360APIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        
        # 1. Personal info
        personal_info = {
            "id": str(user.id),
            "name": user.get_full_name() or user.phone_number,
            "phone": user.phone_number,
            "email": user.email,
            "country": user.country,
            "role": user.role,
            "date_joined": user.date_joined.strftime("%d/%m/%Y"),
            "trust_score": user.trust_score,
            "balance": float(user.balance),
            "kyc_status": user.kyc_status,
            "kyc_rejection_reason": user.kyc_rejection_reason,
            "identity_document": request.build_absolute_uri(user.identity_document.url) if user.identity_document else "",
            "mobile_money_number": user.mobile_money_number,
            "is_blacklisted": user.is_blacklisted,
            "blacklisted_reason": user.blacklisted_reason,
            "is_active": user.is_active,
        }

        # 2. Transactions
        transactions_qs = user.transactions.all().order_by("-created_at")
        transactions_data = []
        for t in transactions_qs:
            transactions_data.append({
                "id": t.id,
                "label": t.label,
                "subtitle": t.subtitle,
                "amount": float(t.amount),
                "direction": t.direction,
                "status": t.status,
                "method": t.method,
                "created_at": t.created_at.strftime("%d/%m/%Y %H:%M"),
            })

        # 3. Tontines
        tontines_qs = user.tontines.all().order_by("-created_at")
        tontines_data = []
        for t in tontines_qs:
            tontines_data.append({
                "id": t.id,
                "title": t.title,
                "subtitle": t.subtitle,
                "pool_amount": float(t.pool_amount),
                "progress": t.progress,
                "icon": t.icon,
                "icon_bg": t.icon_bg,
                "icon_color": t.icon_color,
                "treasurer_name": t.treasurer_name,
            })

        # 4. Support Messages
        support_messages = []
        support_tontine = Tontine.objects.filter(title__startswith="Support -", members=user).first()
        if support_tontine:
            msgs = support_tontine.messages.all().order_by("created_at")
            for m in msgs:
                sender_name = m.sender.get_full_name() or m.sender.phone_number if m.sender else "Système"
                sender_role = m.sender.role if m.sender else "SYSTEM"
                is_from_user = m.sender == user
                support_messages.append({
                    "id": m.id,
                    "content": m.content,
                    "sender_name": sender_name,
                    "sender_role": sender_role,
                    "message_type": m.message_type,
                    "created_at": m.created_at.strftime("%d/%m/%Y %H:%M"),
                    "is_from_user": is_from_user,
                })

        return Response({
            "personal_info": personal_info,
            "transactions": transactions_data,
            "tontines": tontines_data,
            "support_messages": support_messages
        }, status=status.HTTP_200_OK)


class AdminPlatformSettingAPIView(APIView):
    permission_classes = [IsNkapAdmin]

    def get(self, request):
        setting, _ = PlatformSetting.objects.get_or_create(id=1)
        data = {
            "transaction_fee_percent": float(setting.transaction_fee_percent),
            "tontine_fee_percent": float(setting.tontine_fee_percent),
            "min_transaction_amount": float(setting.min_transaction_amount),
            "max_transaction_amount": float(setting.max_transaction_amount),
            "is_maintenance_mode": setting.is_maintenance_mode,
            "maintenance_message": setting.maintenance_message,
        }
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        setting, _ = PlatformSetting.objects.get_or_create(id=1)
        
        # Get data
        trans_fee = request.data.get("transaction_fee_percent")
        tontine_fee = request.data.get("tontine_fee_percent")
        min_amount = request.data.get("min_transaction_amount")
        max_amount = request.data.get("max_transaction_amount")
        is_maint = request.data.get("is_maintenance_mode")
        maint_msg = request.data.get("maintenance_message")

        if trans_fee is not None:
            setting.transaction_fee_percent = float(trans_fee)
        if tontine_fee is not None:
            setting.tontine_fee_percent = float(tontine_fee)
        if min_amount is not None:
            setting.min_transaction_amount = float(min_amount)
        if max_amount is not None:
            setting.max_transaction_amount = float(max_amount)
        if is_maint is not None:
            setting.is_maintenance_mode = bool(is_maint)
        if maint_msg is not None:
            setting.maintenance_message = str(maint_msg).strip()

        setting.save()

        # Log to Audit Log!
        AuditLog.objects.create(
            admin=request.user,
            action="PLATFORM_SETTINGS_UPDATE",
            details=f"A mis à jour les paramètres de la plateforme. Frais transac: {setting.transaction_fee_percent}%, Frais tontine: {setting.tontine_fee_percent}%, Limites: {int(setting.min_transaction_amount)} - {int(setting.max_transaction_amount)} FCFA. Maintenance: {'Actif' if setting.is_maintenance_mode else 'Inactif'}."
        )

        return Response({
            "message": "Paramètres de la plateforme mis à jour avec succès.",
            "settings": {
                "transaction_fee_percent": float(setting.transaction_fee_percent),
                "tontine_fee_percent": float(setting.tontine_fee_percent),
                "min_transaction_amount": float(setting.min_transaction_amount),
                "max_transaction_amount": float(setting.max_transaction_amount),
                "is_maintenance_mode": setting.is_maintenance_mode,
                "maintenance_message": setting.maintenance_message,
            }
        }, status=status.HTTP_200_OK)


class PublicPlatformSettingAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        setting, _ = PlatformSetting.objects.get_or_create(id=1)
        data = {
            "is_maintenance_mode": setting.is_maintenance_mode,
            "maintenance_message": setting.maintenance_message,
        }
        return Response(data, status=status.HTTP_200_OK)




