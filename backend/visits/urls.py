from django.urls import path

from . import views

app_name = "visits"

urlpatterns = [
    path("", views.visitor_list, name="visitor_list"),
    path("register/", views.visitor_register, name="visitor_register"),
    path("walkin/", views.walkin_register, name="walkin_register"),
    path("approvals/", views.approvals, name="approvals"),
    path("approvals/<int:pk>/<str:action>/", views.approval_action, name="approval_action"),
    path("mine/", views.my_visits, name="my_visits"),
    path("reception/", views.reception, name="reception"),
    path("security/", views.security, name="security"),
    path("security/scan/", views.scan_qr, name="scan_qr"),
    path("security/manual/", views.manual_verify, name="manual_verify"),
    path("blacklist/", views.blacklist_list, name="blacklist"),
    path("blacklist/add/<int:visitor_pk>/", views.blacklist_add, name="blacklist_add"),
    path("blacklist/remove/<int:pk>/", views.blacklist_remove, name="blacklist_remove"),
    path("<int:pk>/", views.visitor_detail, name="visitor_detail"),
    path("<int:pk>/badge/", views.badge, name="badge"),
    path("<int:pk>/checkin/", views.checkin, name="checkin"),
    path("<int:pk>/checkout/", views.checkout, name="checkout"),
]
