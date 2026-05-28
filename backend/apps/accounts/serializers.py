from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User, Tontine, Message, Transaction
from apps.common.utils import normalize_phone_number


class TontineSerializer(serializers.ModelSerializer):
    poolAmount = serializers.SerializerMethodField()
    activeMembers = serializers.IntegerField(source="active_members")
    iconBg = serializers.CharField(source="icon_bg")
    iconColor = serializers.CharField(source="icon_color")
    treasurerName = serializers.CharField(source="treasurer_name")
    memberName = serializers.CharField(source="member_name")

    class Meta:
        model = Tontine
        fields = [
            "id",
            "title",
            "subtitle",
            "poolAmount",
            "activeMembers",
            "progress",
            "icon",
            "iconBg",
            "iconColor",
            "treasurerName",
            "memberName",
        ]

    def get_poolAmount(self, obj) -> str:
        val = int(obj.pool_amount)
        return f"{val:,} FCFA".replace(",", " ")


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    tontines = TontineSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "phone_number",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "country",
            "role",
            "trust_score",
            "kyc_status",
            "kyc_rejection_reason",
            "identity_document",
            "mobile_money_number",
            "balance",
            "is_blacklisted",
            "is_active",
            "blacklisted_reason",
            "fraud_flag_count",
            "last_flagged_at",
            "date_joined",
            "tontines",
        ]
        read_only_fields = [
            "id",
            "username",
            "phone_number",
            "role",
            "trust_score",
            "kyc_status",
            "kyc_rejection_reason",
            "is_blacklisted",
            "is_active",
            "blacklisted_reason",
            "fraud_flag_count",
            "last_flagged_at",
            "date_joined",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=True)
    pin = serializers.CharField(write_only=True, required=True)
    phone_number = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "phone_number",
            "pin",
        ]

    def validate_phone_number(self, value):
        phone_number = normalize_phone_number(value)
        if not phone_number:
            raise serializers.ValidationError("Le numéro de téléphone est requis.")
        if User.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé.")
        return phone_number

    def validate_pin(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("Le code PIN doit comporter exactement 4 chiffres.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        pin = validated_data.pop("pin")
        
        # Séparer le nom complet
        parts = full_name.strip().split(' ', 1)
        if len(parts) == 2:
            first_name, last_name = parts
        else:
            first_name = parts[0]
            last_name = ""
            
        validated_data["first_name"] = first_name
        validated_data["last_name"] = last_name
        
        user = User.objects.create_user(password=pin, **validated_data)
        
        # Associer automatiquement le nouvel utilisateur aux tontines de démo
        try:
            default_tontines = Tontine.objects.filter(id__in=[101, 102, 103])
            for t in default_tontines:
                t.members.add(user)
        except Exception:
            pass

        return user


class LoginSerializer(TokenObtainPairSerializer):
    phone_number = serializers.CharField(required=True)
    pin = serializers.CharField(required=True, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("password", None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["country"] = user.country
        token["kyc_status"] = user.kyc_status
        token["trust_score"] = user.trust_score
        token["is_blacklisted"] = user.is_blacklisted
        return token

    def validate(self, attrs):
        phone_number = normalize_phone_number(attrs.get("phone_number"))
        pin = attrs.get("pin")
        
        attrs[self.username_field] = phone_number
        attrs["password"] = pin
        
        data = super().validate(attrs)
        if self.user.is_blacklisted:
            raise AuthenticationFailed("Ce compte a été mis sur liste noire.")
        
        data["user"] = UserSerializer(self.user).data
        data["token"] = data["access"]
        data["status"] = self.user.kyc_status
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.refresh_token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.refresh_token).blacklist()
        except TokenError as exc:
            raise serializers.ValidationError({"refresh": "Refresh token is invalid or expired."}) from exc


class MessageSerializer(serializers.ModelSerializer):
    senderName = serializers.SerializerMethodField()
    senderRole = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    isMe = serializers.SerializerMethodField()
    type = serializers.CharField(source="message_type")
    imageUrl = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "senderName",
            "senderRole",
            "content",
            "timestamp",
            "isMe",
            "type",
            "imageUrl",
            "status",
        ]

    def get_senderName(self, obj) -> str | None:
        if obj.message_type == "system" or not obj.sender:
            return None
        return obj.sender.get_full_name() or obj.sender.phone_number

    def get_senderRole(self, obj) -> str | None:
        if obj.message_type == "system" or not obj.sender:
            return None
        sender_name = obj.sender.get_full_name()
        if (sender_name and obj.tontine.treasurer_name and sender_name.strip().lower() == obj.tontine.treasurer_name.strip().lower()) or obj.sender.is_staff:
            return "TRÉSORIER"
        return "MEMBRE"

    def get_timestamp(self, obj) -> str:
        from django.utils import timezone
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime("%H:%M")

    def get_isMe(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user and obj.sender:
            return request.user.id == obj.sender.id
        return False

    def get_imageUrl(self, obj) -> str | None:
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.external_image_url

    def get_status(self, obj) -> str:
        return "read"


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    dateLabel = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    iconBg = serializers.CharField(source="icon_bg")
    iconColor = serializers.CharField(source="icon_color")

    class Meta:
        model = Transaction
        fields = [
            "id",
            "label",
            "subtitle",
            "amount",
            "direction",
            "status",
            "dateLabel",
            "time",
            "method",
            "icon",
            "iconBg",
            "iconColor",
        ]

    def get_amount(self, obj) -> float:
        return float(obj.amount)

    def get_dateLabel(self, obj) -> str:
        from django.utils import timezone
        import datetime
        now = timezone.localtime(timezone.now())
        local_created = timezone.localtime(obj.created_at)
        
        diff = now.date() - local_created.date()
        if diff == datetime.timedelta(days=0):
            return "Aujourd'hui"
        elif diff == datetime.timedelta(days=1):
            return "Hier"
        elif diff < datetime.timedelta(days=7):
            return "Cette semaine"
        else:
            return local_created.strftime("%d/%m/%Y")

    def get_time(self, obj) -> str:
        from django.utils import timezone
        import datetime
        now = timezone.localtime(timezone.now())
        local_created = timezone.localtime(obj.created_at)
        
        diff = now.date() - local_created.date()
        if diff <= datetime.timedelta(days=1):
            return local_created.strftime("%H:%M")
        else:
            days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
            day_str = days[local_created.weekday()]
            return f"{day_str}. {local_created.strftime('%H:%M')}"

