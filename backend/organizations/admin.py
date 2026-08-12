from django.contrib import admin

from .models import AuditLog, Building, Department, Employee, Floor, Gate, Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "city", "country", "timezone", "created_at")
    prepopulated_fields = {"slug": ("name",)}


class FloorInline(admin.TabularInline):
    model = Floor
    extra = 1


class GateInline(admin.TabularInline):
    model = Gate
    extra = 1


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "floors", "entry_gates", "exit_gates")
    list_filter = ("organization",)
    inlines = [FloorInline, GateInline]


@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    list_display = ("name", "building", "level")


@admin.register(Gate)
class GateAdmin(admin.ModelAdmin):
    list_display = ("name", "building", "gate_type")
    list_filter = ("gate_type",)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "organization")
    list_filter = ("organization",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "user", "organization", "department", "designation", "status")
    list_filter = ("organization", "department", "status")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "user", "entity_type", "entity_id", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("action", "details", "user__email")
    readonly_fields = [f.name for f in AuditLog._meta.fields]
