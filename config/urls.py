from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("accounts.urls")),
    path("", include("reports.urls")),
    path("visitors/", include("visits.urls")),
    path("manage/", include("organizations.urls")),
    path("api/", include("api.urls")),
]
