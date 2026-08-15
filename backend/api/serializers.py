from django.utils.text import slugify
from rest_framework import serializers

from accounts.models import User
from organizations.models import Building, Department, Employee, Organization
from visits.models import QRPass, Visit, VisitStatus, Visitor


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "full_name", "phone", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        user.is_email_verified = True
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "organization"]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "tagline", "timezone", "working_hours_start", "working_hours_end"]


class OrganizationCreateSerializer(serializers.ModelSerializer):
    """Create a workspace and (optionally) a default building with it."""

    building_name = serializers.CharField(
        required=False, allow_blank=True, max_length=200,
        help_text="Name of the default building to create for the workspace.",
    )

    class Meta:
        model = Organization
        fields = [
            "name", "tagline", "address", "city", "country", "timezone",
            "working_hours_start", "working_hours_end", "building_name",
        ]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Workspace name is required.")
        return value.strip()

    def create(self, validated_data):
        validated_data.pop("building_name", None)
        base = slugify(validated_data["name"]) or "workspace"
        slug = base
        counter = 2
        while Organization.objects.filter(slug=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        return Organization.objects.create(**validated_data)


class OrganizationJoinSerializer(serializers.Serializer):
    """Join an existing workspace by its slug."""

    slug = serializers.SlugField()

    def validate_slug(self, value):
        if not Organization.objects.filter(slug=value).exists():
            raise serializers.ValidationError(
                "Workspace not found. Check the slug and try again."
            )
        return value


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "address", "floors", "entry_gates", "exit_gates"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code"]


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Employee
        fields = ["id", "employee_id", "full_name", "email", "designation", "department", "building", "status"]


class VisitorSerializer(serializers.ModelSerializer):
    is_blacklisted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Visitor
        fields = [
            "id", "full_name", "phone", "email", "company", "designation", "address",
            "photo", "document_type", "document_number", "vehicle_number", "vehicle_type",
            "emergency_contact", "emergency_phone", "special_notes", "is_blacklisted",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class QRPassSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRPass
        fields = ["token", "signature", "expires_at", "is_used", "is_valid"]
        read_only_fields = fields


class VisitSerializer(serializers.ModelSerializer):
    visitor = VisitorSerializer(read_only=True)
    visitor_id = serializers.IntegerField(write_only=True)
    host_name = serializers.CharField(source="host.full_name", read_only=True, default="")
    building_name = serializers.CharField(source="building.name", read_only=True, default="")
    qr = QRPassSerializer(source="qr_pass", read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Visit
        fields = [
            "id", "visit_id", "visitor", "visitor_id", "host", "host_name",
            "building", "building_name", "purpose", "visit_date",
            "expected_arrival", "expected_exit", "status", "qr", "duration_minutes",
            "registered_at", "checked_in_at", "checked_out_at", "notes",
        ]
        read_only_fields = [
            "status", "registered_at", "checked_in_at", "checked_out_at", "duration_minutes",
        ]

    def validate_visitor_id(self, value):
        org = self.context["request"].user.organization
        if not Visitor.objects.filter(pk=value, visits__organization=org).exists():
            raise serializers.ValidationError("Visitor not found in your organization.")
        return value

    def create(self, validated_data):
        validated_data["organization"] = self.context["request"].user.organization
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class DashboardSummarySerializer(serializers.Serializer):
    today = serializers.IntegerField()
    week = serializers.IntegerField()
    month = serializers.IntegerField()
    inside = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    avg_duration_minutes = serializers.IntegerField()
