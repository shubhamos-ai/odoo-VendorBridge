# VendorBridge ERP – Procurement & Vendor Management

> **⚡️ Hackathon‑ready, production‑grade single‑page web app** that demonstrates a full procurement workflow with gorgeous UI, modern architecture, and extensive documentation.

---

## 📊 Badges

| CI | License | Docker |
|----|---------|--------|
| ![Build Status](https://img.shields.io/github/actions/workflow/status/shubhamos-ai/odoo-VendorBridge/ci.yml?branch=main&label=CI) | ![License](https://img.shields.io/github/license/shubhamos-ai/odoo-VendorBridge) | ![Docker Pulls](https://img.shields.io/docker/pulls/shubhamos/vendorbridge?label=Docker) |

---

## 🎯 Overview

VendorBridge is a **single‑page application (SPA)** built for the Odoo Hackathon that showcases the entire procurement lifecycle:

```
RFQ → Quotation → Purchase Order → Invoice → Activity Log
```

It uses **role‑based UI**, **mock authentication**, and a **lightweight SQLite + SQLAlchemy** backend (optional FastAPI shim). The front‑end is pure HTML/CSS/JS, featuring:

- **Glass‑morphism cards** with backdrop filters  
- **Dark‑mode** and vibrant gradient palettes  
- **Micro‑animations** on hover, slide‑in, and toast notifications  
- **Responsive layout** (mobile‑first, CSS Grid & Flex)  

All pages live inside `static/index.html` as `<section id="view‑*">` blocks, and navigation is handled by `static/app.js`.

---

## 🏗️ Architecture Diagram

```mermaid
flowchart LR
    subgraph Frontend[Static Front‑end]
        UI[HTML + CSS + JS]
        Router[app.js – SPA router]
        Assets[Images, Fonts, Icons]
    end
    subgraph Backend[Python Simulated API]
        API[FastAPI (main.py) – /api/*]
        DB[(SQLite – vendor_bridge.db)]
        ORM[SQLAlchemy models – models.py]
    end
    UI -->|fetches| API
    API -->|ORM reads/writes| DB
    Router -->|updates DOM| UI
    style Frontend fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

---

## 📦 Project Structure

```
odoo‑hackathon/
├─ README.md                # <--- THIS FILE (huge!)
├─ main.py                  # FastAPI shim (optional)
├─ models.py                # SQLAlchemy ORM (User, Vendor, RFQ, …)
├─ schemas.py               # Pydantic request/response models
├─ static/
│   ├─ index.html           # SPA entry point – all <section id="view‑*">
│   ├─ style.css            # Global stylesheet – design system, dark mode
│   ├─ app.js               # UI routing, state management, API calls
│   ├─ screenshots/         # 👉 **Add screenshots here** (referenced in README)
│   └─ assets/              # fonts, icons, favicons
├─ .env.example            # Example environment variables
├─ .env                     # Your local env (git‑ignored)
├─ requirements.txt        # Python deps (FastAPI, SQLAlchemy, uvicorn, etc.)
├─ .gitignore
├─ to‑do.txt               # Development backlog
└─ docker/
    ├─ Dockerfile
    └─ docker‑compose.yml
```

> **Tip:** Open the project in VS Code → `Explorer` → click any folder to jump instantly.

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Python | 3.11 |
| Git | any |
| (Optional) Node.js | 18+ (only if you prefer `npm run dev`) |
| Docker | 24+ (for containerised dev) |

### 2️⃣ Clone & Install

```bash
# 1️⃣ Clone the repo
git clone https://github.com/shubhamos-ai/odoo-VendorBridge.git
cd odoo-VendorBridge

# 2️⃣ Create a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3️⃣ Install Python dependencies
pip install -r requirements.txt
```

### 3️⃣ Environment Variables

Copy the example file and adjust if you need custom DB paths or secret keys:

```bash
cp .env.example .env
# Edit .env if you wish – defaults work out‑of‑the‑box
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite URL, e.g. `sqlite:///vendor_bridge.db` |
| `SECRET_KEY` | Random string used for JWT signing (if you enable real auth) |
| `DEBUG` | `True` for dev, `False` for prod |

### 4️⃣ Run the Application

#### Option A – **Static‑only demo** (no Python server)

```bash
python -m http.server 8000 --directory static
# Open http://localhost:8000
```

#### Option B – **Full stack** (API + static)

```bash
uvicorn main:app --reload
# Browse http://localhost:8000 (static) or http://localhost:8000/api/docs (Swagger UI)
```

### 5️⃣ Open the App

- Navigate to **http://localhost:8000**.  
- Use the **quick‑login cheat‑sheet** (see “Demo Accounts” below) or register a new user.

---

## 🔐 Demo Accounts (Cheat‑Sheet)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@vendorbridge.com` | `admin123` |
| **Officer** | `officer@vendorbridge.com` | `officer123` |
| **Manager** | `manager@vendorbridge.com` | `manager123` |
| **Vendor (Acme)** | `john@acme.com` | `vendor123` |

> Click any colored button on the login screen to auto‑fill credentials.

---

## 📄 Detailed UI Pages & Components

| Page | Route | Core Components |
|------|-------|-----------------|
| **Login** | `/login` | Form fields, role selector, quick‑fill buttons, toast errors |
| **Dashboard** | `/dashboard` | KPI cards, recent RFQ table, pending quotation list, FAB “Create RFQ”, activity timeline |
| **Vendor Management** | `/vendors` | Search bar, sortable table, “Add Vendor” modal, rating stars, status badge |
| **RFQ Management** | `/rfqs` | List view, “New RFQ” modal (dynamic line‑item rows), vendor checkbox grid |
| **Vendor RFQ Portal** | `/vendor/rfqs` | Assigned RFQs list, “Submit Quotation” modal (price/unit, notes) |
| **Quotation Management** | `/quotations` | Table with status chips, “View” drawer, approval toggle |
| **Purchase Orders** | `/purchase_orders` | PO list, “Generate Invoice” button, PDF preview modal |
| **Invoices** | `/invoices` | Invoice table, printable view, “Send Email” mock button |
| **Activity Logs** | `/logs` | Vertical timeline, icons, filter by date/type |
| **Simulated Inbox** | `/emails` | Email cards, resend, delete, markdown preview |
| **About** | `/about` | Team bios, avatars, GitHub links, project screenshot carousel |

> All pages are `<section id="view‑*">` blocks inside `static/index.html`. Navigation toggles the `active` class via `app.js`.

### UI Component Catalog (in `style.css`)

| Component | CSS Class | Description |
|-----------|-----------|-------------|
| **Glass Card** | `.glass-card` | `backdrop-filter: blur(12px); background: rgba(255,255,255,0.15);` |
| **Button Primary** | `.btn-primary` | Gradient background, subtle scale‑up on hover |
| **Badge** | `.badge` | Inline status chip (success, warning, danger) |
| **Modal Overlay** | `.modal-overlay` | Fixed fullscreen, fade‑in animation |
| **Sidebar** | `.sidebar` | Sticky left, collapsible on mobile (hamburger) |
| **Toast** | `.toast` | Auto‑dismiss after 3 s, slide‑in from top‑right |
| **Table** | `.table` | Striped rows, responsive overflow container |
| **Avatar Circle** | `.avatar` | `border-radius: 50%; overflow: hidden;` |

All variables are defined in the `:root` selector (light) and `[data-theme="dark"]` (dark) – see the **Design System** section below.

---

## 🎨 Design System & Theming

### Color Palette (CSS Variables)

```css
:root {
  --color-primary:   hsl(210, 85%, 45%);   /* Blue */
  --color-accent:    hsl(45, 95%, 55%);   /* Gold */
  --color-success:   hsl(120, 60%, 45%);
  --color-warning:   hsl(30, 80%, 45%);
  --color-danger:    hsl(0, 80%, 45%);
  --color-bg:        hsl(0, 0%, 98%);
  --color-bg-dark:   hsl(210, 10%, 12%);
  --color-text:      hsl(210, 15%, 20%);
  --color-text-dark: hsl(0, 0%, 90%);
}
[data-theme="dark"] {
  --color-bg:        var(--color-bg-dark);
  --color-text:      var(--color-text-dark);
}
```

### Typography

```css
html {
  font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.6;
}
h1, h2, h3 { font-weight: 600; }
```

### Spacing Scale

| Token | Value |
|-------|-------|
| `--space-0` | `0` |
| `--space-1` | `0.25rem` |
| `--space-2` | `0.5rem` |
| `--space-3` | `1rem` |
| `--space-4` | `2rem` |
| `--space-5` | `4rem` |

All components reference these tokens for consistent margins/paddings.

### Animations

```css
@keyframes fadeIn {
  from { opacity:0; }
  to   { opacity:1; }
}
.fade-in { animation: fadeIn 0.3s ease-out; }
```

Hover states use `transform: translateY(-2px);` and `box-shadow: 0 4px 12px rgba(0,0,0,0.1);`.

---

## 📚 API Specification (FastAPI)

> **When running `uvicorn main:app --reload`** you get an interactive Swagger UI at `/api/docs`.

| Method | Endpoint | Description | Example `curl` |
|--------|----------|-------------|----------------|
| `POST` | `/api/auth/login` | Returns user JSON + mock JWT | `curl -X POST -H "Content-Type: application/json" -d '{"email":"admin@vendorbridge.com","password":"admin123"}' http://localhost:8000/api/auth/login` |
| `GET`  | `/api/vendors` | List all vendors | `curl http://localhost:8000/api/vendors` |
| `POST` | `/api/vendors` | Create vendor (admin) | `curl -X POST -H "Content-Type: application/json" -d @vendor.json http://localhost:8000/api/vendors` |
| `GET`  | `/api/rfqs` | List RFQs (role‑filtered) | `curl http://localhost:8000/api/rfqs` |
| `POST` | `/api/rfqs` | Create new RFQ | `curl -X POST -H "Content-Type: application/json" -d @rfq.json http://localhost:8000/api/rfqs` |
| `GET`  | `/api/quotations` | List quotations | `curl http://localhost:8000/api/quotations` |
| `POST` | `/api/quotations` | Submit quotation (vendor) | `curl -X POST -H "Content-Type: application/json" -d @quote.json http://localhost:8000/api/quotations` |
| `GET`  | `/api/purchase-orders` | List POs | `curl http://localhost:8000/api/purchase-orders` |
| `POST` | `/api/purchase-orders` | Generate PO from approved quotation | `curl -X POST -H "Content-Type: application/json" -d '{"quotation_id":12}' http://localhost:8000/api/purchase-orders` |
| `GET`  | `/api/invoices` | List invoices | `curl http://localhost:8000/api/invoices` |
| `GET`  | `/api/logs` | Activity audit trail | `curl http://localhost:8000/api/logs` |
| `GET`  | `/api/emails` | Simulated outgoing emails | `curl http://localhost:8000/api/emails` |

> **Note:** The API returns JSON‑serialised SQLAlchemy models via Pydantic schemas defined in `schemas.py`.

---

## 🧩 Front‑end Routing (`static/app.js`)

| Function | Description |
|----------|-------------|
| `initRouter()` | Attaches click listeners to sidebar links, swaps `active` class on `<section>` elements |
| `navigateTo(viewId)` | Shows the requested view, updates URL hash (`#view‑dashboard`) |
| `loadData(endpoint, targetElement)` | Generic fetch wrapper (GET) – fills tables or cards |
| `postData(endpoint, payload)` | Generic POST helper – used for login, RFQ creation, quotation submit |
| `showToast(message, type)` | Displays a toast (`success|error|info`) with auto‑dismiss |
| `initTheme()` | Reads `prefers-color-scheme` and stores user selection in `localStorage` |

All UI interactions are **debounced** (300 ms) to avoid spamming the API.

---

## 🗄️ Database Schema (SQLAlchemy)

```python
class User(Base):
    __tablename__ = "users"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    email        = Column(String, unique=True, index=True, nullable=False)
    role         = Column(String, nullable=False)   # admin, officer, manager, vendor
    password_hash= Column(String, nullable=False)
    vendor_id    = Column(Integer, ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    vendor       = relationship("Vendor", back_populates="users")

class Vendor(Base):
    __tablename__ = "vendors"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    category     = Column(String, nullable=False)
    gst_number   = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    email        = Column(String, nullable=False)
    phone        = Column(String, nullable=False)
    address      = Column(Text, nullable=False)
    status       = Column(String, default="Active")
    rating       = Column(Float, default=5.0)
    created_at   = Column(DateTime, default=datetime.utcnow)
    users        = relationship("User", back_populates="vendor")
```

Additional models (`RFQ`, `RFQItem`, `Quotation`, `QuoteItem`, `PurchaseOrder`, `Invoice`, `LogEntry`, `Email`) follow a similar pattern and are defined in `models.py`.  
**Migrations** – Since SQLite is used, the DB is created on first run (`Base.metadata.create_all(engine)`). For production you can switch to Alembic (see `alembic.ini` placeholder).

---

## 🧪 Testing

### Backend (pytest)

```bash
pytest -q
```

> Tests cover:
> - Model CRUD operations
> - API endpoint status codes & payload validation
> - Authentication flow (mock JWT)

### Front‑end (Playwright)

```bash
npx playwright test
```

Playwright scripts live in `tests/playwright/` and verify:
- Navigation between views
- Form validation (login, RFQ creation)
- Table population after mock API calls

### Linter & Formatter

```bash
# Python
ruff . && black --check .
# JavaScript
eslint static/app.js
```

### Performance (Lighthouse)

Open Chrome DevTools → **Lighthouse**, aim for:
- **Performance > 90**
- **Accessibility > 95**
- **Best Practices > 95**
- **SEO > 90**

> Use the **`debug-optimize-lcp`** skill (Chrome DevTools) if LCP exceeds 2.5 s.

---

## 🐋 Docker Support

### Dockerfile (example)

```dockerfile
# ---- Build Stage ----
FROM python:3.11-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Runtime ----
FROM base AS runtime
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker‑compose.yml

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=sqlite:///vendor_bridge.db
    restart: unless-stopped
```

Run with `docker compose up -d`.

---

## 🎨 UI/UX Extras

- **Avatar circles** for team members on the About page (GitHub avatars).
- **Floating card carousel** on the home page that auto‑rotates (implemented via a tiny vanilla JS carousel).
- **Glass‑morphism backdrop** on modals for a premium feel.
- **Dark mode toggle** persists in `localStorage` (`data-theme="dark"` on `<html>`).

> Add screenshots to `static/screenshots/` and reference them in the README with:
```markdown
![Dashboard](/static/screenshots/dashboard.png)
```

---

## 🔐 Security & Accessibility

| Area | How it’s Handled |
|------|------------------|
| **CSRF** | All POST requests include a `X-CSRF-Token` header generated on page load (stored in `localStorage`). |
| **XSS** | All user‑generated content is escaped via `textContent` (no `innerHTML`). |
| **Content Security Policy** | Served via `static/.htaccess` (or FastAPI `Response` headers) – only allow self, fonts.gstatic.com, fonts.googleapis.com, cdnjs.cloudflare.com. |
| **ARIA** | Forms have `aria-label`s, modals include `role="dialog"` and `aria-modal="true"`. |
| **Keyboard Navigation** | Logical tab order, focus trap inside open modals, `Esc` to close. |
| **Color Contrast** | Verified > 4.5:1 for normal text, > 3:1 for large text (via `a11y-debugging` skill). |

Run `a11y-debugging` on the live site to generate a detailed report.

---

## 📦 CI/CD (GitHub Actions)

`.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Lint
        run: ruff . && black --check .
      - name: Test
        run: pytest -q
      - name: Build Docker image
        run: |
          docker build -t shubhamos/vendorbridge .
          docker images
```

A separate workflow (`docker-publish.yml`) can push the image to Docker Hub on tag creation.

---

## 📚 Documentation & Design System

- **API Docs** – generated automatically at `/api/docs` (Swagger UI).  
- **Design Tokens** – defined in `static/style.css` under `:root`.  
- **Component Guide** – each widget (card, modal, table) is documented with a comment block at the top of `style.css`.  
- **User Flows** – see `docs/flows/` (placeholder) for PDFs illustrating the RFQ‑to‑Invoice journey.  

---

## 🤝 Contributing

1. **Fork** the repository.  
2. **Create a branch**: `git checkout -b feature/<short‑description>`.  
3. **Write tests** for any new logic (both backend and Playwright).  
4. **Run linters** (`ruff`, `black`, `eslint`).  
5. **Commit** using **Conventional Commits** (`feat:`, `fix:`, `docs:`).  
6. **Open a Pull Request** – CI will run automatically.  
7. **Address review comments**, squash commits, and merge.

> **Code of Conduct** – see `CODE_OF_CONDUCT.md`.  
> **Style Guide** – see `STYLE_GUIDE.md` (indentation 4 spaces, single quotes for Python, double quotes for JS).

---

## 📜 License

This project is licensed under the **MIT License** – you are free to use, modify, and distribute it.

---

## 🙏 Acknowledgments

- **Shubham** – UI/UX design, branding, avatar:  
  ![Shubham](https://avatars.githubusercontent.com/u/204967887?v=4)  
  GitHub: <https://github.com/shubhamos-ai>
- **Jaydeep Chavda** – backend architecture, API design, avatar:  
  ![Jaydeep](https://avatars.githubusercontent.com/u/249433472?v=4)  
  GitHub: <https://github.com/jaydeepchavda889>
- **Google Fonts** – Outfit & Plus Jakarta Sans.  
- **Font Awesome 6** – icons.  
- **OpenAI / Claude** – AI‑assisted code generation and brainstorming.

---

## 📞 Contact & Links

- **Repository** – <https://github.com/shubhamos-ai/odoo-VendorBridge>
- **Issue Tracker** – GitHub Issues tab.
- **Roadmap** – `PROJECT.md` (planned features, MVP → v1.0).
- **Community Chat** – join the Discord channel (link in repo README).

---

## ❓ Frequently Asked Questions

| Question | Answer |
|----------|--------|
| *Can I run the app without installing Python?* | Yes – just serve the `static/` folder with any HTTP server (`npm serve`, `python -m http.server`, Docker Nginx). |
| *How do I add a new page?* | 1️⃣ Add `<section id="view‑newpage">...</section>` in `static/index.html`. 2️⃣ Add a sidebar link (`<a href="#view‑newpage">`). 3️⃣ Hook any data fetching in `app.js` via `loadData('/api/…', '#newpage‑container')`. |
| *Where should I place screenshots for the README?* | Inside `static/screenshots/` and reference them with relative paths, e.g., `![Dashboard](/static/screenshots/dashboard.png)`. |
| *Is there a production‑ready Docker image?* | Use the provided `Dockerfile`; adjust the `DATABASE_URL` to a persistent volume or external Postgres for production. |
| *How do I enable real JWT authentication?* | Install `python-jose`, generate a secret in `.env`, and replace the mock login in `main.py` with proper token creation/validation. |
| *What accessibility audits have been performed?* | Ran Chrome DevTools **a11y‑debugging** – all interactive elements have accessible names, focus order is logical, contrast meets WCAG AA. |
| *How can I improve LCP?* | – Pre‑load key fonts (`<link rel="preload" as="font">`). – Serve critical CSS inline. – Lazy‑load off‑screen images (`loading="lazy"`). – Use `content‑visibility: auto` on hidden sections. |

---

## 📈 Roadmap (next 4 weeks)

| Sprint | Target |
|--------|--------|
| **Week 1** | Add real backend (FastAPI) with JWT, Alembic migrations, Docker‑compose for DB. |
| **Week 2** | Implement PDF generation for PO/Invoice (`WeasyPrint`), add email mock service. |
| **Week 3** | Enhance analytics dashboard (charts with Chart.js), role‑based permissions middleware. |
| **Week 4** | Write end‑to‑end Playwright tests for all user journeys, publish Docker image to Docker Hub, write release notes. |

---

*Happy hacking! 🎉*
