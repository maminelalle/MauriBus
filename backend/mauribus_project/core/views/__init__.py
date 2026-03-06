from .auth_views import login_view, logout_view, driver_login_view, driver_logout_view
from .viewsets import (
    AdminViewSet, DriverViewSet, BusViewSet,
    LineViewSet, TripViewSet, PaymentViewSet,
    ReportViewSet, NotificationViewSet, SystemAlertViewSet,
)
from .statistics_views import (
    dashboard_stats, revenue_stats, driver_stats, line_stats,
)
from .driver_views import (
    driver_trip_create, driver_trip_update,
    driver_gps_post, driver_report_create,
    driver_notifications_list, driver_trips_list, driver_payments_list,
    driver_validate_ticket, driver_trip_stops, driver_next_stop,
    driver_register_push_token,
)
from .citizen_views import (
    citizen_register, citizen_login, citizen_logout, citizen_profile,
    citizen_wallet_balance, citizen_wallet_recharge, citizen_wallet_pay,
    citizen_wallet_transactions, citizen_trip_history,
    citizen_lines_list, citizen_buses_live, citizen_notifications,
    citizen_active_trip,
    citizen_get_ticket, citizen_rate_driver, citizen_register_push_token,
    admin_validate_recharge,
)
from .admin_extra_views import (
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
