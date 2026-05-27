from __future__ import annotations

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.constants import CEMACCountry, KYCStatus, UserRole
from apps.common.utils import normalize_phone_number


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("The phone number must be provided.")

        phone_number = normalize_phone_number(phone_number)
        extra_fields.setdefault("phone_number", phone_number)
        extra_fields.setdefault("username", phone_number)
        extra_fields.setdefault("country", CEMACCountry.CM)
        extra_fields.setdefault("role", UserRole.MEMBER)
        extra_fields.setdefault("kyc_status", KYCStatus.PENDING)

        user = self.model(**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)
        extra_fields.setdefault("trust_score", 100)
        extra_fields.setdefault("kyc_status", KYCStatus.VERIFIED)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    phone_number = models.CharField(max_length=20, unique=True, db_index=True)
    country = models.CharField(
        max_length=2,
        choices=CEMACCountry.choices,
        default=CEMACCountry.CM,
    )
    role = models.CharField(
        max_length=32,
        choices=UserRole.choices,
        default=UserRole.MEMBER,
    )
    trust_score = models.PositiveSmallIntegerField(default=0)
    kyc_status = models.CharField(
        max_length=16,
        choices=KYCStatus.choices,
        default=KYCStatus.PENDING,
    )
    kyc_rejection_reason = models.TextField(blank=True)
    identity_document = models.FileField(upload_to="kyc_documents/", null=True, blank=True)
    mobile_money_number = models.CharField(max_length=20, blank=True)
    is_blacklisted = models.BooleanField(default=False)
    blacklisted_reason = models.TextField(blank=True)
    fraud_flag_count = models.PositiveIntegerField(default=0)
    last_flagged_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS: list[str] = []

    def save(self, *args, **kwargs):
        self.phone_number = normalize_phone_number(self.phone_number)
        if not self.username:
            self.username = self.phone_number
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        full_name = self.get_full_name().strip()
        return full_name or self.phone_number
