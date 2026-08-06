from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, FormView, UpdateView

from organizations.models import AuditLog

from .forms import LoginForm, ProfileForm, RegisterForm
from reports import views as reports_views

User = get_user_model()


FEATURES = [
    {
        "icon": "📱",
        "title": "Pre-Registration",
        "text": "Employees register visitors ahead of time with ID documents, vehicle details and purpose of visit.",
    },
    {
        "icon": "✅",
        "title": "Approval Workflow",
        "text": "Hosts approve or reject requests in one click. Approved visits instantly get a QR pass.",
    },
    {
        "icon": "🔐",
        "title": "QR Access Passes",
        "text": "Signed, time-boxed QR codes that security scans to verify, check-in and check-out visitors.",
    },
    {
        "icon": "🛡️",
        "title": "Role-Based Access",
        "text": "Six roles — from Super Admin to Auditor — with granular permissions on every action.",
    },
    {
        "icon": "🏢",
        "title": "Multi-tenant & Buildings",
        "text": "Each organization gets its own profile, buildings, departments, gates and security policies.",
    },
    {
        "icon": "📊",
        "title": "Analytics & Reports",
        "text": "Live KPIs, charts, printable badges and CSV exports for daily, weekly and monthly reporting.",
    },
]

STEPS = [
    "Visitor registered",
    "Host approves",
    "QR pass issued",
    "Gate check-in",
]


def landing(request):
    """The landing page doubles as the full app: hero + all dashboard features in one page."""
    context = {"features": FEATURES, "steps": STEPS}
    if request.user.is_authenticated:
        context.update(reports_views.landing_context(request.user))
    return render(request, "accounts/landing.html", context)


class SecureLoginView(LoginView):
    template_name = "accounts/login.html"
    authentication_form = LoginForm

    def form_invalid(self, form):
        username = form.cleaned_data.get("username")
        if username:
            try:
                user = User.objects.get(email=username.lower())
            except User.DoesNotExist:
                user = None
            if user and not user.is_superuser:
                if user.is_locked:
                    messages.error(self.request, "Account locked. Try again later.")
                else:
                    user.register_failed_attempt(settings)
                    remaining = settings.MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
                    if user.failed_login_attempts == 0:
                        messages.error(
                            self.request,
                            f"Account locked for {settings.ACCOUNT_LOCKOUT_MINUTES} minutes after too many attempts.",
                        )
                    else:
                        messages.error(
                            self.request,
                            f"Invalid credentials. {remaining} attempt(s) left before lockout.",
                        )
        return super().form_invalid(form)

    def form_valid(self, form):
        response = super().form_valid(form)
        user = form.get_user()
        if not user.is_superuser:
            user.reset_failed_attempts()
        AuditLog.log(user, "Login", ip_address=self.get_client_ip())
        return response

    def get_client_ip(self):
        xff = self.request.META.get("HTTP_X_FORWARDED_FOR")
        return (xff.split(",")[0] if xff else self.request.META.get("REMOTE_ADDR")) or None


class SecureLogoutView(LogoutView):
    next_page = reverse_lazy("landing")

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            AuditLog.log(request.user, "Logout", ip_address=request.META.get("REMOTE_ADDR"))
        return super().dispatch(request, *args, **kwargs)


class RegisterView(CreateView):
    template_name = "accounts/register.html"
    form_class = RegisterForm
    success_url = reverse_lazy("accounts:login")

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, "Account created! Please sign in.")
        return response


class ProfileView(UpdateView):
    template_name = "accounts/profile.html"
    form_class = ProfileForm
    success_url = reverse_lazy("accounts:profile")

    def get_object(self, queryset=None):
        return self.request.user

    def form_valid(self, form):
        AuditLog.log(self.request.user, "Profile updated")
        messages.success(self.request, "Profile updated.")
        return super().form_valid(form)


def change_password(request):
    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            AuditLog.log(user, "Password changed")
            messages.success(request, "Password changed successfully.")
            return redirect("accounts:profile")
    else:
        form = PasswordChangeForm(request.user)
    return render(request, "accounts/change_password.html", {"form": form})
