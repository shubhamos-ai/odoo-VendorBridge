from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    vendor_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    category: str
    gst_number: str
    contact_name: str
    email: str
    phone: str
    address: str
    status: Optional[str] = "Active"
    rating: Optional[float] = 5.0

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# RFQ Item Schemas
class RFQItemBase(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit: str

class RFQItemCreate(RFQItemBase):
    pass

class RFQItemResponse(RFQItemBase):
    id: int
    rfq_id: int
    class Config:
        from_attributes = True

# RFQ Schemas
class RFQBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: str
    status: Optional[str] = "Draft"

class RFQCreate(RFQBase):
    items: List[RFQItemCreate]
    vendor_ids: List[int]

class RFQResponse(RFQBase):
    id: int
    created_at: datetime
    created_by_id: Optional[int]
    items: List[RFQItemResponse] = []
    vendors: List[VendorResponse] = []
    class Config:
        from_attributes = True

# Quotation Item Schemas
class QuotationItemBase(BaseModel):
    rfq_item_id: int
    unit_price: float
    quantity: float

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItemResponse(QuotationItemBase):
    id: int
    quotation_id: int
    line_total: float
    class Config:
        from_attributes = True

# Quotation Schemas
class QuotationBase(BaseModel):
    delivery_timeline: int
    notes: Optional[str] = None

class QuotationCreate(QuotationBase):
    rfq_id: int
    vendor_id: int
    items: List[QuotationItemCreate]

class QuotationResponse(QuotationBase):
    id: int
    rfq_id: int
    vendor_id: int
    status: str
    total_amount: float
    submitted_at: Optional[datetime]
    items: List[QuotationItemResponse] = []
    vendor: Optional[VendorResponse] = None
    class Config:
        from_attributes = True

# Approval Schemas
class ApprovalCreate(BaseModel):
    decision: str  # Approved, Rejected
    remarks: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: int
    quotation_id: int
    approver_id: int
    decision: str
    remarks: Optional[str]
    decided_at: datetime
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    quotation_id: int
    vendor_id: int
    subtotal: float
    tax: float
    total: float
    status: str
    created_at: datetime
    vendor: Optional[VendorResponse] = None
    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    po_id: int
    subtotal: float
    tax: float
    total: float
    status: str
    emailed_to: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogResponse(BaseModel):
    id: int
    actor_name: str
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Email Schema
class EmailResponse(BaseModel):
    id: int
    to_email: str
    subject: str
    body: str
    sent_at: datetime
    class Config:
        from_attributes = True
