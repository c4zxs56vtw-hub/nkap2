from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm

from apps.accounts.models import User


class UserAdminCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("phone_number", "first_name", "last_name", "country", "role", "email")

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if not user.username:
            user.username = user.phone_number
        if commit:
            user.save()
        return user


class UserAdminChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    model = User
    list_display = (
        "phone_number",
        "first_name",
        "last_name",
        "country",
        "role",
        "kyc_status",
        "balance",
        "trust_score",
        "is_active",
        "is_blacklisted",
    )
    list_filter = (
        "role",
        "country",
        "kyc_status",
        "is_active",
        "is_blacklisted",
    )
    search_fields = (
        "phone_number",
        "username",
        "first_name",
        "last_name",
        "email",
    )
    ordering = ("-date_joined",)
    
    actions = ["approve_kyc", "reject_kyc"]

    @admin.action(description="Approuver le KYC des utilisateurs sélectionnés")
    def approve_kyc(self, request, queryset):
        from apps.common.constants import KYCStatus
        updated = queryset.update(kyc_status=KYCStatus.VERIFIED)
        self.message_user(request, f"Le KYC de {updated} utilisateur(s) a été approuvé.")

    @admin.action(description="Rejeter le KYC des utilisateurs sélectionnés")
    def reject_kyc(self, request, queryset):
        from apps.common.constants import KYCStatus
        updated = queryset.update(kyc_status=KYCStatus.REJECTED)
        self.message_user(request, f"Le KYC de {updated} utilisateur(s) a été rejeté.")

    fieldsets = (
        (None, {"fields": ("username", "phone_number", "password")}),
        (
            "Identity",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "country",
                    "role",
                    "trust_score",
                    "kyc_status",
                    "kyc_rejection_reason",
                    "identity_document",
                    "mobile_money_number",
                    "balance",
                )
            },
        ),
        (
            "Security",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_blacklisted",
                    "blacklisted_reason",
                    "fraud_flag_count",
                    "last_flagged_at",
                )
            },
        ),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "first_name",
                    "last_name",
                    "country",
                    "role",
                    "email",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


from apps.accounts.models import Tontine

@admin.register(Tontine)
class TontineAdmin(admin.ModelAdmin):
    list_display = ("title", "subtitle", "pool_amount", "active_members", "progress")
    search_fields = ("title", "subtitle")
