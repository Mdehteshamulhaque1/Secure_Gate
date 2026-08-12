from django import forms

from .models import (
    Blacklist,
    BlacklistReason,
    DocumentType,
    VehicleType,
    Visit,
    Visitor,
)


class VisitorRegistrationForm(forms.ModelForm):
    """Used by employees (pre-registration) and reception (walk-in)."""

    class Meta:
        model = Visitor
        fields = [
            "full_name", "phone", "email", "company", "designation", "address",
            "photo", "document_type", "document_number", "document_file",
            "vehicle_number", "vehicle_type", "emergency_contact", "emergency_phone",
            "special_notes",
        ]
        widgets = {
            "full_name": forms.TextInput(attrs={"class": "form-control", "placeholder": "Full legal name"}),
            "phone": forms.TextInput(attrs={"class": "form-control", "placeholder": "+91 98765 43210"}),
            "email": forms.EmailInput(attrs={"class": "form-control", "placeholder": "visitor@company.com"}),
            "company": forms.TextInput(attrs={"class": "form-control", "placeholder": "Company name"}),
            "designation": forms.TextInput(attrs={"class": "form-control", "placeholder": "Designation"}),
            "address": forms.Textarea(attrs={"class": "form-control", "rows": 2, "placeholder": "Street, city"}),
            "photo": forms.ClearableFileInput(attrs={"class": "form-control"}),
            "document_type": forms.Select(attrs={"class": "form-select"}),
            "document_number": forms.TextInput(attrs={"class": "form-control", "placeholder": "ID / document number"}),
            "document_file": forms.ClearableFileInput(attrs={"class": "form-control"}),
            "vehicle_number": forms.TextInput(attrs={"class": "form-control", "placeholder": "KA 01 AB 1234"}),
            "vehicle_type": forms.Select(attrs={"class": "form-select"}),
            "emergency_contact": forms.TextInput(attrs={"class": "form-control", "placeholder": "Emergency contact name"}),
            "emergency_phone": forms.TextInput(attrs={"class": "form-control", "placeholder": "Emergency contact phone"}),
            "special_notes": forms.Textarea(attrs={"class": "form-control", "rows": 2, "placeholder": "Access notes, allergies, etc."}),
        }


class VisitForm(forms.ModelForm):
    class Meta:
        model = Visit
        fields = [
            "building", "host", "purpose", "visit_date",
            "expected_arrival", "expected_exit", "notes",
        ]
        widgets = {
            "building": forms.Select(attrs={"class": "form-select"}),
            "host": forms.Select(attrs={"class": "form-select"}),
            "purpose": forms.TextInput(attrs={"class": "form-control", "placeholder": "e.g. Client meeting"}),
            "visit_date": forms.DateInput(attrs={"class": "form-control", "type": "date"}),
            "expected_arrival": forms.TimeInput(attrs={"class": "form-control", "type": "time"}),
            "expected_exit": forms.TimeInput(attrs={"class": "form-control", "type": "time"}),
            "notes": forms.Textarea(attrs={"class": "form-control", "rows": 2}),
        }

    def __init__(self, *args, org=None, **kwargs):
        super().__init__(*args, **kwargs)
        if org:
            self.fields["building"].queryset = org.buildings.all()
            self.fields["host"].queryset = org.users.all()
            self.fields["building"].empty_label = "Select building"
            self.fields["host"].empty_label = "Select host employee"

    def clean(self):
        cleaned = super().clean()
        arrival = cleaned.get("expected_arrival")
        exit_ = cleaned.get("expected_exit")
        if arrival and exit_ and exit_ <= arrival:
            raise forms.ValidationError("Expected exit must be after expected arrival.")
        return cleaned


class QRScanForm(forms.Form):
    token = forms.CharField(
        label="QR token",
        widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Paste QR token or scan result"}),
    )
    signature = forms.CharField(
        label="QR signature",
        widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Paste signature from the QR"}),
    )


class ManualVerificationForm(forms.Form):
    phone_or_email = forms.CharField(
        label="Visitor phone or email",
        widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Phone number or email"}),
    )


class BlacklistForm(forms.ModelForm):
    class Meta:
        model = Blacklist
        fields = ["reason", "comment"]
        widgets = {
            "reason": forms.Select(attrs={"class": "form-select"}),
            "comment": forms.Textarea(attrs={"class": "form-control", "rows": 2, "placeholder": "Why is this visitor blacklisted?"}),
        }
