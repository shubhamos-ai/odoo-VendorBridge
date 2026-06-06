# VendorBridge – Procurement & Vendor Management

## What is this?

A minimal single‑page web app demonstrating a full procurement workflow (RFQ → Quotation → Purchase Order → Invoice). Built for the Odoo Hackathon, using pure HTML/CSS/JS frontend and FastAPI + SQLAlchemy backend (SQLite). Role‑based UI (Admin, Officer, Manager, Vendor).

## Key Features

- Login with role‑based redirects
- Dashboard with KPI cards
- Vendor list & CRUD
- RFQ creation, assignment, and status tracking
- Vendor portal to submit quotations
- Purchase order and invoice generation
- Activity log & mock email inbox
- Simple REST API (FastAPI) with Swagger UI

## Tech Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite
- **Optional:** Docker for containerised deployment

## Quick Start

```bash
# Clone the repository
git clone https://github.com/shubhamos-ai/odoo-VendorBridge.git
cd odoo-VendorBridge

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (defaults work)
cp .env.example .env

# Run the app (static only) or full stack
python -m http.server 8000 --directory static   # static demo
# OR
uvicorn main:app --reload                     # FastAPI + static files
```

Open `http://localhost:8000` in a browser.

## Data Seeding

When the server starts, `seed_data()` (called from `main.py`) automatically creates:
- **3 demo vendors**: Acme Industrial, Globex Tech, Apex General Supplies
- **4 demo users** with passwords:
  - Admin → `admin@vendorbridge.com` / `admin123`
  - Officer → `officer@vendorbridge.com` / `officer123`
  - Manager → `manager@vendorbridge.com` / `manager123`
  - Vendor (Acme) → `john@acme.com` / `vendor123`

These records are inserted into `vendor_bridge.db` on first run. Re‑run the app after deleting the DB file to reseed.

## Demo Accounts

| Role   | Email                     | Password |
|--------|---------------------------|----------|
| Admin   | admin@vendorbridge.com    | admin123 |
| Officer | officer@vendorbridge.com  | officer123 |
| Manager | manager@vendorbridge.com  | manager123 |
| Vendor (Acme) | john@acme.com          | vendor123 |

## UI Pages (SPA sections)

- `/login` – Login screen
- `/dashboard` – KPI overview
- `/vendors` – Manage vendors
- `/rfqs` – Create & view RFQs
- `/quotations` – Vendor quotations
- `/purchase_orders` – PO list
- `/invoices` – Invoice list
- `/logs` – Activity log
- `/emails` – Mock inbox
- `/about` – Team information

## API Overview (FastAPI)

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/login` | Returns mock JWT & user data |
| GET    | `/vendors` | List vendors |
| POST   | `/vendors` | Create a new vendor |
| GET    | `/rfqs` | List RFQs |
| POST   | `/rfqs` | Create a new RFQ |
| GET    | `/quotations` | List quotations |
| POST   | `/quotations` | Submit a quotation |
| GET    | `/purchase-orders` | List purchase orders |
| POST   | `/purchase-orders` | Generate PO from a quotation |
| GET    | `/invoices` | List invoices |
| POST   | `/invoices` | Generate an invoice |
| GET    | `/logs` | Activity log |
| GET    | `/emails` | Mock sent emails |

Swagger UI is available at `/api/docs`.

## Docker (optional)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
```

Build and run:

```bash
docker build -t vendorbridge .
docker run -p 8000:8000 vendorbridge
```

## Contributing

1. Fork the repository.
2. Create a branch `feature/<name>`.
3. Add tests (pytest for backend, Playwright for UI) if you add functionality.
4. Submit a Pull Request – CI will run linting, tests, and Docker build.

## License

MIT – see the `LICENSE` file.

---

*Happy hacking! 🎉*
