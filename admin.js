// ===== FIREBASE IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBceUXo8EWF7w8aPvtXKa-rrizVVFx2MJM",
  authDomain: "the-artisans-hub.firebaseapp.com",
  projectId: "the-artisans-hub",
  storageBucket: "the-artisans-hub.firebasestorage.app",
  messagingSenderId: "351977926945",
  appId: "1:351977926945:web:17c86b5a75e61afd514e60",
  measurementId: "G-RV4D6DBSTB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== CATEGORIES =====
const CATEGORIES = [
  { id: 'customized-gifts', name: 'Customized Gifts' },
  { id: 'photo-gifts',      name: 'Photo Gifts' },
  { id: 'trophies',         name: 'Trophies' },
  { id: 'mementos',         name: 'Mementos' },
  { id: 'stationery',       name: 'Stationery' },
  { id: 'corporate-gifts',  name: 'Corporate Gifts' },
  { id: 'wooden',           name: 'Wooden Items' },
];

let allProducts   = [];
let allOrders     = [];
let editingOrderId = null;

const FIRESTORE_GUIDE = `FIREBASE FIRESTORE SETUP GUIDE
================================

COLLECTIONS NEEDED:
  products   -- stores your product catalog
  orders     -- stores customer orders

PRODUCTS COLLECTION FIELDS:
  name         (string, required)
  item_code    (string)
  category     (string, required)
  price        (number, required)
  description  (string)
  image_url    (string)
  is_active    (boolean, default: true)
  created_at   (timestamp)
  updated_at   (timestamp)

SECURITY RULES (Firebase Console > Firestore > Rules):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /orders/{document=**} {
      allow read, write: if true;
    }
  }
}

Project: the-artisans-hub
Console: https://console.firebase.google.com/project/the-artisans-hub
`;

// ===== TOAST =====
function showToast(msg, type) {
  if (!type) type = 'success';
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.classList.remove('show'); }, 3500);
}
window.showToast = showToast;

// ===== ADMIN AUTH =====
var ADMIN_USERNAME = 'ADMIN VIBES';
var ADMIN_PASSWORD = 'VIBES@OAH2026';

window.adminLogin = function() {
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
    localStorage.setItem('tah_admin_logged_in', 'yes');
    document.getElementById('adminLoginScreen').style.display = 'none';
    initApp();
  } else {
    showToast('Invalid username or password.', 'error');
  }
};

window.adminLogout = function() {
  localStorage.removeItem('tah_admin_logged_in');
  location.reload();
};

// ===== INIT =====
async function initApp() {
  var sqlEl = document.getElementById('sqlText');
  if (sqlEl) sqlEl.value = FIRESTORE_GUIDE;
  loadSettings();
  await testConnection();
  await loadDashboard();
  renderCategoryList();
}

document.addEventListener('DOMContentLoaded', function() {
  // Auth check
  var loginScreen = document.getElementById('adminLoginScreen');
  if (loginScreen) {
    if (localStorage.getItem('tah_admin_logged_in') === 'yes') {
      loginScreen.style.display = 'none';
      initApp();
    } else {
      loginScreen.style.display = 'flex';
    }
  }

  // Enter on password
  var passEl = document.getElementById('adminPass');
  if (passEl) {
    passEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') window.adminLogin();
    });
  }
});

// ===== CONNECTION TEST =====
async function testConnection() {
  var el = document.getElementById('dbStatus');
  if (!el) return;
  try {
    await getDocs(query(collection(db, 'products')));
    el.textContent = 'Firebase Connected';
    el.style.color = 'var(--green)';
  } catch(e) {
    el.textContent = 'Firebase Error';
    el.style.color = 'var(--red)';
    console.warn('Firebase test failed:', e.message);
  }
}

// ===== PAGES =====
window.showPage = function(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });

  var pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  var titles = { dashboard:'Dashboard', products:'Products', orders:'Orders', categories:'Categories', settings:'Settings' };
  var titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[page] || page;

  var pageOrder = ['dashboard','products','orders','categories','settings'];
  var idx = pageOrder.indexOf(page);
  var links = document.querySelectorAll('.sidebar-link');
  if (links[idx]) links[idx].classList.add('active');

  if (page === 'products')   loadProducts();
  if (page === 'orders')     loadOrders();
  if (page === 'dashboard')  loadDashboard();
  if (page === 'categories') renderCategoryStats();
};

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    var results = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc')))
    ]);
    var productsSnap = results[0];
    var ordersSnap   = results[1];
    var orders  = ordersSnap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var pending = orders.filter(function(o) { return o.status === 'pending'; }).length;
    var revenue = orders.reduce(function(s, o) { return s + (parseFloat(o.total_amount) || 0); }, 0);

    document.getElementById('statProducts').textContent = productsSnap.size || '0';
    document.getElementById('statOrders').textContent   = orders.length || '0';
    document.getElementById('statPending').textContent  = pending || '0';
    document.getElementById('statRevenue').textContent  = '\u20b9' + revenue.toLocaleString('en-IN');

    var recent   = orders.slice(0, 5);
    var recentEl = document.getElementById('dashRecentOrders');
    recentEl.innerHTML = recent.length === 0
      ? '<p style="text-align:center;color:var(--text-light);padding:20px">No orders yet</p>'
      : recent.map(function(o) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">'
            + '<div><div style="font-size:13px;font-weight:600;color:var(--brown-dark)">' + (o.customer_name||'—') + '</div>'
            + '<div style="font-size:11px;color:var(--text-light)">' + (o.customer_phone||'—') + '</div></div>'
            + '<div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--brown)">\u20b9' + parseFloat(o.total_amount||0).toLocaleString('en-IN') + '</div>'
            + '<span class="badge badge-' + o.status + '">' + o.status + '</span></div></div>';
        }).join('');
  } catch(e) {
    document.getElementById('statProducts').textContent = '\u2014';
    var el = document.getElementById('dashRecentOrders');
    if (el) el.innerHTML = '<p style="color:var(--text-light);font-size:12px;padding:12px">Check Firebase Console and enable Firestore.</p>';
    console.warn('Dashboard load error:', e.message);
  }
}

// ===== PRODUCTS =====
async function loadProducts() {
  var tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-light)">Loading\u2026</td></tr>';
  try {
    var snap = await getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc')));
    allProducts = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    populateCatFilter();
    renderProductsTable(allProducts);
  } catch(e) {
    allProducts = [];
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--red)">Error: ' + e.message + '<br><small>Check Firebase Console and enable Firestore Database.</small></td></tr>';
  }
}

function renderProductsTable(products) {
  var tbody = document.getElementById('productsTableBody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-light)">No products found. Add your first product!</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(function(p) {
    var imgHtml = p.image_url
      ? '<img src="' + p.image_url + '" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.outerHTML=\'<div class=product-emoji-box>IMG</div>\'" />'
      : '<div class="product-emoji-box">IMG</div>';
    var safeName = p.name.replace(/'/g, "\\'");
    return '<tr>'
      + '<td><div class="product-preview">' + imgHtml + '<div class="info"><div class="name">' + p.name + '</div></div></div></td>'
      + '<td>' + getCatLabel(p.category) + '</td>'
      + '<td><code style="background:var(--bg);padding:3px 8px;border-radius:4px;font-size:11px">' + (p.item_code||'—') + '</code></td>'
      + '<td style="font-weight:700;color:var(--brown)">\u20b9' + parseFloat(p.price||0).toLocaleString('en-IN') + '</td>'
      + '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-light);font-size:12px">' + (p.description||'—') + '</td>'
      + '<td><div style="display:flex;gap:6px">'
      + '<button class="btn btn-warning btn-sm" onclick="editProduct(\'' + p.id + '\')">Edit</button>'
      + '<button class="btn btn-danger btn-sm" onclick="deleteProduct(\'' + p.id + '\',\'' + safeName + '\')">Delete</button>'
      + '</div></td></tr>';
  }).join('');
}

window.filterProducts = function() {
  var q   = document.getElementById('productSearch').value.toLowerCase();
  var cat = document.getElementById('productCatFilter').value;
  renderProductsTable(allProducts.filter(function(p) {
    return (!q || p.name.toLowerCase().includes(q) || (p.item_code||'').toLowerCase().includes(q))
        && (!cat || p.category === cat);
  }));
};

function populateCatFilter() {
  var sel = document.getElementById('productCatFilter');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Categories</option>'
    + CATEGORIES.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
}

function getCatLabel(catId) {
  var c = CATEGORIES.find(function(x) { return x.id === catId; });
  return c ? c.name : (catId || '—');
}

// ===== ADD / EDIT PRODUCT =====
window.openAddProduct = function() {
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productId').value = '';
  ['productName','productCode','productPrice','productDescription','productImageUrl'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('productCategory').value = '';
  document.getElementById('productImageFile').value = '';
  var preview = document.getElementById('imagePreview');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  document.getElementById('productModal').classList.add('active');
};

window.editProduct = function(id) {
  var p = allProducts.find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productId').value          = p.id;
  document.getElementById('productName').value        = p.name        || '';
  document.getElementById('productCategory').value    = p.category    || '';
  document.getElementById('productCode').value        = p.item_code   || '';
  document.getElementById('productPrice').value       = p.price       || '';
  document.getElementById('productDescription').value = p.description || '';
  document.getElementById('productImageUrl').value    = p.image_url   || '';
  document.getElementById('productImageFile').value   = '';
  var preview = document.getElementById('imagePreview');
  if (preview) {
    if (p.image_url) { preview.src = p.image_url; preview.style.display = 'block'; }
    else { preview.style.display = 'none'; }
  }
  document.getElementById('productModal').classList.add('active');
};

window.closeProductModal = function() {
  document.getElementById('productModal').classList.remove('active');
};

window.handleProductImageUpload = function(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('productImageUrl').value = e.target.result;
    var preview = document.getElementById('imagePreview');
    if (preview) { preview.style.display = 'block'; preview.src = e.target.result; }
  };
  reader.readAsDataURL(file);
};

window.saveProduct = async function() {
  var id          = document.getElementById('productId').value.trim();
  var name        = document.getElementById('productName').value.trim();
  var category    = document.getElementById('productCategory').value;
  var item_code   = document.getElementById('productCode').value.trim();
  var priceRaw    = document.getElementById('productPrice').value;
  var price       = parseFloat(priceRaw);
  var description = document.getElementById('productDescription').value.trim();
  var image_url   = document.getElementById('productImageUrl').value.trim();

  if (!name) { showToast('Please enter the product name.', 'error'); return; }
  if (!category) { showToast('Please select a category.', 'error'); return; }
  if (!priceRaw || isNaN(price) || price <= 0) { showToast('Please enter a valid price.', 'error'); return; }

  var payload = {
    name:        name,
    category:    category,
    item_code:   item_code   || null,
    price:       price,
    description: description || null,
    image_url:   image_url   || null,
    is_active:   true,
    updated_at:  serverTimestamp()
  };

  var saveBtn = document.querySelector('#productModal .btn-success');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving\u2026'; }

  try {
    if (id) {
      await updateDoc(doc(db, 'products', id), payload);
      showToast('Product updated successfully!', 'success');
    } else {
      payload.created_at = serverTimestamp();
      await addDoc(collection(db, 'products'), payload);
      showToast('Product added successfully!', 'success');
    }
    window.closeProductModal();
    await loadProducts();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    console.error('Save product error:', e);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Product'; }
  }
};

window.deleteProduct = async function(id, name) {
  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    showToast('Product deleted successfully.', 'success');
    await loadProducts();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
  }
};

// ===== ORDERS =====
async function loadOrders() {
  var tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-light)">Loading\u2026</td></tr>';
  try {
    var snap = await getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc')));
    allOrders = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    renderOrdersTable(allOrders);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--red)">Error: ' + e.message + '</td></tr>';
  }
}

function renderOrdersTable(orders) {
  var tbody = document.getElementById('ordersTableBody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-light)">No orders yet</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(function(o) {
    var items = [];
    try { items = JSON.parse(o.items || '[]'); } catch(e) {}
    var createdAt = (o.created_at && o.created_at.toDate) ? o.created_at.toDate().toLocaleDateString('en-IN') : '—';
    var waMsg = encodeURIComponent('Hi ' + (o.customer_name||'') + ', your order from The Artisans Hub is being processed!');
    return '<tr>'
      + '<td style="font-weight:700;color:var(--text-light)">#' + o.id.slice(-6).toUpperCase() + '</td>'
      + '<td style="font-weight:600;color:var(--brown-dark)">' + (o.customer_name||'—') + '</td>'
      + '<td><a href="https://wa.me/' + o.customer_phone + '" target="_blank" style="color:var(--brown-light);text-decoration:none">' + (o.customer_phone||'—') + '</a></td>'
      + '<td style="font-size:12px;color:var(--text-light)">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + '</td>'
      + '<td style="font-weight:700;color:var(--brown)">\u20b9' + parseFloat(o.total_amount||0).toLocaleString('en-IN') + '</td>'
      + '<td style="font-size:12px;color:var(--text-light)">' + createdAt + '</td>'
      + '<td><span class="badge badge-' + o.status + '">' + o.status + '</span></td>'
      + '<td><div style="display:flex;gap:6px">'
      + '<button class="btn btn-primary btn-sm" onclick="viewOrder(\'' + o.id + '\')">View</button>'
      + '<a href="https://wa.me/' + o.customer_phone + '?text=' + waMsg + '" target="_blank" class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none">Chat</a>'
      + '</div></td></tr>';
  }).join('');
}

window.filterOrders = function() {
  var status = document.getElementById('orderStatusFilter').value;
  renderOrdersTable(status ? allOrders.filter(function(o) { return o.status === status; }) : allOrders);
};

window.viewOrder = function(id) {
  var o = allOrders.find(function(x) { return x.id === id; });
  if (!o) return;
  editingOrderId = id;
  var items = [];
  try { items = JSON.parse(o.items || '[]'); } catch(e) {}
  var createdAt = (o.created_at && o.created_at.toDate) ? o.created_at.toDate().toLocaleString('en-IN') : '—';
  document.getElementById('orderDetailBody').innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">'
    + '<div><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-light);margin-bottom:4px">CUSTOMER</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--brown-dark)">' + (o.customer_name||'—') + '</div></div>'
    + '<div><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-light);margin-bottom:4px">PHONE</div>'
    + '<a href="https://wa.me/' + o.customer_phone + '" target="_blank" style="font-size:15px;font-weight:700;color:var(--green);text-decoration:none">' + (o.customer_phone||'—') + '</a></div>'
    + '<div style="grid-column:1/-1"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-light);margin-bottom:4px">ADDRESS</div>'
    + '<div style="font-size:13px;color:var(--text)">' + (o.delivery_address||'Not provided') + '</div></div>'
    + '<div style="grid-column:1/-1"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-light);margin-bottom:4px">NOTES</div>'
    + '<div style="font-size:13px;color:var(--text);background:var(--bg);padding:10px;border-radius:8px">' + (o.notes||'None') + '</div></div></div>'
    + '<div style="border-top:1px solid var(--border);padding-top:16px">'
    + '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text-light);margin-bottom:12px">ORDER ITEMS</div>'
    + items.map(function(item) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">'
          + '<div><div style="font-size:13px;font-weight:600;color:var(--brown-dark)">' + (item.name||'—') + '</div>'
          + '<div style="font-size:11px;color:var(--text-light)">Qty: ' + item.qty + '</div></div>'
          + '<div style="font-weight:700;color:var(--brown)">\u20b9' + (item.price * item.qty).toLocaleString('en-IN') + '</div></div>';
      }).join('')
    + '<div style="display:flex;justify-content:space-between;padding:14px 0;font-size:18px;font-weight:700">'
    + '<span>Total</span><span style="color:var(--brown)">\u20b9' + parseFloat(o.total_amount||0).toLocaleString('en-IN') + '</span></div></div>'
    + '<div style="margin-top:4px"><span class="badge badge-' + o.status + '" style="font-size:12px;padding:6px 14px">Status: ' + (o.status||'').toUpperCase() + '</span>'
    + '<span style="font-size:12px;color:var(--text-light);margin-left:10px">Ordered: ' + createdAt + '</span></div>';
  document.getElementById('orderDetailModal').classList.add('active');
};

window.closeOrderDetail = function() {
  document.getElementById('orderDetailModal').classList.remove('active');
  editingOrderId = null;
};

window.updateOrderStatus = async function(status) {
  if (!editingOrderId) return;
  try {
    await updateDoc(doc(db, 'orders', editingOrderId), { status: status, updated_at: serverTimestamp() });
    showToast('Order marked as ' + status + '.', 'success');
    window.closeOrderDetail();
    await loadOrders();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
  }
};

// ===== CATEGORIES =====
window.renderCategoryList = function() {
  var el = document.getElementById('categoriesList');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(function(c) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">'
      + '<div><div style="font-weight:700;font-size:13px;color:var(--brown-dark)">' + c.name + '</div>'
      + '<div style="font-size:11px;color:var(--text-light)">ID: ' + c.id + '</div></div></div>';
  }).join('');
};

async function renderCategoryStats() {
  window.renderCategoryList();
  var el = document.getElementById('catStatsGrid');
  if (!el) return;
  try {
    var snap = await getDocs(collection(db, 'products'));
    var counts = {};
    snap.docs.forEach(function(d) { var cat = d.data().category; counts[cat] = (counts[cat]||0) + 1; });
    el.innerHTML = CATEGORIES.map(function(c) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">'
        + '<span style="font-size:13px">' + c.name + '</span>'
        + '<span style="font-weight:700;color:var(--brown)">' + (counts[c.id]||0) + ' products</span></div>';
    }).join('');
  } catch(e) {
    el.innerHTML = '<p style="color:var(--text-light);font-size:12px">Check Firebase connection</p>';
  }
}

// ===== SETTINGS =====
window.loadSettings = function() {
  var el = document.getElementById('settingWhatsapp');
  if (el) el.value = localStorage.getItem('tah_wa') || '916379299336';
};

window.saveSettings = function() {
  var val = document.getElementById('settingWhatsapp').value.trim();
  localStorage.setItem('tah_wa', val);
  showToast('Settings saved successfully!', 'success');
};

window.showSQLModal = function() { document.getElementById('sqlModal').classList.add('active'); };

window.copySql = function() {
  navigator.clipboard.writeText(FIRESTORE_GUIDE)
    .then(function() { showToast('Guide copied to clipboard!', 'success'); })
    .catch(function() { showToast('Could not copy. Please copy manually.', 'error'); });
};

window.loadOrders = loadOrders;
