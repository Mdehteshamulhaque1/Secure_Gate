from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("visitors", views.VisitorViewSet, basename="api-visitors")
router.register("visits", views.VisitViewSet, basename="api-visits")

urlpatterns = [
    path("visits/register/", views.RegisterVisitView.as_view(), name="api-visit-register"),
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="api-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="api-token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="api-token-refresh"),
    path("auth/me/", views.CurrentUserView.as_view(), name="api-me"),
    path("hosts/", views.HostListView.as_view(), name="api-hosts"),
    path("buildings/", views.BuildingListView.as_view(), name="api-buildings"),
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="api-dashboard-summary"),
]
