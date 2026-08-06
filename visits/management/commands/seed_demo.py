import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Role, User
from organizations.models import AuditLog, Building, Department, Employee, Organization
from visits.models import Blacklist, QRPass, Visit, VisitStatus, Visitor
from visits.services import approve_visit, check_in, check_out

DEMO_PASSWORD = "Secure@123"

SAMPLE_VISITORS = [
    ("Rahul Sharma", "9876543210", "Tata Consultancy Services", "Client meeting"),
    ("Priya Patel", "9812345670", "Infosys", "Interview"),
    ("Arjun Nair", "9988776655", "Wipro", "Vendor demo"),
    ("Sneha Kulkarni", "9123456789", "Amazon", "Partnership talk"),
    ("Vikram Singh", "9001234567", "Delivery Partner", "Package delivery"),
    ("Ananya Iyer", "8887766554", "Cognizant", "Technical workshop"),
    ("Rohan Desai", "7778889990", "Independent", "Document submission"),
    ("Meera Joshi", "6665554443", "HCL Tech", "Service visit"),
    ("Karan Mehta", "5554443332", "Reliance Jio", "Network maintenance"),
    ("Nisha Reddy", "4443332221", "Freshworks", "Product demo"),
    ("Aditya Gupta", "3332221110", "Flipkart", "Procurement meeting"),
    ("Divya Menon", "2221110009", "Google", "Architecture review"),
]


class Command(BaseCommand):
    help = "Seed the database with a demo organization, users and visitor records."

    def handle(self, *args, **options):
        self.stdout.write("Seeding SecureGate demo data...")

        org, _ = Organization.objects.get_or_create(
            slug="acme-corp",
            defaults={
                "name": "Acme Corporation",
                "tagline": "We build the future",
                "address": "1 Tech Park Avenue",
                "city": "Bengaluru",
                "country": "India",
                "timezone": "Asia/Kolkata",
                "working_hours_start": "09:00",
                "working_hours_end": "18:00",
            },
        )

        buildings = {}
        for i, name in enumerate(["Building A", "Building B", "Building C"], 1):
            b, _ = Building.objects.get_or_create(
                organization=org, name=name,
                defaults={"floors": 4 + i, "entry_gates": 2, "exit_gates": 2},
            )
            buildings[name] = b

        depts = {}
        for name in ["Engineering", "Sales", "HR", "Finance", "Security", "Administration"]:
            d, _ = Department.objects.get_or_create(organization=org, name=name)
            depts[name] = d

        users = {}
        role_specs = [
            ("admin@acme.com", "Vikram Admin", Role.ORG_ADMIN, "Engineering", "Head of Operations"),
            ("reception@acme.com", "Sara Reception", Role.RECEPTIONIST, "Administration", "Front Desk Executive"),
            ("security@acme.com", "Tony Security", Role.SECURITY, "Security", "Security Supervisor"),
            ("alice@acme.com", "Alice Johnson", Role.EMPLOYEE, "Engineering", "Senior Software Engineer"),
            ("bob@acme.com", "Bob Williams", Role.EMPLOYEE, "Sales", "Account Executive"),
            ("auditor@acme.com", "Grace Auditor", Role.AUDITOR, "Finance", "Internal Auditor"),
        ]
        for email, name, role, dept, desig in role_specs:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": name,
                    "role": role,
                    "organization": org,
                    "is_email_verified": True,
                },
            )
            # Idempotent: always reset the demo password so reseeding never breaks logins.
            user.set_password(DEMO_PASSWORD)
            user.save()
            users[role] = user
            Employee.objects.get_or_create(
                user=user, organization=org,
                defaults={
                    "employee_id": f"EMP-{role[:3].upper()}-{random.randint(100, 999)}",
                    "department": depts[dept],
                    "building": buildings[random.choice(list(buildings))],
                    "designation": desig,
                    "status": Employee.Status.ACTIVE,
                },
            )

        # Super admin (global, cross-tenant)
        super_user, created = User.objects.get_or_create(
            email="superadmin@securegate.io",
            defaults={"full_name": "Root Administrator", "role": Role.SUPER_ADMIN},
        )
        super_user.set_password(DEMO_PASSWORD)
        super_user.is_staff = True
        super_user.is_superuser = True
        super_user.is_email_verified = True
        super_user.save()

        # Visitor records + visits through the workflow
        today = timezone.localdate()
        now = timezone.now()
        host = users[Role.EMPLOYEE]
        reception = users[Role.RECEPTIONIST]
        security = users[Role.SECURITY]
        admin = users[Role.ORG_ADMIN]

        visit_flow = [
            VisitStatus.PENDING,
            VisitStatus.APPROVED,
            VisitStatus.CHECKED_IN,
            VisitStatus.CHECKED_OUT,
            VisitStatus.CHECKED_OUT,
            VisitStatus.REJECTED,
        ]

        for idx, (name, phone, company, purpose) in enumerate(SAMPLE_VISITORS):
            visitor, _ = Visitor.objects.get_or_create(
                phone=phone,
                defaults={
                    "full_name": name,
                    "email": f"{name.lower().replace(' ', '.')}@example.com",
                    "company": company,
                    "designation": "Manager",
                    "document_type": Visitor._meta.get_field("document_type").choices[idx % 4][0],
                    "document_number": f"DOC{1000000 + idx * 37}",
                    "vehicle_number": f"KA {20 + idx} AB {1000 + idx * 9}",
                    "vehicle_type": "CAR",
                    "emergency_contact": "Emergency Contact",
                    "emergency_phone": "9876500000",
                    "special_notes": "Please escort to meeting room.",
                },
            )

            status = visit_flow[idx % len(visit_flow)]
            days_ago = (idx % 14) - 7 if status == VisitStatus.CHECKED_OUT else -(idx % 3)
            visit_date = today - timedelta(days=days_ago)

            visit, _ = Visit.objects.get_or_create(
                visitor=visitor, organization=org, purpose=purpose, visit_date=visit_date,
                defaults={
                    "building": buildings[list(buildings)[idx % len(buildings)]],
                    "host": host,
                    "created_by": reception,
                    "expected_arrival": f"{(9 + idx % 9):02d}:30",
                    "expected_exit": "17:00",
                    "status": status,
                },
            )

            if status in (VisitStatus.APPROVED, VisitStatus.CHECKED_IN, VisitStatus.CHECKED_OUT):
                if not hasattr(visit, "qr_pass"):
                    approve_visit(visit, host)
            if status in (VisitStatus.CHECKED_IN, VisitStatus.CHECKED_OUT):
                check_in(visit, security, via_qr=True)
                visit.checked_in_at = now - timedelta(hours=1 + idx % 3)
                visit.save(update_fields=["checked_in_at"])
            if status == VisitStatus.CHECKED_OUT:
                check_out(visit, security)
                visit.checked_out_at = now - timedelta(hours=1)
                visit.save(update_fields=["checked_out_at"])
            if status == VisitStatus.REJECTED:
                from visits.services import reject_visit
                reject_visit(visit, host, "Scheduling conflict")

        # A blacklisted visitor
        bl_visitor, _ = Visitor.objects.get_or_create(
            phone="0000000000",
            defaults={"full_name": "John Doe", "company": "Unknown"},
        )
        Blacklist.objects.get_or_create(
            visitor=bl_visitor, reason="SECURITY_CONCERN", added_by=admin,
            defaults={"comment": "Suspected credential harvesting."},
        )

        AuditLog.objects.get_or_create(
            user=super_user, action="Demo data seeded", entity_type="System",
        )

        self.stdout.write(self.style.SUCCESS("Done! Demo accounts (password: %s):" % DEMO_PASSWORD))
        for email, label in [
            ("superadmin@securegate.io", "Super Admin"),
            ("admin@acme.com", "Organization Admin"),
            ("reception@acme.com", "Receptionist"),
            ("security@acme.com", "Security Guard"),
            ("alice@acme.com", "Employee (host)"),
            ("bob@acme.com", "Employee"),
            ("auditor@acme.com", "Auditor"),
        ]:
            self.stdout.write(f"  {label:24s} {email}")
