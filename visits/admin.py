from django.contrib import admin

from .models import Blacklist, QRPass, Visit, Visitor


class VisitInline(admin.TabularInline):
    model = Visit
    extra = 0
    readonly_fields = ("visit_id", "status", "registered_at")


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "company", "document_type", "created_at")
    search_fields = ("full_name", "phone", "email", "company")
    inlines = [VisitInline]


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("visit_id", "visitor", "organization", "host", "purpose", "visit_date", "status")
    list_filter = ("status", "visit_date", "organization")
    search_fields = ("visitor__full_name", "visitor__phone", "purpose")
    readonly_fields = ("visit_id", "registered_at")


@admin.register(QRPass)
class QRPassAdmin(admin.ModelAdmin):
    list_display = ("token", "visit", "expires_at", "is_used", "is_valid")
    list_filter = ("is_used",)


@admin.register(Blacklist)
class BlacklistAdmin(admin.ModelAdmin):
    list_display = ("visitor", "reason", "is_active", "added_by", "created_at")
    list_filter = ("reason", "is_active")
