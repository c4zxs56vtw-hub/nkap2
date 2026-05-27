from rest_framework.permissions import BasePermission

from apps.common.constants import KYCStatus, UserRole


class IsVerifiedUser(BasePermission):
    message = "KYC verification is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not getattr(user, "is_blacklisted", False)
            and getattr(user, "kyc_status", None) == KYCStatus.VERIFIED
        )


class RolePermission(BasePermission):
    allowed_roles: set[str] = set()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not getattr(user, "is_blacklisted", False)
            and getattr(user, "role", None) in self.allowed_roles
        )


class IsSuperAdmin(RolePermission):
    allowed_roles = {UserRole.SUPER_ADMIN}


class IsComplianceAdmin(RolePermission):
    allowed_roles = {UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN}


class IsSecurityAdmin(RolePermission):
    allowed_roles = {UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN}


class IsSupportAdmin(RolePermission):
    allowed_roles = {UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN}


class IsPartnerUser(RolePermission):
    allowed_roles = {UserRole.SUPER_ADMIN, UserRole.PARTNER}
