from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User, Tontine
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
        
        return User.objects.create_user(password=pin, **validated_data)


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
