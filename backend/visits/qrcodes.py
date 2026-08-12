"""Helpers for QR generation and rendering."""

import base64
import io

import qrcode


def qr_payload(qr_pass):
    """What actually gets encoded into the QR (scanned later by security)."""
    return f"{qr_pass.token}|{qr_pass.signature}"


def qr_data_uri(payload, size=220, box_size=6):
    """Render a QR code as an inline base64 PNG data URI (no file needed)."""
    img = qrcode.make(payload, box_size=box_size)
    img = img.convert("RGB").resize((size, size))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
