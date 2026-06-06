import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional
from dotenv import load_dotenv
import datetime
import models
import schemas

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = os.getenv("SMTP_PORT", "587")
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")

DATABASE_URL = "sqlite:///./vendor_bridge.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="VendorBridge API")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_activity(db: Session, actor: str, action: str, entity_type: str, entity_id: int, details: str):
    log_entry = models.ActivityLog(
        actor_name=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log_entry)
    db.commit()

def send_email_notification(db: Session, to_email: str, subject: str, body: str):
    email_entry = models.Email(
        to_email=to_email,
        subject=subject,
        body=body
    )
    db.add(email_entry)
    db.commit()
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_FROM or SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            port = int(SMTP_PORT or 587)
            if port == 465:
                server = smtplib.SMTP_SSL(SMTP_HOST, port, timeout=10)
            else:
                server = smtplib.SMTP(SMTP_HOST, port, timeout=10)
                server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(msg['From'], to_email, msg.as_string())
            server.quit()
            print(f"Successfully sent email to {to_email} via SMTP")
        except Exception as e:
            print(f"Failed to send SMTP email: {e}")
            log_activity(db, "System", "SMTP Email Failure", "System", None, f"SMTP Error sending to {to_email}: {str(e)}")

def seed_data():
    db = SessionLocal()
    try:
        # Seed vendors and users only if empty
        if db.query(models.User).count() == 0:
            # Vendors
            v1 = models.Vendor(
                name="Acme Industrial Corp", category="Raw Materials",
                gst_number="27AAAAA1111A1Z1", contact_name="John Doe",
                email="john@acme.com", phone="+91 98765 43210",
                address="102 Acme Industrial Area, Pune, Maharashtra",
                status="Active", rating=4.8
            )
            v2 = models.Vendor(
                name="Globex Tech Solutions", category="IT Infrastructure",
                gst_number="27BBBBB2222B2Z2", contact_name="Alice Smith",
                email="alice@globex.com", phone="+91 98765 43211",
                address="404 Tech Park, Sector V, Salt Lake, Kolkata",
                status="Active", rating=4.5
            )
            v3 = models.Vendor(
                name="Apex General Supplies", category="Office Stationery",
                gst_number="27CCCCC3333C3Z3", contact_name="Bob Johnson",
                email="bob@apex.com", phone="+91 98765 43212",
                address="12 Main Market Road, New Delhi",
                status="Active", rating=4.2
            )
            db.add_all([v1, v2, v3])
            db.commit()

            # Users
            admin = models.User(
                name="Admin User", email="admin@vendorbridge.com",
                role="admin", password_hash="admin123"
            )
            officer = models.User(
                name="Officer Shubh", email="officer@vendorbridge.com",
                role="officer", password_hash="officer123"
            )
            manager = models.User(
                name="Manager Sarah", email="manager@vendorbridge.com",
                role="manager", password_hash="manager123"
            )
            vendor_user1 = models.User(
                name="Acme Portal", email="john@acme.com",
                role="vendor", password_hash="vendor123", vendor_id=v1.id
            )
            vendor_user2 = models.User(
                name="Globex Portal", email="alice@globex.com",
                role="vendor", password_hash="vendor123", vendor_id=v2.id
            )
            vendor_user3 = models.User(
                name="Apex Portal", email="bob@apex.com",
                role="vendor", password_hash="vendor123", vendor_id=v3.id
            )
            db.add_all([admin, officer, manager, vendor_user1, vendor_user2, vendor_user3])
            db.commit()
            log_activity(db, "System", "Database Seeded", "System", None, "Initial data and roles created successfully.")
            # Seed a sample RFQ workflow if none exist
            if db.query(models.RFQ).count() == 0:
                # Create RFQ
                rfq = models.RFQ(
                    title="Procure 100 Laptops",
                    description="Need 100 high‑performance laptops for new hires.",
                    deadline="2026-07-15",
                    status="Sent"
                )
                # Assign all vendors to the RFQ
                rfq.vendors = db.query(models.Vendor).all()
                # RFQ item
                item = models.RFQItem(
                    item_name="Laptop Model X",
                    description="15‑inch, 16GB RAM, 512GB SSD",
                    quantity=100,
                    unit="pcs"
                )
                rfq.items.append(item)
                db.add(rfq)
                db.commit()
                db.refresh(rfq)
                log_activity(db, "Officer Shubh", f"Created RFQ #{rfq.id}", "RFQ", rfq.id, "Sent to all vendors.")

                # Create a quotation from the first vendor
                quotation = models.Quotation(
                    rfq_id=rfq.id,
                    vendor_id=v1.id,
                    delivery_timeline=30,
                    notes="Delivery within 30 days.",
                    status="Submitted",
                    submitted_at=datetime.datetime.utcnow()
                )
                db.add(quotation)
                db.commit()
                db.refresh(quotation)
                # Quotation line item
                q_item = models.QuotationItem(
                    quotation_id=quotation.id,
                    rfq_item_id=item.id,
                    unit_price=55000.0,
                    quantity=100,
                    line_total=5500000.0
                )
                db.add(q_item)
                db.commit()
                log_activity(db, "Vendor Acme", f"Submitted quotation #{quotation.id}", "Quotation", quotation.id, "Total 5,500,000 INR")

                # Approval by manager
                approval = models.Approval(
                    quotation_id=quotation.id,
                    approver_id=manager.id,
                    decision="Approved",
                    remarks="All good"
                )
                db.add(approval)
                db.commit()
                log_activity(db, "Manager Sarah", f"Approved quotation #{quotation.id}", "Approval", approval.id, "Proceed to PO")

                # Generate Purchase Order
                po = models.PurchaseOrder(
                    po_number=f"PO-{random.randint(100000, 999999)}",
                    quotation_id=quotation.id,
                    vendor_id=v1.id,
                    subtotal=quotation.total_amount if quotation.total_amount else 5500000.0,
                    tax=round((quotation.total_amount if quotation.total_amount else 5500000.0) * 0.18, 2),
                    total=round((quotation.total_amount if quotation.total_amount else 5500000.0) * 1.18, 2),
                    status="Sent"
                )
                db.add(po)
                db.commit()
                db.refresh(po)
                log_activity(db, "Officer Shubh", f"Generated PO {po.po_number}", "PurchaseOrder", po.id, "Sent to vendor.")

                # Create Invoice
                invoice = models.Invoice(
                    invoice_number=f"INV-{random.randint(100000, 999999)}",
                    po_id=po.id,
                    subtotal=po.subtotal,
                    tax=po.tax,
                    total=po.total,
                    status="Draft"
                )
                db.add(invoice)
                db.commit()
                db.refresh(invoice)
                log_activity(db, "Officer Shubh", f"Created Invoice {invoice.invoice_number}", "Invoice", invoice.id, "Draft ready.")

                # Record an email entry (real email entry)
                email_entry = models.Email(
                    to_email=v1.email,
                    subject=f"Purchase Order {po.po_number} Issued",
                    body=f"Dear {v1.contact_name},\n\nYour purchase order {po.po_number} has been issued. Total amount INR {po.total:.2f}.\n\nRegards,\nProcurement Team"
                )
                db.add(email_entry)
                db.commit()
                log_activity(db, "System", "Email Sent", "Email", email_entry.id, f"PO email sent to {v1.email}")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_data()

@app.post("/api/auth/login")
def login(login_data: dict, db: Session = Depends(get_db)):
    email = login_data.get("email")
    password = login_data.get("password")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.password_hash != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "vendor_id": user.vendor_id}

@app.get("/api/vendors", response_model=List[schemas.VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).all()

@app.post("/api/vendors", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    db_vendor = models.Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    log_activity(db, "Admin", f"Created Vendor: {db_vendor.name}", "Vendor", db_vendor.id, f"Category: {db_vendor.category}")
    return db_vendor

@app.put("/api/vendors/{vendor_id}", response_model=schemas.VendorResponse)
def update_vendor(vendor_id: int, vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor.dict().items():
        setattr(db_vendor, key, value)
    db.commit()
    db.refresh(db_vendor)
    log_activity(db, "Admin", f"Updated Vendor: {db_vendor.name}", "Vendor", db_vendor.id, "Profile modified.")
    return db_vendor

@app.get("/api/rfqs", response_model=List[schemas.RFQResponse])
def get_rfqs(vendor_id: Optional[int] = None, db: Session = Depends(get_db)):
    if vendor_id:
        return db.query(models.RFQ).join(models.RFQ.vendors).filter(models.Vendor.id == vendor_id).all()
    return db.query(models.RFQ).all()

@app.get("/api/rfqs/{rfq_id}", response_model=schemas.RFQResponse)
def get_rfq(rfq_id: int, db: Session = Depends(get_db)):
    rfq = db.query(models.RFQ).filter(models.RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq

@app.post("/api/rfqs", response_model=schemas.RFQResponse)
def create_rfq(rfq_in: schemas.RFQCreate, db: Session = Depends(get_db)):
    db_rfq = models.RFQ(
        title=rfq_in.title,
        description=rfq_in.description,
        deadline=rfq_in.deadline,
        status="Sent"
    )
    vendors = db.query(models.Vendor).filter(models.Vendor.id.in_(rfq_in.vendor_ids)).all()
    db_rfq.vendors = vendors
    db.add(db_rfq)
    db.commit()
    db.refresh(db_rfq)
    for item in rfq_in.items:
        db_item = models.RFQItem(rfq_id=db_rfq.id, **item.dict())
        db.add(db_item)
    db.commit()
    db.refresh(db_rfq)
    log_activity(db, "Procurement Officer", f"Created and Published RFQ: {db_rfq.title}", "RFQ", db_rfq.id, f"Assigned to {len(vendors)} vendors.")
    for vendor in vendors:
        send_email_notification(
            db,
            to_email=vendor.email,
            subject=f"New Invitation to Bid: {db_rfq.title}",
            body=f"Dear {vendor.contact_name},\n\nYou have been invited to submit a quotation for '{db_rfq.title}'. Deadline is {db_rfq.deadline}.\n\nBest regards,\nProcurement Team"
        )
    return db_rfq

@app.get("/api/quotations", response_model=List[schemas.QuotationResponse])
def get_quotations(rfq_id: Optional[int] = None, vendor_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Quotation)
    if rfq_id:
        query = query.filter(models.Quotation.rfq_id == rfq_id)
    if vendor_id:
        query = query.filter(models.Quotation.vendor_id == vendor_id)
    return query.all()

@app.post("/api/quotations", response_model=schemas.QuotationResponse)
def create_quotation(quote_in: schemas.QuotationCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Quotation).filter(
        models.Quotation.rfq_id == quote_in.rfq_id,
        models.Quotation.vendor_id == quote_in.vendor_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
    db_quote = models.Quotation(
        rfq_id=quote_in.rfq_id,
        vendor_id=quote_in.vendor_id,
        delivery_timeline=quote_in.delivery_timeline,
        notes=quote_in.notes,
        status="Submitted",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    total = 0.0
    for item in quote_in.items:
        line_total = item.unit_price * item.quantity
        total += line_total
        db_item = models.QuotationItem(
            quotation_id=db_quote.id,
            rfq_item_id=item.rfq_item_id,
            unit_price=item.unit_price,
            quantity=item.quantity,
            line_total=line_total
        )
        db.add(db_item)
    db_quote.total_amount = total
    db.commit()
    db.refresh(db_quote)
    vendor = db.query(models.Vendor).filter(models.Vendor.id == quote_in.vendor_id).first()
    vendor_name = vendor.name if vendor else "Vendor"
    log_activity(db, vendor_name, f"Submitted Quotation for RFQ #{db_quote.rfq_id}", "Quotation", db_quote.id, f"Total Quote: INR {total:.2f}")
    return db_quote

@app.post("/api/quotations/{quote_id}/approve")
def approve_quotation(quote_id: int, approval_in: schemas.ApprovalCreate, db: Session = Depends(get_db)):
    quote = db.query(models.Quotation).filter(models.Quotation.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    quote.status = "Approved" if approval_in.decision == "Approved" else "Rejected"
    db_approval = models.Approval(
        quotation_id=quote.id,
        approver_id=3,
        decision=approval_in.decision,
        remarks=approval_in.remarks
    )
    db.add(db_approval)
    if approval_in.decision == "Approved":
        other_quotes = db.query(models.Quotation).filter(
            models.Quotation.rfq_id == quote.rfq_id,
            models.Quotation.id != quote.id
        ).all()
        for o_quote in other_quotes:
            o_quote.status = "Rejected"
        rfq = db.query(models.RFQ).filter(models.RFQ.id == quote.rfq_id).first()
        if rfq:
            rfq.status = "Closed"
    db.commit()
    log_activity(
        db, "Manager Sarah",
        f"{approval_in.decision} Quotation #{quote.id}",
        "Quotation", quote.id,
        f"Remarks: {approval_in.remarks or 'None'}"
    )
    return {"message": f"Quotation status updated to {quote.status}"}

@app.get("/api/purchase-orders", response_model=List[schemas.PurchaseOrderResponse])
def get_purchase_orders(vendor_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.PurchaseOrder)
    if vendor_id:
        query = query.filter(models.PurchaseOrder.vendor_id == vendor_id)
    return query.all()

@app.post("/api/purchase-orders", response_model=schemas.PurchaseOrderResponse)
def generate_purchase_order(data: dict, db: Session = Depends(get_db)):
    quotation_id = data.get("quotation_id")
    quote = db.query(models.Quotation).filter(models.Quotation.id == quotation_id).first()
    if not quote or quote.status != "Approved":
        raise HTTPException(status_code=400, detail="Only approved quotations can generate a PO.")
    po_num = f"PO-{random.randint(100000, 999999)}"
    subtotal = quote.total_amount
    tax = round(subtotal * 0.18, 2)
    total = subtotal + tax
    db_po = models.PurchaseOrder(
        po_number=po_num,
        quotation_id=quote.id,
        vendor_id=quote.vendor_id,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="Sent"
    )
    db.add(db_po)
    quote.status = "PO Generated"
    db.commit()
    db.refresh(db_po)
    log_activity(db, "Procurement Officer", f"Generated Purchase Order {po_num}", "PurchaseOrder", db_po.id, f"Total: INR {total:.2f}")
    vendor = db.query(models.Vendor).filter(models.Vendor.id == quote.vendor_id).first()
    if vendor:
        send_email_notification(
            db,
            to_email=vendor.email,
            subject=f"Purchase Order Issued: {po_num}",
            body=f"Dear {vendor.contact_name},\n\nWe have issued Purchase Order {po_num} for your approved quotation. Details:\nTotal: INR {total:.2f}\n\nBest regards,\nProcurement Team"
        )
    return db_po

@app.get("/api/invoices", response_model=List[schemas.InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(models.Invoice).all()

@app.post("/api/invoices", response_model=schemas.InvoiceResponse)
def generate_invoice(data: dict, db: Session = Depends(get_db)):
    po_id = data.get("po_id")
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    invoice_num = f"INV-{random.randint(100000, 999999)}"
    db_invoice = models.Invoice(
        invoice_number=invoice_num,
        po_id=po.id,
        subtotal=po.subtotal,
        tax=po.tax,
        total=po.total,
        status="Draft"
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    log_activity(db, "Procurement Officer", f"Generated Invoice {invoice_num}", "Invoice", db_invoice.id, f"PO reference: {po.po_number}")
    return db_invoice

@app.post("/api/invoices/{invoice_id}/email")
def email_invoice(invoice_id: int, data: dict, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    to_email = data.get("email")
    if not to_email:
        raise HTTPException(status_code=400, detail="Recipient email required")
    invoice.emailed_to = to_email
    invoice.status = "Sent"
    db.commit()
    send_email_notification(
        db,
        to_email=to_email,
        subject=f"Invoice Issued: {invoice.invoice_number}",
        body=f"Hello,\n\nPlease find attached the Invoice {invoice.invoice_number} referencing purchase order details.\nTotal Amount due: INR {invoice.total:.2f}\n\nRegards,\nAccounts Team"
    )
    log_activity(db, "System", f"Emailed Invoice {invoice.invoice_number} to {to_email}", "Invoice", invoice.id, "")
    return {"message": f"Invoice successfully emailed to {to_email}"}

@app.get("/api/logs", response_model=List[schemas.ActivityLogResponse])
def get_logs(db: Session = Depends(get_db)):
    return db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).all()

@app.get("/api/emails", response_model=List[schemas.EmailResponse])
def get_emails(db: Session = Depends(get_db)):
    return db.query(models.Email).order_by(models.Email.sent_at.desc()).all()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
