"""
Role-Based Access Control (RBAC).

Roles:
    SUPER_ADMIN   - global control, manages organizations
    ORG_ADMIN     - manages buildings, departments, employees, users
    RECEPTIONIST  - registers visitors, prints badges, runs reception desk
    SECURITY      - scans QR, check-in / check-out, monitors blacklist
    EMPLOYEE      - pre-registers visitors, approves/rejects own requests
    AUDITOR       - read-only: reports, audit logs

Permissions:
    create_visitor   approve_visitor   checkin_visitor   checkout_visitor
    manage_org       manage_buildings  manage_departments manage_employees
    manage_users     view_reports      view_audit_logs    blacklist_visitor
    badge_print      scan_qr
"""

from accounts.models import Role


def permissions_for(role):
    """Permission set for a single role."""
    base_viewer = {"view_dashboard"}
    permissions = set()

    if role == Role.SUPER_ADMIN:
        permissions = {
            "create_visitor", "approve_visitor", "checkin_visitor", "checkout_visitor",
            "manage_org", "manage_buildings", "manage_departments", "manage_employees",
            "manage_users", "view_reports", "view_audit_logs", "blacklist_visitor",
            "badge_print", "scan_qr", "manage_roles", "view_all",
        }
    elif role == Role.ORG_ADMIN:
        permissions = {
            "create_visitor", "approve_visitor", "checkin_visitor", "checkout_visitor",
            "manage_buildings", "manage_departments", "manage_employees",
            "manage_users", "view_reports", "view_audit_logs", "blacklist_visitor",
            "badge_print", "view_all",
        }
    elif role == Role.RECEPTIONIST:
        permissions = {
            "create_visitor", "badge_print", "view_reports", "view_all",
        }
    elif role == Role.SECURITY:
        permissions = {
            "scan_qr", "checkin_visitor", "checkout_visitor", "view_reports", "view_all",
        }
    elif role == Role.EMPLOYEE:
        permissions = {
            "create_visitor", "approve_visitor", "view_all",
        }
    elif role == Role.AUDITOR:
        permissions = {
            "view_reports", "view_audit_logs", "view_all",
        }
    return permissions | base_viewer


def user_permissions(user):
    if user.is_superuser:
        return permissions_for(Role.SUPER_ADMIN)
    if not user.is_authenticated:
        return set()
    return permissions_for(user.role)


def has_perm(user, perm):
    if user.is_superuser:
        return True
    return perm in user_permissions(user)


def can_manage_org(user):
    return has_perm(user, "manage_org") or has_perm(user, "manage_buildings")
