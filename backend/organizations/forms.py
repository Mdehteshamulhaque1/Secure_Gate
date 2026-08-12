from django import forms
from django.contrib.auth import get_user_model

from accounts.models import Role, User

from .models import Building, Department, Employee, Organization

User = get_user_model()


class OrganizationForm(forms.ModelForm):
    class Meta:
        model = Organization
        fields = [
            "name", "slug", "tagline", "logo", "address", "city", "country",
            "timezone", "working_hours_start", "working_hours_end",
        ]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "slug": forms.TextInput(attrs={"class": "form-control"}),
            "tagline": forms.TextInput(attrs={"class": "form-control"}),
            "logo": forms.ClearableFileInput(attrs={"class": "form-control"}),
            "address": forms.Textarea(attrs={"class": "form-control", "rows": 2}),
            "city": forms.TextInput(attrs={"class": "form-control"}),
            "country": forms.TextInput(attrs={"class": "form-control"}),
            "timezone": forms.TextInput(attrs={"class": "form-control"}),
            "working_hours_start": forms.TimeInput(attrs={"class": "form-control", "type": "time"}),
            "working_hours_end": forms.TimeInput(attrs={"class": "form-control", "type": "time"}),
        }


class BuildingForm(forms.ModelForm):
    class Meta:
        model = Building
        fields = ["name", "address", "floors", "entry_gates", "exit_gates", "has_reception_desk"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "address": forms.Textarea(attrs={"class": "form-control", "rows": 2}),
            "floors": forms.NumberInput(attrs={"class": "form-control", "min": 1}),
            "entry_gates": forms.NumberInput(attrs={"class": "form-control", "min": 1}),
            "exit_gates": forms.NumberInput(attrs={"class": "form-control", "min": 1}),
            "has_reception_desk": forms.CheckboxInput(attrs={"class": "form-check-input"}),
        }


class DepartmentForm(forms.ModelForm):
    class Meta:
        model = Department
        fields = ["name", "code"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "code": forms.TextInput(attrs={"class": "form-control"}),
        }


class EmployeeForm(forms.ModelForm):
    user = forms.ModelChoiceField(
        queryset=User.objects.none(),
        label="User (account)",
        help_text="Pick an existing registered user, or create one first.",
    )

    class Meta:
        model = Employee
        fields = ["user", "employee_id", "department", "building", "designation", "office_location", "joining_date", "status"]
        widgets = {
            "employee_id": forms.TextInput(attrs={"class": "form-control", "placeholder": "EMP-0042"}),
            "department": forms.Select(attrs={"class": "form-select"}),
            "building": forms.Select(attrs={"class": "form-select"}),
            "designation": forms.TextInput(attrs={"class": "form-control", "placeholder": "Senior Engineer"}),
            "office_location": forms.TextInput(attrs={"class": "form-control"}),
            "joining_date": forms.DateInput(attrs={"class": "form-control", "type": "date"}),
            "status": forms.Select(attrs={"class": "form-select"}),
        }

    def __init__(self, *args, org=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["user"].queryset = User.objects.filter(organization=org) if org else User.objects.none()
        self.fields["department"].queryset = Department.objects.filter(organization=org)
        self.fields["building"].queryset = Building.objects.filter(organization=org)
        self.fields["user"].widget.attrs["class"] = "form-select"

    def clean_employee_id(self):
        eid = self.cleaned_data.get("employee_id")
        qs = Employee.objects.filter(employee_id=eid)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("This employee ID is already in use.")
        return eid
