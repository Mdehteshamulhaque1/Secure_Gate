from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Role, User
from accounts.permissions import can_manage_org, has_perm
from django.db.models import Q

from .forms import BuildingForm, DepartmentForm, EmployeeForm, OrganizationForm
from .models import AuditLog, Building, Department, Employee, Organization


def _admin_guard(request):
    if not has_perm(request.user, "manage_buildings"):
        return True  # blocked
    return False


@login_required
def org_profile(request):
    if _admin_guard(request):
        messages.error(request, "You don't have permission to manage the organization.")
        return redirect("reports:dashboard")
    org = request.user.organization
    if not org:
        messages.error(request, "You are not attached to any organization.")
        return redirect("reports:dashboard")
    if request.method == "POST":
        form = OrganizationForm(request.POST, request.FILES, instance=org)
        if form.is_valid():
            form.save()
            AuditLog.log(request.user, "Organization updated", "Organization", org.id)
            messages.success(request, "Organization profile updated.")
            return redirect("organizations:org_profile")
    else:
        form = OrganizationForm(instance=org)
    return render(request, "organizations/org_profile.html", {"form": form, "org": org})


@login_required
def building_list(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    buildings = Building.objects.filter(organization=org)
    return render(request, "organizations/building_list.html", {"buildings": buildings})


@login_required
def building_create(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    if request.method == "POST":
        form = BuildingForm(request.POST)
        if form.is_valid():
            building = form.save(commit=False)
            building.organization = org
            building.save()
            AuditLog.log(request.user, "Building created", "Building", building.id, building.name)
            messages.success(request, f"Building '{building.name}' created.")
            return redirect("organizations:building_list")
    else:
        form = BuildingForm()
    return render(request, "organizations/building_form.html", {"form": form, "title": "Add Building"})


@login_required
def building_edit(request, pk):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    building = get_object_or_404(
        Building, pk=pk, organization=request.user.organization
    )
    if request.method == "POST":
        form = BuildingForm(request.POST, instance=building)
        if form.is_valid():
            form.save()
            AuditLog.log(request.user, "Building updated", "Building", building.id, building.name)
            messages.success(request, "Building updated.")
            return redirect("organizations:building_list")
    else:
        form = BuildingForm(instance=building)
    return render(request, "organizations/building_form.html", {"form": form, "title": "Edit Building"})


@login_required
def building_delete(request, pk):
    building = get_object_or_404(
        Building, pk=pk, organization=request.user.organization
    )
    name = building.name
    building.delete()
    AuditLog.log(request.user, "Building deleted", "Building", "", name)
    messages.success(request, f"Building '{name}' deleted.")
    return redirect("organizations:building_list")


@login_required
def department_list(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    departments = Department.objects.filter(organization=org)
    return render(request, "organizations/department_list.html", {"departments": departments})


@login_required
def department_create(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    if request.method == "POST":
        form = DepartmentForm(request.POST)
        if form.is_valid():
            dept = form.save(commit=False)
            dept.organization = org
            dept.save()
            AuditLog.log(request.user, "Department created", "Department", dept.id, dept.name)
            messages.success(request, f"Department '{dept.name}' created.")
            return redirect("organizations:department_list")
    else:
        form = DepartmentForm()
    return render(request, "organizations/department_form.html", {"form": form, "title": "Add Department"})


@login_required
def department_delete(request, pk):
    dept = get_object_or_404(Department, pk=pk, organization=request.user.organization)
    name = dept.name
    dept.delete()
    AuditLog.log(request.user, "Department deleted", "Department", "", name)
    messages.success(request, f"Department '{name}' deleted.")
    return redirect("organizations:department_list")


@login_required
def employee_list(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    q = request.GET.get("q", "").strip()
    employees = Employee.objects.filter(organization=org).select_related("user", "department", "building")
    if q:
        employees = employees.filter(
            Q(user__full_name__icontains=q)
            | Q(user__email__icontains=q)
            | Q(employee_id__icontains=q)
            | Q(designation__icontains=q)
        )
    return render(request, "organizations/employee_list.html", {"employees": employees, "q": q})


@login_required
def employee_create(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    if request.method == "POST":
        form = EmployeeForm(request.POST, org=org)
        if form.is_valid():
            employee = form.save(commit=False)
            employee.organization = org
            user = form.cleaned_data["user"]
            user.organization = org
            user.role = Role.EMPLOYEE
            user.save()
            employee.save()
            AuditLog.log(request.user, "Employee created", "Employee", employee.employee_id, user.full_name)
            messages.success(request, f"Employee '{user.full_name}' created.")
            return redirect("organizations:employee_list")
    else:
        form = EmployeeForm(org=org)
    return render(request, "organizations/employee_form.html", {"form": form, "title": "Add Employee"})


@login_required
def employee_edit(request, pk):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    employee = get_object_or_404(Employee, pk=pk, organization=org)
    if request.method == "POST":
        form = EmployeeForm(request.POST, instance=employee, org=org)
        if form.is_valid():
            form.save()
            AuditLog.log(request.user, "Employee updated", "Employee", employee.employee_id)
            messages.success(request, "Employee updated.")
            return redirect("organizations:employee_list")
    else:
        form = EmployeeForm(instance=employee, org=org)
    return render(request, "organizations/employee_form.html", {"form": form, "title": "Edit Employee"})


@login_required
def user_roles(request):
    if _admin_guard(request):
        return redirect("reports:dashboard")
    org = request.user.organization
    users = User.objects.filter(organization=org)
    if request.method == "POST":
        target_id = request.POST.get("user_id")
        new_role = request.POST.get("role")
        if target_id and new_role in Role.values:
            target = get_object_or_404(User, pk=target_id, organization=org)
            target.role = new_role
            target.save()
            AuditLog.log(request.user, "Role changed", "User", target.email, f"{target.role} -> {new_role}")
            messages.success(request, f"{target.full_name} role changed to {new_role}.")
            return redirect("organizations:user_roles")
    return render(request, "organizations/user_roles.html", {"users": users, "roles": Role.choices})
