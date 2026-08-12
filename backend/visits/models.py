import hashlib
import secrets
import uuid

from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone


class DocumentType(models.TextChoices):
    AADHAAR = "AADHAAR", "Aadhaar"
    PASSPORT = "PASSPORT", "Passport"
    PAN = "PAN", "PAN Card"
    DRIVING_LICENSE = "DRIVING_LICENSE", "Driving License"
    COMPANY_ID = "COMPANY_ID", "Company ID"


class VehicleType(models.TextChoices):
    CAR = "CAR", "Car"
    BIKE = "BIKE", "Bike"
    TRUCK = "TRUCK", "Truck"
    VAN = "VAN", "Van"
    OTHER = "OTHER", "Other"


class VisitStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    CHECKED_IN = "CHECKED_IN", "Checked In"
    CHECKED_OUT = "CHECKED_OUT", "Checked Out"
    ARCHIVED = "ARCHIVED", "Archived"
    EXPIRED = "EXPIRED", "Expired"


class BlacklistReason(models.TextChoices):
    SECURITY_CONCERN = "SECURITY_CONCERN", "Security Concern"
    FAKE_DOCUMENTS = "FAKE_DOCUMENTS", "Fake Documents"
    MISCONDUCT = "MISCONDUCT", "Misconduct"
    PERMANENT_BAN = "PERMANENT_BAN", "Permanent Ban"


class Visitor(models.Model):
    """A person who visits the organization (may visit multiple times)."""

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    company = models.CharField(max_length=150, blank=True)
    designation = models.CharField(max_length=150, blank=True)
    address = models.TextField(blank=True)
    photo = models.ImageField(upload_to="visitor_photos/", blank=True, null=True)

    # Documents
    document_type = models.CharField(
        max_length=20, choices=DocumentType.choices, blank=True
    )
    document_number = models.CharField(max_length=60, blank=True)
    document_file = models.FileField(
        upload_to="visitor_documents/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["pdf", "jpg", "jpeg", "png"])],
    )

    # Vehicle
    vehicle_number = models.CharField(max_length=30, blank=True)
    vehicle_type = models.CharField(
        max_length=10, choices=VehicleType.choices, blank=True
    )

    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    special_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.full_name

    @property
    def is_blacklisted(self):
        return self.blacklists.filter(is_active=True).exists()

    @property
    def blacklist_reason(self):
        entry = self.blacklists.filter(is_active=True).first()
        return entry.reason if entry else ""


class Visit(models.Model):
    """One visit of a visitor to an organization, following the approval workflow."""

    visit_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    visitor = models.ForeignKey(
        Visitor, on_delete=models.CASCADE, related_name="visits"
    )
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="visits"
    )
    building = models.ForeignKey(
        "organizations.Building",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="visits",
    )
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hosted_visits",
        verbose_name="Host employee",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_visits",
    )

    purpose = models.CharField(max_length=200)
    notes = models.TextField(blank=True)

    visit_date = models.DateField(default=timezone.localdate)
    expected_arrival = models.TimeField(default="10:00")
    expected_exit = models.TimeField(default="17:00")

    status = models.CharField(
        max_length=20, choices=VisitStatus.choices, default=VisitStatus.PENDING
    )

    # Timestamps for the workflow
    registered_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=300, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checkins",
    )
    checked_out_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checkouts",
    )

    class Meta:
        ordering = ["-registered_at"]
        indexes = [
            models.Index(fields=["status", "visit_date"]),
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self):
        return f"{self.visitor.full_name} → {self.purpose} ({self.status})"

    @property
    def duration_minutes(self):
        if self.checked_in_at and self.checked_out_at:
            delta = self.checked_out_at - self.checked_in_at
            return int(delta.total_seconds() // 60)
        return 0


class QRPass(models.Model):
    """Cryptographically signed QR pass bound to one visit."""

    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name="qr_pass")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    signature = models.CharField(max_length=64, editable=False)
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"QRPass {self.token}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired

    @classmethod
    def issue(cls, visit, valid_minutes=120):
        """Generate and persist a signed QR pass for an approved visit."""
        token = uuid.uuid4()
        payload = f"{visit.visit_id}|{visit.organization_id}|{token}"
        signature = hashlib.sha256(
            f"{settings.SECRET_KEY}:{payload}".encode()
        ).hexdigest()
        return cls.objects.create(
            visit=visit,
            token=token,
            signature=signature,
            expires_at=timezone.now() + timezone.timedelta(minutes=valid_minutes),
        )

    @classmethod
    def verify(cls, raw_token, raw_signature):
        """
        Validate a scanned QR: check signature, existence, expiry, single use.
        Returns (ok: bool, message: str, qr: QRPass|None)
        """
        if not raw_token or not raw_signature:
            return False, "Invalid QR payload", None
        try:
            qr = cls.objects.get(token=raw_token)
        except cls.DoesNotExist:
            return False, "Unknown pass - not registered in system", None
        expected = hashlib.sha256(
            f"{settings.SECRET_KEY}:{qr.visit.visit_id}|{qr.visit.organization_id}|{qr.token}".encode()
        ).hexdigest()
        if not secrets.compare_digest(expected, raw_signature):
            return False, "Signature mismatch - pass looks tampered with", qr
        if qr.is_used:
            return False, "Pass already used - duplicate entry blocked", qr
        if qr.is_expired:
            return False, "Pass has expired", qr
        return True, "Pass valid - proceed with check-in", qr


class Blacklist(models.Model):
    visitor = models.ForeignKey(
        Visitor, on_delete=models.CASCADE, related_name="blacklists"
    )
    reason = models.CharField(max_length=30, choices=BlacklistReason.choices)
    comment = models.TextField(blank=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.visitor.full_name} - {self.reason}"
