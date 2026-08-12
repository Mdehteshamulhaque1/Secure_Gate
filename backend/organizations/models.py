from django.db import models


class Organization(models.Model):
    """Multi-tenant company. Everything in SecureGate hangs off this."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    tagline = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=80, default="UTC")
    working_hours_start = models.TimeField(default="09:00")
    working_hours_end = models.TimeField(default="18:00")
    security_policies = models.JSONField(default=dict, blank=True)
    visitor_policies = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def building_count(self):
        return self.buildings.count()


class Building(models.Model):
    """A physical location within an organization."""

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="buildings"
    )
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    floors = models.PositiveIntegerField(default=1)
    entry_gates = models.PositiveIntegerField(default=1)
    exit_gates = models.PositiveIntegerField(default=1)
    has_reception_desk = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.organization.name} / {self.name}"


class Floor(models.Model):
    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="floor_set"
    )
    name = models.CharField(max_length=100)  # e.g. "1st Floor"
    level = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["level"]

    def __str__(self):
        return f"{self.building.name} - {self.name}"


class Gate(models.Model):
    class GateType(models.TextChoices):
        ENTRY = "ENTRY", "Entry"
        EXIT = "EXIT", "Exit"

    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="gates"
    )
    name = models.CharField(max_length=100)
    gate_type = models.CharField(max_length=10, choices=GateType.choices)

    def __str__(self):
        return f"{self.building.name} / {self.name} ({self.gate_type})"


class Department(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="departments"
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Employee(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ON_LEAVE = "ON_LEAVE", "On Leave"

    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="employee_profile"
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="employees"
    )
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    building = models.ForeignKey(
        Building,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    designation = models.CharField(max_length=150, blank=True)
    office_location = models.CharField(max_length=150, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["employee_id"]

    def __str__(self):
        return f"{self.user.full_name} ({self.employee_id})"


class AuditLog(models.Model):
    """Immutable trail of every meaningful action on the platform."""

    user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=80, blank=True)
    entity_id = models.CharField(max_length=40, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} @ {self.created_at:%Y-%m-%d %H:%M}"

    @staticmethod
    def log(user, action, entity_type="", entity_id="", details="", ip_address=None):
        AuditLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id or ""),
            details=details,
            ip_address=ip_address,
        )
