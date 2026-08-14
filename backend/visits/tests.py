from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from accounts.models import Role
from organizations.models import Building, Department, Employee, Organization
from visits.models import QRPass, Visit, VisitStatus, Visitor
from visits.services import approve_visit, check_in, check_out, reject_visit

User = get_user_model()


class SecureGateTestCase(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Test Co", slug="test-co")
        self.dept = Department.objects.create(organization=self.org, name="Engineering")
        self.building = Building.objects.create(organization=self.org, name="HQ", floors=3)

        self.employee = User.objects.create_user(
            email="employee@test.com", password="Passw0rd!123",
            full_name="Alice Employee", role=Role.EMPLOYEE, organization=self.org,
        )
        self.security = User.objects.create_user(
            email="security@test.com", password="Passw0rd!123",
            full_name="Tony Security", role=Role.SECURITY, organization=self.org,
        )
        self.reception = User.objects.create_user(
            email="reception@test.com", password="Passw0rd!123",
            full_name="Sara Reception", role=Role.RECEPTIONIST, organization=self.org,
        )
        Employee.objects.create(
            user=self.employee, organization=self.org, employee_id="EMP-1",
            department=self.dept, designation="Engineer",
        )
        self.visitor = Visitor.objects.create(
            full_name="John Visitor", phone="9999999999", company="Acme",
        )

    def register_visit(self):
        return Visit.objects.create(
            visitor=self.visitor, organization=self.org, building=self.building,
            host=self.employee, created_by=self.reception,
            purpose="Interview", visit_date=timezone.localdate(),
        )


class VisitWorkflowTests(SecureGateTestCase):
    def test_full_workflow_registered_to_checked_out(self):
        visit = self.register_visit()
        self.assertEqual(visit.status, VisitStatus.PENDING)

        ok, _ = approve_visit(visit, self.employee)
        self.assertTrue(ok)
        visit.refresh_from_db()
        self.assertEqual(visit.status, VisitStatus.APPROVED)
        self.assertTrue(hasattr(visit, "qr_pass"))
        self.assertTrue(visit.qr_pass.is_valid)

        ok, _ = check_in(visit, self.security, via_qr=True)
        self.assertTrue(ok)
        visit.refresh_from_db()
        self.assertEqual(visit.status, VisitStatus.CHECKED_IN)
        self.assertTrue(visit.qr_pass.is_used)

        ok, _ = check_out(visit, self.security)
        self.assertTrue(ok)
        visit.refresh_from_db()
        self.assertEqual(visit.status, VisitStatus.CHECKED_OUT)
        self.assertGreaterEqual(visit.duration_minutes, 0)

    def test_cannot_check_in_twice(self):
        visit = self.register_visit()
        approve_visit(visit, self.employee)
        check_in(visit, self.security)
        ok, _ = check_in(visit, self.security)
        self.assertFalse(ok)

    def test_reject_workflow(self):
        visit = self.register_visit()
        ok, _ = reject_visit(visit, self.employee, "Not needed")
        self.assertTrue(ok)
        visit.refresh_from_db()
        self.assertEqual(visit.status, VisitStatus.REJECTED)
        self.assertFalse(hasattr(visit, "qr_pass"))

    def test_approval_blocked_for_blacklisted_visitor(self):
        from visits.models import Blacklist
        Blacklist.objects.create(visitor=self.visitor, reason="PERMANENT_BAN", added_by=self.reception)
        visit = self.register_visit()
        ok, msg = approve_visit(visit, self.employee)
        self.assertFalse(ok)
        visit.refresh_from_db()
        self.assertEqual(visit.status, VisitStatus.PENDING)


class QRPassTests(SecureGateTestCase):
    def test_qr_verification_cycle(self):
        visit = self.register_visit()
        approve_visit(visit, self.employee)
        qr = visit.qr_pass

        ok, msg, found = QRPass.verify(str(qr.token), qr.signature)
        self.assertTrue(ok, msg)
        self.assertEqual(found.pk, qr.pk)

        # Wrong signature -> tampered
        ok, msg, _ = QRPass.verify(str(qr.token), "x" * 64)
        self.assertFalse(ok)
        self.assertIn("tampered", msg)

        # Unknown token
        ok, msg, _ = QRPass.verify("00000000-0000-0000-0000-000000000000", "x" * 64)
        self.assertFalse(ok)

        # Using it twice blocks duplicate entry
        check_in(visit, self.security, via_qr=True)
        ok, msg, _ = QRPass.verify(str(qr.token), qr.signature)
        self.assertFalse(ok)
        self.assertIn("duplicate", msg)


class QRPassEmailTests(SecureGateTestCase):
    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_approval_emails_qr_pass_to_visitor(self):
        from django.core import mail

        self.visitor.email = "visitor@gmail.com"
        self.visitor.save()
        visit = self.register_visit()

        ok, msg = approve_visit(visit, self.employee)
        self.assertTrue(ok)
        self.assertIn("emailed", msg)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ["visitor@gmail.com"])
        self.assertIn("QR pass", email.subject)
        self.assertIn(visit.visitor.full_name, email.body)
        self.assertEqual(len(email.attachments), 1)
        attachment = email.attachments[0]
        if isinstance(attachment, tuple):
            self.assertTrue(attachment[1].startswith(b"\x89PNG"))
        else:
            self.assertEqual(attachment.get_content_type(), "image/png")
            self.assertTrue(attachment.get_payload(decode=True).startswith(b"\x89PNG"))

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_no_email_when_visitor_has_no_address(self):
        from django.core import mail

        visit = self.register_visit()  # self.visitor has blank email
        ok, _ = approve_visit(visit, self.employee)
        self.assertTrue(ok)
        self.assertEqual(len(mail.outbox), 0)


class RBACTests(SecureGateTestCase):
    def test_role_permissions(self):
        from accounts.permissions import has_perm
        self.assertTrue(has_perm(self.security, "scan_qr"))
        self.assertTrue(has_perm(self.employee, "approve_visitor"))
        self.assertFalse(has_perm(self.employee, "manage_buildings"))
        self.assertTrue(has_perm(self.reception, "badge_print"))
        self.assertFalse(has_perm(self.reception, "scan_qr"))

    def test_account_lockout(self):
        from django.conf import settings
        self.assertFalse(self.employee.is_locked)
        for _ in range(settings.MAX_LOGIN_ATTEMPTS):
            self.employee.register_failed_attempt(settings)
        self.assertTrue(self.employee.is_locked)

    def test_login_redirects_by_role(self):
        self.client.login(email="employee@test.com", password="Passw0rd!123")
        resp = self.client.get(reverse("reports:dashboard"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Dashboard")


class PageTests(SecureGateTestCase):
    def test_landing_page(self):
        resp = self.client.get(reverse("accounts:landing"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "SecureGate")

    def test_visitor_registration_form_page(self):
        self.client.login(email="employee@test.com", password="Passw0rd!123")
        resp = self.client.get(reverse("visits:visitor_register"))
        self.assertEqual(resp.status_code, 200)

    def test_registration_creates_pending_visit(self):
        self.client.login(email="employee@test.com", password="Passw0rd!123")
        resp = self.client.post(
            reverse("visits:visitor_register"),
            {
                "full_name": "New Visitor", "phone": "8888888888",
                "host": self.employee.pk, "purpose": "Visit", "visit_date": timezone.localdate(),
                "expected_arrival": "10:00", "expected_exit": "12:00",
            },
        )
        self.assertEqual(resp.status_code, 302)
        visit = Visit.objects.get(visitor__phone="8888888888")
        self.assertEqual(visit.status, VisitStatus.PENDING)

    def test_security_page_requires_role(self):
        self.client.login(email="employee@test.com", password="Passw0rd!123")
        resp = self.client.get(reverse("visits:security"))
        self.assertEqual(resp.status_code, 302)
        self.client.logout()
        self.client.login(email="security@test.com", password="Passw0rd!123")
        resp = self.client.get(reverse("visits:security"))
        self.assertEqual(resp.status_code, 200)
