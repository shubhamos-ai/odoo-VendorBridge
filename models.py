import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Table, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Junction Table for RFQ and Vendor
rfq_vendor_association = Table(
    'rfq_vendor_association',
    Base.metadata,
    Column('rfq_id', Integer, ForeignKey('rfqs.id', ondelete='CASCADE'), primaryKey=True),
    Column('vendor_id', Integer, ForeignKey('vendors.id', ondelete='CASCADE'), primaryKey=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primaryKey=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # admin, officer, manager, vendor
    password_hash = Column(String, nullable=False)
    vendor_id = Column(Integer, ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vendor = relationship("Vendor", back_populates="users")

class Vendor(Base):
    __tablename__ = 'vendors'
    
    id = Column(Integer, primaryKey=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    gst_number = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    status = Column(String, default="Active")  # Active, Inactive
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="vendor")
    rfqs = relationship("RFQ", secondary=rfq_vendor_association, back_populates="vendors")
    quotations = relationship("Quotation", back_populates="vendor")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")

class RFQ(Base):
    __tablename__ = 'rfqs'
    
    id = Column(Integer, primaryKey=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(String, nullable=False)  # YYYY-MM-DD
    status = Column(String, default="Draft")  # Draft, Sent, Closed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey('users.id'))

    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete-orphan")
    vendors = relationship("Vendor", secondary=rfq_vendor_association, back_populates="rfqs")
    quotations = relationship("Quotation", back_populates="rfq")

class RFQItem(Base):
    __tablename__ = 'rfq_items'
    
    id = Column(Integer, primaryKey=True, index=True)
    rfq_id = Column(Integer, ForeignKey('rfqs.id', ondelete='CASCADE'), nullable=False)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # pcs, kg, ltr, etc.

    rfq = relationship("RFQ", back_populates="items")
    quotation_items = relationship("QuotationItem", back_populates="rfq_item", cascade="all, delete-orphan")

class Quotation(Base):
    __tablename__ = 'quotations'
    
    id = Column(Integer, primaryKey=True, index=True)
    rfq_id = Column(Integer, ForeignKey('rfqs.id', ondelete='CASCADE'), nullable=False)
    vendor_id = Column(Integer, ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False)
    status = Column(String, default="Draft")  # Draft, Submitted, Shortlisted, Approved, Rejected
    delivery_timeline = Column(Integer, nullable=False)  # in days
    notes = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0)
    submitted_at = Column(DateTime, nullable=True)

    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    approval = relationship("Approval", uselist=False, back_populates="quotation")
    purchase_orders = relationship("PurchaseOrder", back_populates="quotation")

class QuotationItem(Base):
    __tablename__ = 'quotation_items'
    
    id = Column(Integer, primaryKey=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    rfq_item_id = Column(Integer, ForeignKey('rfq_items.id', ondelete='CASCADE'), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)

    quotation = relationship("Quotation", back_populates="items")
    rfq_item = relationship("RFQItem", back_populates="quotation_items")

class Approval(Base):
    __tablename__ = 'approvals'
    
    id = Column(Integer, primaryKey=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    approver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    decision = Column(String, nullable=False)  # Approved, Rejected
    remarks = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)

    quotation = relationship("Quotation", back_populates="approval")

class PurchaseOrder(Base):
    __tablename__ = 'purchase_orders'
    
    id = Column(Integer, primaryKey=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey('quotations.id'), nullable=False)
    vendor_id = Column(Integer, ForeignKey('vendors.id'), nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, default="Draft")  # Draft, Sent, Accepted, Completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    quotation = relationship("Quotation", back_populates="purchase_orders")
    vendor = relationship("Vendor", back_populates="purchase_orders")
    invoices = relationship("Invoice", back_populates="purchase_order")

class Invoice(Base):
    __tablename__ = 'invoices'
    
    id = Column(Integer, primaryKey=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    po_id = Column(Integer, ForeignKey('purchase_orders.id'), nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, default="Draft")  # Draft, Sent, Paid
    emailed_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="invoices")

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primaryKey=True, index=True)
    actor_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)  # User, Vendor, RFQ, Quotation, PO, Invoice
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SimulatedEmail(Base):
    __tablename__ = 'simulated_emails'
    
    id = Column(Integer, primaryKey=True, index=True)
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
