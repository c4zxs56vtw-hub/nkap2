from django.db import models


class CEMACCountry(models.TextChoices):
    CM = "CM", "Cameroon"
    GA = "GA", "Gabon"
    TD = "TD", "Chad"
    CF = "CF", "Central African Republic"
    GQ = "GQ", "Equatorial Guinea"
    CG = "CG", "Republic of the Congo"


class UserRole(models.TextChoices):
    MEMBER = "MEMBER", "Member"
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    COMPLIANCE_ADMIN = "COMPLIANCE_ADMIN", "Compliance Admin"
    SECURITY_ADMIN = "SECURITY_ADMIN", "Security Admin"
    SUPPORT_ADMIN = "SUPPORT_ADMIN", "Support Admin"
    PARTNER = "PARTNER", "Partner"


class KYCStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"


class DocumentType(models.TextChoices):
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    PASSPORT = "PASSPORT", "Passport"


class TontineVisibility(models.TextChoices):
    PUBLIC = "PUBLIC", "Public"
    PRIVATE = "PRIVATE", "Private"


class TontineStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    PAUSED = "PAUSED", "Paused"
    CLOSED = "CLOSED", "Closed"


class MembershipStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    LEFT = "LEFT", "Left"
    COMPLETED = "COMPLETED", "Completed"


class InvitationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class PaymentProvider(models.TextChoices):
    MTN_MOMO = "MTN_MOMO", "MTN MoMo"
    ORANGE_MONEY = "ORANGE_MONEY", "Orange Money"
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"
    FLAGGED = "FLAGGED", "Flagged"
    REFUNDED = "REFUNDED", "Refunded"


class TransactionKind(models.TextChoices):
    CONTRIBUTION = "CONTRIBUTION", "Contribution"
    PAYOUT = "PAYOUT", "Payout"
    COMMISSION = "COMMISSION", "Commission"
    PENALTY = "PENALTY", "Penalty"
    REFUND = "REFUND", "Refund"
    TRANSFER = "TRANSFER", "Transfer"


class RevenueCategory(models.TextChoices):
    COMMISSION = "COMMISSION", "Commission"
    PENALTY = "PENALTY", "Penalty"
    OTHER = "OTHER", "Other"
