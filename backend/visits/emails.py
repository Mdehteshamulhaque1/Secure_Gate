"""Email delivery for the QR pass flow (single-use, signed QR)."""

import io

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from email.mime.image import MIMEImage

import qrcode

from .qrcodes import qr_payload


def qr_pass_png_bytes(visit, box_size=8):
    """Render the visit's signed QR pass as a PNG image (bytes)."""
    img = qrcode.make(qr_payload(visit.qr_pass), box_size=box_size)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def send_qr_pass_email(visit):
    """Email the QR pass to the visitor's address, if one is known.

    Returns True when an email was sent, False when there was nothing to send
    (no visitor email or no QR pass yet). Raises on SMTP failures so callers can
    log without breaking the approval workflow.
    """
    visitor = visit.visitor
    if not visitor.email:
        return False
    if not hasattr(visit, "qr_pass"):
        return False

    subject = f"Your SecureGate QR pass for {visit.visit_date}"
    html = render_to_string("visits/qr_pass_email.html", {"visit": visit})

    message = EmailMessage(
        subject=subject,
        body=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[visitor.email],
    )
    message.content_subtype = "html"

    image = MIMEImage(qr_pass_png_bytes(visit))
    image.add_header("Content-ID", "<qr_pass>")
    image["Content-Disposition"] = "inline; filename=qr-pass.png"
    message.attach(image)
    message.send()
    return True
