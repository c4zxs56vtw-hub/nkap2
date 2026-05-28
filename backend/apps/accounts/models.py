from __future__ import annotations

import uuid

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
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_blacklisted = models.BooleanField(default=False)
    blacklisted_reason = models.TextField(blank=True)
    fraud_flag_count = models.PositiveIntegerField(default=0)
    last_flagged_at = models.DateTimeField(null=True, blank=True)
    qr_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

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


class Tontine(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    pool_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    active_members = models.PositiveIntegerField(default=1)
    progress = models.PositiveIntegerField(default=0)
    icon = models.CharField(max_length=54, default="airplane")
    icon_bg = models.CharField(max_length=20, default="#06b6d41a")
    icon_color = models.CharField(max_length=20, default="#00687a")
    treasurer_name = models.CharField(max_length=255, blank=True)
    member_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name="tontines")

    def __str__(self) -> str:
        return self.title


class Message(models.Model):
    MESSAGE_TYPES = (
        ("text", "Text"),
        ("system", "System"),
        ("image", "Image"),
    )
    
    tontine = models.ForeignKey(Tontine, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages", null=True, blank=True)
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default="text")
    image = models.ImageField(upload_to="chat_images/", null=True, blank=True)
    external_image_url = models.URLField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        sender_name = self.sender.get_full_name() if self.sender else "System"
        return f"{sender_name}: {self.content[:30]}"


class Transaction(models.Model):
    STATUS_CHOICES = (
        ("completed", "Completed"),
        ("pending", "Pending"),
        ("failed", "Failed"),
    )
    DIRECTION_CHOICES = (
        ("in", "Incoming"),
        ("out", "Outgoing"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    label = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    direction = models.CharField(max_length=3, choices=DIRECTION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="completed")
    method = models.CharField(max_length=100, blank=True)
    icon = models.CharField(max_length=54, default="cash")
    icon_bg = models.CharField(max_length=20, default="#eff4f7")
    icon_color = models.CharField(max_length=20, default="#00687a")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.amount >= 0:
            self.direction = "in"
        else:
            self.direction = "out"
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.label}: {self.amount}"


