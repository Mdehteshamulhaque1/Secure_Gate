from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ["email"]
    list_display = ("email", "full_name", "role", "organization", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff", "organization")
    search_fields = ("email", "full_name", "phone")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identity", {"fields": ("full_name", "phone", "avatar")}),
        ("Access", {"fields": ("role", "organization", "is_active", "is_staff", "is_superuser")}),
        ("Security", {"fields": ("failed_login_attempts", "locked_until", "is_email_verified")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "role", "password1", "password2"),
        }),
    )
