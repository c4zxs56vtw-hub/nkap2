from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from nkap.views import health_check
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.accounts.views import (
    AdminUserListAPIView,
    AdminStatsAPIView,
    AdminKycUpdateAPIView,
    AdminUserLockAPIView,
    AdminSupportMessagesAPIView,
    AdminUserSuspendAPIView,
    AdminCreateAdminAPIView,
    AdminTontineListCreateAPIView,
    AdminTontineDetailAPIView,
    AdminTransactionListAPIView,
    AdminTransactionStatusUpdateAPIView,
    AdminNotificationListCreateAPIView,
    AdminAuditLogListAPIView,
    AdminUserDetail360APIView,
    AdminPlatformSettingAPIView,
    PublicPlatformSettingAPIView
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("apps.accounts.urls")),
    
    # Admin Stats
    path("api/admin/stats", AdminStatsAPIView.as_view(), name="admin-stats"),
    path("api/admin/stats/", AdminStatsAPIView.as_view(), name="admin-stats-slash"),
    
    # Admin Users Management
    path("api/admin/users", AdminUserListAPIView.as_view(), name="admin-users"),
    path("api/admin/users/", AdminUserListAPIView.as_view(), name="admin-users-slash"),
    path("api/admin/users/<int:user_id>/360", AdminUserDetail360APIView.as_view(), name="admin-user-360"),
    path("api/admin/users/<int:user_id>/360/", AdminUserDetail360APIView.as_view(), name="admin-user-360-slash"),
    
    # Admin KYC Action
    path("api/admin/users/<int:user_id>/kyc", AdminKycUpdateAPIView.as_view(), name="admin-user-kyc"),
    path("api/admin/users/<int:user_id>/kyc/", AdminKycUpdateAPIView.as_view(), name="admin-user-kyc-slash"),
    
    # Admin Lock Action
    path("api/admin/users/<int:user_id>/lock", AdminUserLockAPIView.as_view(), name="admin-user-lock"),
    path("api/admin/users/<int:user_id>/lock/", AdminUserLockAPIView.as_view(), name="admin-user-lock-slash"),
    
    # Admin Suspend Action
    path("api/admin/users/<int:user_id>/suspend", AdminUserSuspendAPIView.as_view(), name="admin-user-suspend"),
    path("api/admin/users/<int:user_id>/suspend/", AdminUserSuspendAPIView.as_view(), name="admin-user-suspend-slash"),
    
    # Admin Create Admin
    path("api/admin/create-admin", AdminCreateAdminAPIView.as_view(), name="admin-create-admin"),
    path("api/admin/create-admin/", AdminCreateAdminAPIView.as_view(), name="admin-create-admin-slash"),
    
    # Admin Tontines Management
    path("api/admin/tontines", AdminTontineListCreateAPIView.as_view(), name="admin-tontines"),
    path("api/admin/tontines/", AdminTontineListCreateAPIView.as_view(), name="admin-tontines-slash"),
    path("api/admin/tontines/<int:tontine_id>", AdminTontineDetailAPIView.as_view(), name="admin-tontine-detail"),
    path("api/admin/tontines/<int:tontine_id>/", AdminTontineDetailAPIView.as_view(), name="admin-tontine-detail-slash"),
    
    # Admin Support Chat
    path("api/admin/users/<int:user_id>/support", AdminSupportMessagesAPIView.as_view(), name="admin-user-support"),
    path("api/admin/users/<int:user_id>/support/", AdminSupportMessagesAPIView.as_view(), name="admin-user-support-slash"),
    
    # Admin Transactions Audit
    path("api/admin/transactions", AdminTransactionListAPIView.as_view(), name="admin-transactions"),
    path("api/admin/transactions/", AdminTransactionListAPIView.as_view(), name="admin-transactions-slash"),
    path("api/admin/transactions/<int:transaction_id>/status", AdminTransactionStatusUpdateAPIView.as_view(), name="admin-transaction-status"),
    path("api/admin/transactions/<int:transaction_id>/status/", AdminTransactionStatusUpdateAPIView.as_view(), name="admin-transaction-status-slash"),
    
    # Admin Notifications Management
    path("api/admin/notifications", AdminNotificationListCreateAPIView.as_view(), name="admin-notifications"),
    path("api/admin/notifications/", AdminNotificationListCreateAPIView.as_view(), name="admin-notifications-slash"),
    
    # Admin Audit Logs
    path("api/admin/audit-logs", AdminAuditLogListAPIView.as_view(), name="admin-audit-logs"),
    path("api/admin/audit-logs/", AdminAuditLogListAPIView.as_view(), name="admin-audit-logs-slash"),
    
    # OpenAPI Schema & Swagger docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    
    # Platform Settings config
    path("api/admin/settings", AdminPlatformSettingAPIView.as_view(), name="admin-settings-config"),
    path("api/admin/settings/", AdminPlatformSettingAPIView.as_view(), name="admin-settings-config-slash"),
    path("api/settings/public", PublicPlatformSettingAPIView.as_view(), name="public-settings"),
    path("api/settings/public/", PublicPlatformSettingAPIView.as_view(), name="public-settings-slash"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
