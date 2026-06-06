// Global Application State
let currentUser = null;

// Available Mock roles mapping (used for the developer switcher widget)
const mockRoles = {
    'admin': { id: 1, name: "Admin User", email: "admin@vendorbridge.com", role: "admin", vendor_id: null },
    'officer': { id: 2, name: "Officer Shubh", email: "officer@vendorbridge.com", role: "officer", vendor_id: null },
    'manager': { id: 3, name: "Manager Sarah", email: "manager@vendorbridge.com", role: "manager", vendor_id: null },
    'vendor-1': { id: 4, name: "Acme Portal", email: "john@acme.com", role: "vendor", vendor_id: 1 },
    'vendor-2': { id: 5, name: "Globex Portal", email: "alice@globex.com", role: "vendor", vendor_id: 2 },
    'vendor-3': { id: 6, name: "Apex Portal", email: "bob@apex.com", role: "vendor", vendor_id: 3 }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    setupRouter();
    setupRoleSwitcher();
    setupEventListeners();
    setupLoginHandler();
});

// Check local storage session
function checkSession() {
    const savedUser = localStorage.getItem("vendorbridge_user");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        unlockApp();
    } else {
        lockApp();
    }
}

// Lock application (show login screen)
function lockApp() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("app").style.display = "none";
}

// Unlock application
function unlockApp() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    
    // Update User UI layout
    document.getElementById("user-name").innerText = currentUser.name;
    document.getElementById("user-role").innerText = currentUser.role;
    document.getElementById("user-avatar").innerText = currentUser.name.split(" ").map(w => w[0]).join("");
    
    // Set switcher dropdown to correct state
    const selector = document.getElementById("role-select");
    if (currentUser.role === 'vendor') {
        if (currentUser.vendor_id === 1) selector.value = 'vendor-1';
        else if (currentUser.vendor_id === 2) selector.value = 'vendor-2';
        else if (currentUser.vendor_id === 3) selector.value = 'vendor-3';
    } else {
        selector.value = currentUser.role;
    }

    updateVisibilityForRole();
    loadCurrentView();
}

// Quick fill function
function quickFillLogin(email, password) {
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;
}

// 1. Setup Auth and Logins
function setupLoginHandler() {
    const form = document.getElementById("form-login");
    const errorMsg = document.getElementById("login-error-msg");
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMsg.style.display = "none";
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            
            if (res.ok) {
                const data = await res.json();
                currentUser = data;
                localStorage.setItem("vendorbridge_user", JSON.stringify(currentUser));
                unlockApp();
            } else {
                const err = await res.json();
                errorMsg.innerText = err.detail || "Authentication failed.";
                errorMsg.style.display = "block";
            }
        } catch(err) {
            console.error("Login request error:", err);
            errorMsg.innerText = "Connection error. Please check backend.";
            errorMsg.style.display = "block";
        }
    });

    // Logout
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("vendorbridge_user");
        currentUser = null;
        lockApp();
    });
}

// 2. Client-Side Router
function setupRouter() {
    window.addEventListener("hashchange", () => {
        if (currentUser) loadCurrentView();
    });
}

function loadCurrentView() {
    const hash = window.location.hash || "#dashboard";
    const views = document.querySelectorAll(".app-view");
    const menuItems = document.querySelectorAll(".menu-item");
    
    // Hide all views
    views.forEach(v => v.classList.remove("active"));
    menuItems.forEach(item => item.classList.remove("active"));
    
    // Normalize target view name
    const viewId = `view-${hash.replace("#", "")}`;
    const targetView = document.getElementById(viewId);
    
    if (targetView) {
        targetView.classList.add("active");
        
        const navItem = document.getElementById(`nav-${hash.replace("#", "")}`);
        if (navItem) navItem.classList.add("active");
        
        const titleMap = {
            "#dashboard": "Procurement Overview",
            "#vendors": "Vendor Partner Directory",
            "#rfqs": "Requests for Quotation (RFQ)",
            "#quotations": "Quotation Submissions",
            "#purchase_orders": "Purchase Orders (PO)",
            "#invoices": "Invoices Ledger",
            "#logs": "System Audit Trail",
            "#emails": "Simulated Email Server Log"
        };
        document.getElementById("page-title").innerText = titleMap[hash] || "VendorBridge";
        
        triggerDataLoader(hash);
    }
}

// Data Loaders Dispatcher
function triggerDataLoader(hash) {
    switch(hash) {
        case "#dashboard":
            loadDashboard();
            break;
        case "#vendors":
            loadVendors();
            break;
        case "#rfqs":
            loadRFQs();
            break;
        case "#quotations":
            loadQuotations();
            break;
        case "#purchase_orders":
            loadPurchaseOrders();
            break;
        case "#invoices":
            loadInvoices();
            break;
        case "#logs":
            loadLogs();
            break;
        case "#emails":
            loadEmails();
            break;
    }
}

// User & Role Switching Dropdown
function setupRoleSwitcher() {
    const selector = document.getElementById("role-select");
    selector.addEventListener("change", (e) => {
        const selectedKey = e.target.value;
        currentUser = mockRoles[selectedKey];
        
        // Update Local Storage
        localStorage.setItem("vendorbridge_user", JSON.stringify(currentUser));
        
        // Update User UI layout
        document.getElementById("user-name").innerText = currentUser.name;
        document.getElementById("user-role").innerText = currentUser.role;
        document.getElementById("user-avatar").innerText = currentUser.name.split(" ").map(w => w[0]).join("");
        
        updateVisibilityForRole();
        loadCurrentView();
    });
}

function updateVisibilityForRole() {
    if (!currentUser) return;
    const isOfficer = currentUser.role === 'officer';
    const isAdmin = currentUser.role === 'admin';
    const isVendor = currentUser.role === 'vendor';
    
    document.getElementById("btn-add-vendor-modal").style.display = isAdmin ? "inline-flex" : "none";
    document.getElementById("btn-create-rfq-modal").style.display = isOfficer ? "inline-flex" : "none";
    document.getElementById("quotations-vendor-banner").style.display = isVendor ? "block" : "none";
}

// Data Loaders & API Functions
async function loadDashboard() {
    try {
        const rfqsRes = await fetch("/api/rfqs");
        const rfqs = await rfqsRes.json();
        
        const vendorsRes = await fetch("/api/vendors");
        const vendors = await vendorsRes.json();
        
        const posRes = await fetch("/api/purchase-orders");
        const pos = await posRes.json();
        
        const quotesRes = await fetch("/api/quotations");
        const quotes = await quotesRes.json();

        // Render KPI metrics
        const kpiGrid = document.getElementById("kpi-cards");
        kpiGrid.innerHTML = `
            <div class="kpi-card">
                <div>
                    <div class="kpi-label">Active Vendors</div>
                    <div class="kpi-value">${vendors.length}</div>
                </div>
                <div class="kpi-icon"><i class="fa-solid fa-handshake"></i></div>
            </div>
            <div class="kpi-card">
                <div>
                    <div class="kpi-label">Active RFQs</div>
                    <div class="kpi-value">${rfqs.filter(r => r.status === 'Sent').length}</div>
                </div>
                <div class="kpi-icon"><i class="fa-solid fa-file-invoice"></i></div>
            </div>
            <div class="kpi-card">
                <div>
                    <div class="kpi-label">Pending Quotes</div>
                    <div class="kpi-value">${quotes.filter(q => q.status === 'Submitted').length}</div>
                </div>
                <div class="kpi-icon"><i class="fa-solid fa-file-signature"></i></div>
            </div>
            <div class="kpi-card">
                <div>
                    <div class="kpi-label">Approved POs</div>
                    <div class="kpi-value">${pos.length}</div>
                </div>
                <div class="kpi-icon"><i class="fa-solid fa-file-contract"></i></div>
            </div>
        `;

        // Render recent active RFQs list
        const dashRFQBody = document.getElementById("dash-rfqs-body");
        dashRFQBody.innerHTML = "";
        rfqs.slice(-5).reverse().forEach(rfq => {
            dashRFQBody.innerHTML += `
                <tr>
                    <td>#RFQ-${rfq.id}</td>
                    <td><strong>${rfq.title}</strong></td>
                    <td>${rfq.deadline}</td>
                    <td><span class="badge badge-${rfq.status.toLowerCase()}">${rfq.status}</span></td>
                </tr>
            `;
        });

        // Render pending approvals list
        const dashApprovalsBody = document.getElementById("dash-approvals-body");
        dashApprovalsBody.innerHTML = "";
        const pendingQuotes = quotes.filter(q => q.status === 'Submitted');
        
        if (pendingQuotes.length === 0) {
            dashApprovalsBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No pending quotations to approve.</td></tr>`;
        } else {
            pendingQuotes.slice(0, 5).forEach(q => {
                const rfq = rfqs.find(r => r.id === q.rfq_id);
                dashApprovalsBody.innerHTML += `
                    <tr>
                        <td>#Q-${q.id}</td>
                        <td>${rfq ? rfq.title : 'Unknown RFQ'}</td>
                        <td>${q.vendor ? q.vendor.name : 'Unknown Vendor'}</td>
                        <td><strong>INR ${q.total_amount.toLocaleString()}</strong></td>
                        <td>
                            <a href="#quotations" class="btn btn-secondary btn-sm"><i class="fa-solid fa-eye"></i> View</a>
                        </td>
                    </tr>
                `;
            });
        }
    } catch(err) {
        console.error("Dashboard Loading Error:", err);
    }
}

async function loadVendors() {
    try {
        const res = await fetch("/api/vendors");
        const vendors = await res.json();
        const body = document.getElementById("vendors-list-body");
        body.innerHTML = "";
        
        vendors.forEach(v => {
            body.innerHTML += `
                <tr>
                    <td><strong>${v.name}</strong></td>
                    <td>${v.category}</td>
                    <td><code>${v.gst_number}</code></td>
                    <td>${v.contact_name}</td>
                    <td>${v.email}</td>
                    <td>${v.phone}</td>
                    <td><span class="badge badge-active">${v.status}</span></td>
                    <td><i class="fa-solid fa-star text-warning"></i> ${v.rating.toFixed(1)} / 5.0</td>
                </tr>
            `;
        });
    } catch(err) {
        console.error("Vendors Load Error:", err);
    }
}

async function loadRFQs() {
    try {
        let url = "/api/rfqs";
        if (currentUser.role === 'vendor') {
            url += `?vendor_id=${currentUser.vendor_id}`;
        }
        
        const res = await fetch(url);
        const rfqs = await res.json();
        const body = document.getElementById("rfqs-list-body");
        body.innerHTML = "";
        
        if (rfqs.length === 0) {
            body.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No RFQs found.</td></tr>`;
            return;
        }

        rfqs.forEach(rfq => {
            let actionBtn = "";
            if (currentUser.role === 'vendor' && rfq.status === 'Sent') {
                actionBtn = `<button class="btn btn-accent btn-sm" onclick="openSubmitQuoteModal(${rfq.id})"><i class="fa-solid fa-pen-clip"></i> Bid Quotation</button>`;
            } else if (currentUser.role === 'officer' && rfq.status === 'Sent') {
                actionBtn = `<button class="btn btn-secondary btn-sm" onclick="openCompareModal(${rfq.id})"><i class="fa-solid fa-code-compare"></i> Compare Bids</button>`;
            }
            
            body.innerHTML += `
                <tr>
                    <td>#RFQ-${rfq.id}</td>
                    <td><strong>${rfq.title}</strong><br><small class="text-secondary">${rfq.description || ''}</small></td>
                    <td>${rfq.vendors.map(v => v.name).join(", ")}</td>
                    <td>${rfq.deadline}</td>
                    <td><span class="badge badge-${rfq.status.toLowerCase()}">${rfq.status}</span></td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
    } catch(err) {
        console.error("RFQs Load Error:", err);
    }
}

async function loadQuotations() {
    try {
        let url = "/api/quotations";
        if (currentUser.role === 'vendor') {
            url += `?vendor_id=${currentUser.vendor_id}`;
        }
        
        const res = await fetch(url);
        const quotes = await res.json();
        
        const rfqRes = await fetch("/api/rfqs");
        const rfqs = await rfqRes.json();
        
        const body = document.getElementById("quotations-list-body");
        body.innerHTML = "";

        if (quotes.length === 0) {
            body.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No quotations submitted yet.</td></tr>`;
            return;
        }

        quotes.forEach(q => {
            const rfq = rfqs.find(r => r.id === q.rfq_id);
            let action = "";
            
            if (currentUser.role === 'manager' && q.status === 'Submitted') {
                action = `
                    <button class="btn btn-primary btn-sm" onclick="handleDecision(${q.id}, 'Approved')"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="btn btn-secondary btn-sm" onclick="handleDecision(${q.id}, 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                `;
            } else if (currentUser.role === 'officer' && q.status === 'Approved') {
                action = `<button class="btn btn-accent btn-sm" onclick="generatePO(${q.id})"><i class="fa-solid fa-file-signature"></i> Issue PO</button>`;
            }
            
            body.innerHTML += `
                <tr>
                    <td>#Q-${q.id}</td>
                    <td><strong>${rfq ? rfq.title : 'RFQ Title'}</strong></td>
                    <td>${q.vendor ? q.vendor.name : 'Unknown Vendor'}</td>
                    <td>${q.delivery_timeline} days</td>
                    <td><strong>INR ${q.total_amount.toLocaleString()}</strong></td>
                    <td><span class="badge badge-${q.status.replace(" ", "").toLowerCase()}">${q.status}</span></td>
                    <td>${action}</td>
                </tr>
            `;
        });
    } catch(err) {
        console.error("Quotations Load Error:", err);
    }
}

async function loadPurchaseOrders() {
    try {
        let url = "/api/purchase-orders";
        if (currentUser.role === 'vendor') {
            url += `?vendor_id=${currentUser.vendor_id}`;
        }
        const res = await fetch(url);
        const pos = await res.json();
        const body = document.getElementById("po-list-body");
        body.innerHTML = "";

        if (pos.length === 0) {
            body.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No purchase orders found.</td></tr>`;
            return;
        }

        pos.forEach(po => {
            let action = `<button class="btn btn-secondary btn-sm" onclick="viewDocument(${po.id}, 'po')"><i class="fa-solid fa-file-pdf"></i> View & Print</button>`;
            if (currentUser.role === 'officer') {
                action += ` <button class="btn btn-accent btn-sm" onclick="generateInvoice(${po.id})"><i class="fa-solid fa-file-invoice-dollar"></i> Generate Invoice</button>`;
            }
            body.innerHTML += `
                <tr>
                    <td><code>${po.po_number}</code></td>
                    <td>#Q-${po.quotation_id}</td>
                    <td>${po.vendor ? po.vendor.name : 'Vendor'}</td>
                    <td>INR ${po.subtotal.toLocaleString()}</td>
                    <td>INR ${po.tax.toLocaleString()}</td>
                    <td><strong>INR ${po.total.toLocaleString()}</strong></td>
                    <td><span class="badge badge-completed">${po.status}</span></td>
                    <td>${action}</td>
                </tr>
            `;
        });
    } catch(err) {
        console.error("POs Load Error:", err);
    }
}

async function loadInvoices() {
    try {
        const res = await fetch("/api/invoices");
        const invoices = await res.json();
        const body = document.getElementById("invoice-list-body");
        body.innerHTML = "";

        if (invoices.length === 0) {
            body.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No invoices registered.</td></tr>`;
            return;
        }

        invoices.forEach(inv => {
            let emailStatus = inv.emailed_to ? `<br><small class="text-muted"><i class="fa-solid fa-paper-plane"></i> Sent to ${inv.emailed_to}</small>` : '';
            let action = `
                <button class="btn btn-secondary btn-sm" onclick="viewDocument(${inv.id}, 'invoice')"><i class="fa-solid fa-file-pdf"></i> View</button>
                <button class="btn btn-accent btn-sm" onclick="promptEmailInvoice(${inv.id})"><i class="fa-solid fa-envelope"></i> Email</button>
            `;
            body.innerHTML += `
                <tr>
                    <td><code>${inv.invoice_number}</code></td>
                    <td>PO #${inv.po_id}</td>
                    <td>INR ${inv.subtotal.toLocaleString()}</td>
                    <td>INR ${inv.tax.toLocaleString()}</td>
                    <td><strong>INR ${inv.total.toLocaleString()}</strong></td>
                    <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span>${emailStatus}</td>
                    <td>${action}</td>
                </tr>
            `;
        });
    } catch(err) {
        console.error("Invoices Load Error:", err);
    }
}

async function loadLogs() {
    try {
        const res = await fetch("/api/logs");
        const logs = await res.json();
        const body = document.getElementById("timeline-logs");
        body.innerHTML = "";

        if (logs.length === 0) {
            body.innerHTML = `<p class="text-center text-muted">No activity logs recorded yet.</p>`;
            return;
        }

        logs.forEach(log => {
            const dateStr = new Date(log.created_at).toLocaleString();
            body.innerHTML += `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-meta">${dateStr}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${log.action}</div>
                        <div class="timeline-desc">Triggered by <strong>${log.actor_name}</strong> - ${log.details || ''}</div>
                    </div>
                </div>
            `;
        });
    } catch(err) {
        console.error("Logs Load Error:", err);
    }
}

async function loadEmails() {
    try {
        const res = await fetch("/api/emails");
        const emails = await res.json();
        const body = document.getElementById("email-inbox-list");
        body.innerHTML = "";

        if (emails.length === 0) {
            body.innerHTML = `<p class="text-center text-muted">No emails sent yet.</p>`;
            return;
        }

        emails.forEach(email => {
            const dateStr = new Date(email.sent_at).toLocaleString();
            body.innerHTML += `
                <div class="card email-card">
                    <div class="email-header-line">
                        <div><strong>To:</strong> ${email.to_email}</div>
                        <div><strong>Subject:</strong> ${email.subject}</div>
                        <div><strong>Sent:</strong> ${dateStr}</div>
                    </div>
                    <pre class="email-body">${email.body}</pre>
                </div>
            `;
        });
    } catch(err) {
        console.error("Emails Load Error:", err);
    }
}

// 5. Setup Action Modals and Event Listeners
function setupEventListeners() {
    const addVendorBtn = document.getElementById("btn-add-vendor-modal");
    if (addVendorBtn) {
        addVendorBtn.addEventListener("click", () => {
            openModal("modal-vendor");
        });
    }
    
    document.getElementById("form-add-vendor").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("v-name").value,
            category: document.getElementById("v-category").value,
            gst_number: document.getElementById("v-gst").value,
            contact_name: document.getElementById("v-contact").value,
            email: document.getElementById("v-email").value,
            phone: document.getElementById("v-phone").value,
            address: document.getElementById("v-address").value
        };
        
        try {
            const res = await fetch("/api/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal("modal-vendor");
                loadVendors();
            }
        } catch(err) {
            console.error("Failed to add vendor:", err);
        }
    });

    const addRFQBtn = document.getElementById("btn-create-rfq-modal");
    if (addRFQBtn) {
        addRFQBtn.addEventListener("click", async () => {
            const res = await fetch("/api/vendors");
            const vendors = await res.json();
            const group = document.getElementById("rfq-vendors-checkboxes");
            group.innerHTML = "";
            vendors.forEach(v => {
                group.innerHTML += `
                    <label class="checkbox-label">
                        <input type="checkbox" name="rfq-vendor-chk" value="${v.id}">
                        <span>${v.name} (${v.category})</span>
                    </label>
                `;
            });
            openModal("modal-rfq");
        });
    }

    document.getElementById("btn-add-rfq-item").addEventListener("click", () => {
        const itemContainer = document.getElementById("rfq-items-container");
        const newRow = document.createElement("div");
        newRow.className = "item-row form-grid";
        newRow.innerHTML = `
            <div class="form-group span-2">
                <label>Item Name / Title</label>
                <input type="text" class="item-name" required placeholder="e.g. Monitor Arm Single">
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" class="item-qty" min="1" required placeholder="5">
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" class="item-unit" value="pcs" required>
            </div>
        `;
        itemContainer.appendChild(newRow);
    });

    document.getElementById("form-create-rfq").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const checkedVendors = Array.from(document.querySelectorAll('input[name="rfq-vendor-chk"]:checked')).map(el => parseInt(el.value));
        if (checkedVendors.length === 0) {
            alert("Please select at least one vendor partner.");
            return;
        }

        const items = [];
        const itemRows = document.querySelectorAll("#rfq-items-container .item-row");
        itemRows.forEach(row => {
            items.push({
                item_name: row.querySelector(".item-name").value,
                description: "",
                quantity: parseFloat(row.querySelector(".item-qty").value),
                unit: row.querySelector(".item-unit").value
            });
        });

        const payload = {
            title: document.getElementById("rfq-title").value,
            description: document.getElementById("rfq-desc").value,
            deadline: document.getElementById("rfq-deadline").value,
            items: items,
            vendor_ids: checkedVendors
        };

        try {
            const res = await fetch("/api/rfqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal("modal-rfq");
                loadRFQs();
            }
        } catch(err) {
            console.error("RFQ Publish Error:", err);
        }
    });

    document.getElementById("form-submit-quote").addEventListener("submit", async (e) => {
        e.preventDefault();
        const rfqId = parseInt(document.getElementById("q-rfq-id").value);
        const deliveryTimeline = parseInt(document.getElementById("q-timeline").value);
        const notes = document.getElementById("q-notes").value;
        
        const items = [];
        const quoteInputs = document.querySelectorAll("#quote-items-container .quote-item-row");
        quoteInputs.forEach(row => {
            items.push({
                rfq_item_id: parseInt(row.dataset.itemId),
                unit_price: parseFloat(row.querySelector(".item-price").value),
                quantity: parseFloat(row.dataset.qty)
            });
        });

        const payload = {
            rfq_id: rfqId,
            vendor_id: currentUser.vendor_id,
            delivery_timeline: deliveryTimeline,
            notes: notes,
            items: items
        };

        try {
            const res = await fetch("/api/quotations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal("modal-quote");
                loadQuotations();
            }
        } catch(err) {
            console.error("Failed to submit quotation:", err);
        }
    });
}

// 6. Vendor Quotation Modal Launch
async function openSubmitQuoteModal(rfqId) {
    try {
        const res = await fetch(`/api/rfqs/${rfqId}`);
        const rfq = await res.json();
        
        document.getElementById("q-rfq-id").value = rfqId;
        const container = document.getElementById("quote-items-container");
        container.innerHTML = "";
        
        rfq.items.forEach(item => {
            container.innerHTML += `
                <div class="quote-item-row form-grid" data-item-id="${item.id}" data-qty="${item.quantity}">
                    <div class="form-group span-2">
                        <label>Item details</label>
                        <input type="text" readonly value="${item.item_name} (Requested: ${item.quantity} ${item.unit})">
                    </div>
                    <div class="form-group">
                        <label>Unit price (INR)</label>
                        <input type="number" class="item-price" min="0" step="0.01" required placeholder="0.00">
                    </div>
                </div>
            `;
        });
        
        openModal("modal-quote");
    } catch(err) {
        console.error("Open quotation bid modal error:", err);
    }
}

// 7. Comparison Matrix Modal Launch
async function openCompareModal(rfqId) {
    try {
        const rfqRes = await fetch(`/api/rfqs/${rfqId}`);
        const rfq = await rfqRes.json();
        
        const quoteRes = await fetch(`/api/quotations?rfq_id=${rfqId}`);
        const quotes = await quoteRes.json();
        
        document.getElementById("compare-rfq-title").innerText = rfq.title;
        document.getElementById("compare-rfq-desc").innerText = rfq.description || "No description provided.";
        
        const matrix = document.getElementById("comparison-matrix-body");
        matrix.innerHTML = "";
        
        if (quotes.length === 0) {
            matrix.innerHTML = `<div class="text-center text-muted w-100">No quotation bids submitted yet by invited vendors.</div>`;
            openModal("modal-compare");
            return;
        }

        const lowestBid = Math.min(...quotes.map(q => q.total_amount));

        quotes.forEach(q => {
            const isLowest = q.total_amount === lowestBid;
            const itemsRows = q.items.map(item => {
                const rfqItem = rfq.items.find(ri => ri.id === item.rfq_item_id);
                return `
                    <div class="compare-item-line">
                        <span>${rfqItem ? rfqItem.item_name : 'Item'}:</span>
                        <strong>INR ${item.unit_price} x ${item.quantity}</strong>
                    </div>
                `;
            }).join("");

            let actionBtn = `<span class="badge badge-${q.status.toLowerCase()}">${q.status}</span>`;
            if (q.status === 'Submitted') {
                actionBtn = `<button class="btn btn-accent btn-sm w-100" onclick="managerCompareApprove(${q.id})"><i class="fa-solid fa-thumbs-up"></i> Shortlist / Approve</button>`;
            }

            matrix.innerHTML += `
                <div class="compare-card ${isLowest ? 'winner' : ''}">
                    ${isLowest ? '<div class="winner-badge">Lowest Price</div>' : ''}
                    <h3>${q.vendor ? q.vendor.name : 'Vendor'}</h3>
                    <p class="text-secondary">Delivery in: <strong>${q.delivery_timeline} days</strong></p>
                    <div class="compare-price">INR ${q.total_amount.toLocaleString()}</div>
                    <div class="compare-items-list">
                        ${itemsRows}
                    </div>
                    <div class="mt-4">
                        ${actionBtn}
                    </div>
                </div>
            `;
        });
        
        openModal("modal-compare");
    } catch(err) {
        console.error("Comparison load error:", err);
    }
}

async function managerCompareApprove(quoteId) {
    if (confirm("Send this quote to Manager for approval?")) {
        try {
            const res = await fetch(`/api/quotations/${quoteId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: "Approved", remarks: "Shortlisted lowest bid from comparison dashboard" })
            });
            if (res.ok) {
                closeModal("modal-compare");
                loadCurrentView();
            }
        } catch(err) {
            console.error("Decision approval error:", err);
        }
    }
}

// 8. Manager Decision
async function handleDecision(quoteId, decision) {
    const remarks = prompt(`Enter optional remarks for this decision (${decision}):`);
    try {
        const res = await fetch(`/api/quotations/${quoteId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: decision, remarks: remarks || "Processed" })
        });
        if (res.ok) {
            loadQuotations();
        }
    } catch(err) {
        console.error("Failed decision action:", err);
    }
}

// 9. PO and Invoice generation triggers
async function generatePO(quotationId) {
    try {
        const res = await fetch("/api/purchase-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quotation_id: quotationId })
        });
        if (res.ok) {
            window.location.hash = "#purchase_orders";
        }
    } catch(err) {
        console.error("PO issue error:", err);
    }
}

async function generateInvoice(poId) {
    try {
        const res = await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ po_id: poId })
        });
        if (res.ok) {
            window.location.hash = "#invoices";
        }
    } catch(err) {
        console.error("Invoice issue error:", err);
    }
}

async function promptEmailInvoice(invoiceId) {
    const email = prompt("Enter recipient email address:");
    if (!email) return;
    try {
        const res = await fetch(`/api/invoices/${invoiceId}/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        if (res.ok) {
            alert("Invoice successfully emailed!");
            loadInvoices();
        }
    } catch(err) {
        console.error("Failed to email invoice:", err);
    }
}

// 10. Document Viewer Modal (PO / Invoice layouts)
async function viewDocument(docId, type) {
    const printableArea = document.getElementById("doc-printable-area");
    printableArea.innerHTML = "<p>Loading document preview...</p>";
    
    try {
        if (type === 'po') {
            const res = await fetch("/api/purchase-orders");
            const pos = await res.json();
            const po = pos.find(p => p.id === docId);
            
            const rfqRes = await fetch(`/api/rfqs/${po.quotation.rfq_id}`);
            const rfq = await rfqRes.json();
            
            const itemsRows = po.quotation.items.map(item => {
                const rfqItem = rfq.items.find(ri => ri.id === item.rfq_item_id);
                return `
                    <tr>
                        <td>${rfqItem ? rfqItem.item_name : 'General procurement item'}</td>
                        <td align="right">${item.quantity}</td>
                        <td align="right">INR ${item.unit_price.toFixed(2)}</td>
                        <td align="right">INR ${item.line_total.toFixed(2)}</td>
                    </tr>
                `;
            }).join("");

            printableArea.innerHTML = `
                <div class="doc-header">
                    <div class="doc-logo-title">
                        <h1>PURCHASE ORDER</h1>
                        <p><strong>VendorBridge ERP</strong></p>
                    </div>
                    <div class="doc-meta">
                        <p><strong>PO Number:</strong> ${po.po_number}</p>
                        <p><strong>Date:</strong> ${new Date(po.created_at).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${po.status}</p>
                    </div>
                </div>
                <div class="doc-details-grid">
                    <div class="doc-bill-box">
                        <h4>Vendor Partner:</h4>
                        <p><strong>${po.vendor.name}</strong></p>
                        <p>${po.vendor.contact_name}</p>
                        <p>${po.vendor.address}</p>
                        <p>GSTIN: ${po.vendor.gst_number}</p>
                    </div>
                    <div class="doc-bill-box">
                        <h4>Shipping Destination:</h4>
                        <p><strong>VendorBridge Operations Hub</strong></p>
                        <p>Plot No 44, Industrial Development Area</p>
                        <p>Pune, MH, 411018</p>
                    </div>
                </div>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th align="left">Item Description</th>
                            <th align="right" width="100">Qty</th>
                            <th align="right" width="120">Unit Price</th>
                            <th align="right" width="150">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
                <div class="doc-totals">
                    <div class="totals-box">
                        <div class="totals-line">
                            <span>Subtotal:</span>
                            <span>INR ${po.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="totals-line">
                            <span>GST (18%):</span>
                            <span>INR ${po.tax.toFixed(2)}</span>
                        </div>
                        <div class="totals-line grand">
                            <span>Grand Total:</span>
                            <span>INR ${po.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'invoice') {
            const res = await fetch("/api/invoices");
            const invoices = await res.json();
            const inv = invoices.find(i => i.id === docId);
            
            const poRes = await fetch("/api/purchase_orders");
            const pos = await poRes.json();
            const po = pos.find(p => p.id === inv.po_id);

            const rfqRes = await fetch(`/api/rfqs/${po.quotation.rfq_id}`);
            const rfq = await rfqRes.json();
            
            const itemsRows = po.quotation.items.map(item => {
                const rfqItem = rfq.items.find(ri => ri.id === item.rfq_item_id);
                return `
                    <tr>
                        <td>${rfqItem ? rfqItem.item_name : 'General item'}</td>
                        <td align="right">${item.quantity}</td>
                        <td align="right">INR ${item.unit_price.toFixed(2)}</td>
                        <td align="right">INR ${item.line_total.toFixed(2)}</td>
                    </tr>
                `;
            }).join("");

            printableArea.innerHTML = `
                <div class="doc-header">
                    <div class="doc-logo-title">
                        <h1 style="color: #06b6d4;">TAX INVOICE</h1>
                        <p><strong>VendorBridge ERP</strong></p>
                    </div>
                    <div class="doc-meta">
                        <p><strong>Invoice Number:</strong> ${inv.invoice_number}</p>
                        <p><strong>PO Reference:</strong> ${po.po_number}</p>
                        <p><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${inv.status}</p>
                    </div>
                </div>
                <div class="doc-details-grid">
                    <div class="doc-bill-box">
                        <h4>From (Vendor):</h4>
                        <p><strong>${po.vendor.name}</strong></p>
                        <p>GSTIN: ${po.vendor.gst_number}</p>
                        <p>${po.vendor.address}</p>
                    </div>
                    <div class="doc-bill-box">
                        <h4>Bill To:</h4>
                        <p><strong>VendorBridge Operations Hub</strong></p>
                        <p>Plot No 44, Industrial Development Area</p>
                        <p>Pune, MH, 411018</p>
                    </div>
                </div>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th align="left">Item Description</th>
                            <th align="right" width="100">Qty</th>
                            <th align="right" width="120">Unit Price</th>
                            <th align="right" width="150">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
                <div class="doc-totals">
                    <div class="totals-box">
                        <div class="totals-line">
                            <span>Subtotal:</span>
                            <span>INR ${inv.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="totals-line">
                            <span>GST (18%):</span>
                            <span>INR ${inv.tax.toFixed(2)}</span>
                        </div>
                        <div class="totals-line grand" style="color: #06b6d4;">
                            <span>Total Amount:</span>
                            <span>INR ${inv.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        openModal("modal-doc");
    } catch(err) {
        console.error("Load doc error:", err);
    }
}

// 11. Modal Utilities
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}
