from django.urls import path

from . import views

app_name = "reports"

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("reports/", views.reports, name="reports"),
    path("audit/", views.audit_log, name="audit_log"),
    path("inside/", views.inside_now, name="inside_now"),
    path("chatbot/", views.chatbot, name="chatbot"),
]
