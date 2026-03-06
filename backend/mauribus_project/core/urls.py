from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    login_view, logout_view, driver_login_view, driver_logout_view,
    AdminViewSet, DriverViewSet, BusViewSet,
    LineViewSet, TripViewSet, PaymentViewSet,
    ReportViewSet, NotificationViewSet, SystemAlertViewSet,
    dashboard_stats, revenue_stats, driver_stats, line_stats,
    driver_trip_create, driver_trip_update,
    driver_gps_post, driver_report_create,
    driver_notifications_list, driver_trips_list, driver_payments_list,
    driver_validate_ticket, driver_trip_stops, driver_next_stop,
    driver_register_push_token,
    citizen_register, citizen_login, citizen_logout, citizen_profile,
    citizen_wallet_balance, citizen_wallet_recharge, citizen_wallet_pay,
    citizen_wallet_transactions, citizen_trip_history,
    citizen_lines_list, citizen_buses_live, citizen_notifications,
    citizen_active_trip,
    citizen_get_ticket, citizen_rate_driver, citizen_register_push_token,
    admin_validate_recharge,
    admin_citizens_list, admin_citizen_suspend, admin_citizen_activate,
    admin_wallet_recharges_list,
    admin_driver_wallets_list, admin_driver_pay,
    admin_financial_stats,
    admin_live_map,
    admin_send_notification,
    admin_app_wallet, admin_app_wallet_recharge,
    admin_driver_payments_history,
    admin_system_alerts, admin_system_alert_resolve,
    admin_driver_ratings,
)

router = DefaultRouter()
router.register('admins', AdminViewSet, basename='admin')
router.register('drivers', DriverViewSet, basename='driver')
router.register('buses', BusViewSet, basename='bus')
router.register('lines', LineViewSet, basename='line')
router.register('trips', TripViewSet, basename='trip')
router.register('payments', PaymentViewSet, basename='payment')
router.register('reports', ReportViewSet, basename='report')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('alerts', SystemAlertViewSet, basename='alert')

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('driver-login/', driver_login_view, name='driver-login'),
    path('driver-logout/', driver_logout_view, name='driver-logout'),
    path('statistics/dashboard/', dashboard_stats, name='stats-dashboard'),
    path('statistics/revenue/', revenue_stats, name='stats-revenue'),
    path('statistics/drivers/', driver_stats, name='stats-drivers'),
    path('statistics/lines/', line_stats, name='stats-lines'),
    # Driver app endpoints (authenticated via DriverJWT)
    path('driver/trips/', driver_trips_list, name='driver-trips-list'),
    path('driver/trips/create/', driver_trip_create, name='driver-trip-create'),
    path('driver/trips/<uuid:pk>/update/', driver_trip_update, name='driver-trip-update'),
    path('driver/gps/', driver_gps_post, name='driver-gps'),
    path('driver/reports/', driver_report_create, name='driver-report-create'),
    path('driver/notifications/', driver_notifications_list, name='driver-notifications'),
    path('driver/payments/', driver_payments_list, name='driver-payments'),
    # Citizen app endpoints
    path('citizen/register/', citizen_register, name='citizen-register'),
    path('citizen/login/', citizen_login, name='citizen-login'),
    path('citizen/logout/', citizen_logout, name='citizen-logout'),
    path('citizen/profile/', citizen_profile, name='citizen-profile'),
    path('citizen/wallet/', citizen_wallet_balance, name='citizen-wallet'),
    path('citizen/wallet/recharge/', citizen_wallet_recharge, name='citizen-wallet-recharge'),
    path('citizen/wallet/pay/', citizen_wallet_pay, name='citizen-wallet-pay'),
    path('citizen/wallet/transactions/', citizen_wallet_transactions, name='citizen-wallet-transactions'),
    path('citizen/history/', citizen_trip_history, name='citizen-history'),
    path('citizen/lines/', citizen_lines_list, name='citizen-lines'),
    path('citizen/buses/live/', citizen_buses_live, name='citizen-buses-live'),
    path('citizen/notifications/', citizen_notifications, name='citizen-notifications'),
    path('citizen/active-trip/', citizen_active_trip, name='citizen-active-trip'),
    path('admin/wallet/validate/<uuid:pk>/', admin_validate_recharge, name='admin-validate-recharge'),
    # Admin extra endpoints
    path('admin/citizens/', admin_citizens_list, name='admin-citizens'),
    path('admin/citizens/<uuid:pk>/suspend/', admin_citizen_suspend, name='admin-citizen-suspend'),
    path('admin/citizens/<uuid:pk>/activate/', admin_citizen_activate, name='admin-citizen-activate'),
    path('admin/wallet/recharges/', admin_wallet_recharges_list, name='admin-wallet-recharges'),
    path('admin/drivers/wallets/', admin_driver_wallets_list, name='admin-driver-wallets'),
    path('admin/drivers/<uuid:pk>/pay/', admin_driver_pay, name='admin-driver-pay'),
    path('admin/financial/stats/', admin_financial_stats, name='admin-financial-stats'),
    path('admin/live-map/', admin_live_map, name='admin-live-map'),
    path('admin/notifications/send/', admin_send_notification, name='admin-send-notification'),
    path('admin/app-wallet/', admin_app_wallet, name='admin-app-wallet'),
    path('admin/app-wallet/recharge/', admin_app_wallet_recharge, name='admin-app-wallet-recharge'),
    path('admin/driver-payments/history/', admin_driver_payments_history, name='admin-driver-payments-history'),
    path('admin/system-alerts/', admin_system_alerts, name='admin-system-alerts'),
    path('admin/system-alerts/<uuid:pk>/resolve/', admin_system_alert_resolve, name='admin-system-alert-resolve'),
    path('admin/driver-ratings/', admin_driver_ratings, name='admin-driver-ratings'),
    # Driver new endpoints
    path('driver/validate-ticket/', driver_validate_ticket, name='driver-validate-ticket'),
    path('driver/trips/<uuid:pk>/stops/', driver_trip_stops, name='driver-trip-stops'),
    path('driver/trips/<uuid:pk>/next-stop/', driver_next_stop, name='driver-next-stop'),
    path('driver/push-token/', driver_register_push_token, name='driver-push-token'),
    # Citizen new endpoints
    path('citizen/ticket/<uuid:ticket_id>/', citizen_get_ticket, name='citizen-get-ticket'),
    path('citizen/rate-driver/', citizen_rate_driver, name='citizen-rate-driver'),
    path('citizen/push-token/', citizen_register_push_token, name='citizen-push-token'),
    path('', include(router.urls)),
]
