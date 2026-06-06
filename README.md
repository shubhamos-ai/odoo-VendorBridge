# VendorBridge ERP

VendorBridge is a unified role-based Procurement and Vendor Management ERP platform. It connects organization officers, managers, and vendor partners through a traceable digital procurement cycle.

## Features
- **Role-Based Access Control**: Sandbox accounts for Admin, Procurement Officer, Manager/Approver, and Vendor.
- **RFQ Lifecycle**: Creation, line items customization, vendor bidding, and deadlines.
- **Bids Matrix**: Side-by-side quotation comparison panel displaying item levels and automatically highlighting the lowest total bid.
- **Approvals & Documents**: Manager approvals, automated Purchase Order issuance, and Invoice creation with browser print layout support.
- **SMTP Notification integrations**: Sends live notification emails to vendor contacts (falls back to simulation log inbox in UI if not configured).
- **Audit Logging**: Every workflow state transition is tracked in an immutable timeline log.

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy ORM, SQLite database, python-dotenv, smtplib.
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (variables, transitions, glassmorphic layout, print styling), Vanilla ES6 JS.

## Getting Started

### Prerequisites
Make sure Python 3.10+ is installed on your system.

### Installation & Run
1. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy python-dotenv --break-system-packages
   ```
2. Copy the example configuration to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
3. Run the application:
   ```bash
   python main.py
   ```
4. Open your browser and navigate to:
   **http://localhost:8000**

### Testing Sandbox Accounts
Quickly log in using the cheat-sheet shortcut buttons on the Login Screen:
- **Admin**: `admin@vendorbridge.com` (password: `admin123`)
- **Officer**: `officer@vendorbridge.com` (password: `officer123`)
- **Manager**: `manager@vendorbridge.com` (password: `manager123`)
- **Vendor (Acme)**: `john@acme.com` (password: `vendor123`)
