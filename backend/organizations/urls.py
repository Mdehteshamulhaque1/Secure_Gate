from django.urls import path

from . import views

app_name = "organizations"

urlpatterns = [
    path("", views.org_profile, name="org_profile"),
    path("buildings/", views.building_list, name="building_list"),
    path("buildings/new/", views.building_create, name="building_create"),
    path("buildings/<int:pk>/edit/", views.building_edit, name="building_edit"),
    path("buildings/<int:pk>/delete/", views.building_delete, name="building_delete"),
    path("departments/", views.department_list, name="department_list"),
    path("departments/new/", views.department_create, name="department_create"),
    path("departments/<int:pk>/delete/", views.department_delete, name="department_delete"),
    path("employees/", views.employee_list, name="employee_list"),
    path("employees/new/", views.employee_create, name="employee_create"),
    path("employees/<int:pk>/edit/", views.employee_edit, name="employee_edit"),
    path("users/roles/", views.user_roles, name="user_roles"),
]
