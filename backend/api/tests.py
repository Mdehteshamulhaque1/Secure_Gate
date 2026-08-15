from rest_framework.test import APITestCase

from accounts.models import Role, User
from organizations.models import Building, Employee, Organization
from visits.models import Visit, VisitStatus, Visitor


class AuthApiTests(APITestCase):
    """End-to-end tests for the auth endpoints used by the SPA signup/login flow."""

    def test_register_returns_tokens_and_creates_user(self):
        resp = self.client.post(
            "/api/auth/register/",
            {
                "email": "new@test.com",
                "full_name": "New Person",
                "phone": "1234567890",
                "password": "Str0ng!Pass",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["email"], "new@test.com")
        self.assertTrue(User.objects.filter(email="new@test.com").exists())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email="dup@test.com", password="Str0ng!Pass", full_name="Dup")
        resp = self.client.post(
            "/api/auth/register/",
            {"email": "dup@test.com", "full_name": "Dup", "password": "Str0ng!Pass"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_token_endpoint_returns_access_and_refresh(self):
        User.objects.create_user(email="a@test.com", password="Str0ng!Pass", full_name="A")
        resp = self.client.post(
            "/api/auth/token/", {"email": "a@test.com", "password": "Str0ng!Pass"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_token_endpoint_rejects_bad_password(self):
        User.objects.create_user(email="a@test.com", password="Str0ng!Pass", full_name="A")
        resp = self.client.post(
            "/api/auth/token/", {"email": "a@test.com", "password": "Wrong!Pass"}, format="json"
        )
        self.assertEqual(resp.status_code, 401)

    def test_me_endpoint_with_bearer_token(self):
        User.objects.create_user(
            email="a@test.com", password="Str0ng!Pass", full_name="A", role=Role.EMPLOYEE
        )
        resp = self.client.post(
            "/api/auth/token/", {"email": "a@test.com", "password": "Str0ng!Pass"}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["user"]["email"], "a@test.com")

    def test_me_endpoint_requires_auth(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 401)


class VisitApiTests(APITestCase):
    """Tests for the visit-registration flow used by the SPA pre-registration page."""

    def setUp(self):
        self.org = Organization.objects.create(name="Test Org", slug="test-org")
        self.user = User.objects.create_user(
            email="e@test.com", password="Str0ng!Pass", full_name="E",
            role=Role.EMPLOYEE, organization=self.org,
        )
        resp = self.client.post(
            "/api/auth/token/", {"email": "e@test.com", "password": "Str0ng!Pass"}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_register_visit_creates_pending_visit(self):
        resp = self.client.post(
            "/api/visits/register/",
            {
                "visitor": {"full_name": "Guest", "phone": "9999999999"},
                "visit": {"purpose": "Client meeting", "host": self.user.pk},
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        visit = Visit.objects.get(pk=resp.data["visit"]["id"])
        self.assertEqual(visit.status, VisitStatus.PENDING)
        self.assertEqual(visit.organization, self.org)
        self.assertEqual(visit.visitor.full_name, "Guest")

    def test_register_visit_requires_purpose(self):
        resp = self.client.post(
            "/api/visits/register/",
            {"visitor": {"full_name": "Guest", "phone": "9999999999"}, "visit": {}},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_visit_list_is_org_scoped(self):
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        other_user = User.objects.create_user(
            email="other@test.com", password="Str0ng!Pass", full_name="O",
            role=Role.EMPLOYEE, organization=other_org,
        )
        other_visitor = Visitor.objects.create(full_name="Stray", phone="1111111111")
        Visit.objects.create(
            visitor=other_visitor, organization=other_org, host=other_user, purpose="Other"
        )
        resp = self.client.get("/api/visits/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["results"]), 0)


class OrganizationApiTests(APITestCase):
    """Workspace onboarding: create a new org or join an existing one."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="org@test.com", password="Str0ng!Pass", full_name="Org User"
        )
        resp = self.client.post(
            "/api/auth/token/", {"email": "org@test.com", "password": "Str0ng!Pass"}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_create_org_assigns_admin_building_and_employee(self):
        resp = self.client.post(
            "/api/organizations/",
            {"name": "New Workspace", "building_name": "Tower One"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        org = Organization.objects.get(slug="new-workspace")
        self.assertEqual(org.name, "New Workspace")
        self.assertEqual(org.buildings.count(), 1)
        self.assertEqual(org.buildings.first().name, "Tower One")
        user = User.objects.get(pk=self.user.pk)
        self.assertEqual(user.organization, org)
        self.assertEqual(user.role, Role.ORG_ADMIN)
        self.assertTrue(Employee.objects.filter(user=user).exists())
        self.assertTrue(Building.objects.filter(organization=org).exists())

    def test_create_org_uses_default_building_name(self):
        resp = self.client.post("/api/organizations/", {"name": "Default Building Co"}, format="json")
        self.assertEqual(resp.status_code, 201)
        org = Organization.objects.get(slug="default-building-co")
        self.assertEqual(org.buildings.first().name, "Head Office")

    def test_create_org_second_gets_unique_slug(self):
        Organization.objects.create(name="New Workspace", slug="new-workspace")
        resp = self.client.post("/api/organizations/", {"name": "New Workspace"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Organization.objects.filter(slug="new-workspace-2").exists())

    def test_create_org_rejects_user_already_in_org(self):
        existing = Organization.objects.create(name="Existing", slug="existing")
        self.user.organization = existing
        self.user.save(update_fields=["organization"])
        resp = self.client.post("/api/organizations/", {"name": "New"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_create_org_requires_auth(self):
        self.client.credentials()
        resp = self.client.post("/api/organizations/", {"name": "X"}, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_join_org_assigns_user_as_employee(self):
        Organization.objects.create(name="Acme", slug="acme")
        resp = self.client.post("/api/organizations/join/", {"slug": "acme"}, format="json")
        self.assertEqual(resp.status_code, 200)
        user = User.objects.get(pk=self.user.pk)
        self.assertEqual(user.organization.slug, "acme")
        self.assertEqual(user.role, Role.EMPLOYEE)
        self.assertTrue(Employee.objects.filter(user=user).exists())

    def test_join_org_unknown_slug_rejected(self):
        resp = self.client.post("/api/organizations/join/", {"slug": "nope"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_join_org_requires_auth(self):
        self.client.credentials()
        resp = self.client.post("/api/organizations/join/", {"slug": "acme"}, format="json")
        self.assertEqual(resp.status_code, 401)
