from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    ORG_ADMIN = "ORG_ADMIN", "Organization Admin"
    RECEPTIONIST = "RECEPTIONIST", "Receptionist"
    SECURITY = "SECURITY", "Security Guard"
    EMPLOYEE = "EMPLOYEE", "Employee"
    AUDITOR = "AUDITOR", "Auditor"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.SUPER_ADMIN)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model. Login is email-based.
    Each user belongs to an organization (tenancy) and has a single role.
    """

    username = None
    email = models.EmailField("email address", unique=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.EMPLOYEE
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    # Security / account lockout
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    notification_preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def is_locked(self):
        from django.utils import timezone

        return self.locked_until is not None and self.locked_until > timezone.now()

    def register_failed_attempt(self, settings):
        from django.utils import timezone

        self.failed_login_attempts += 1
        if self.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            from datetime import timedelta

            self.locked_until = timezone.now() + timedelta(
                minutes=settings.ACCOUNT_LOCKOUT_MINUTES
            )
            self.failed_login_attempts = 0
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=["failed_login_attempts", "locked_until"])
