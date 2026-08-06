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
