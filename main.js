// ===== FIREBASE IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const WHATSAPP_NUMBER = '916379299336';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('tah_cart') || '[]');
let currentCategory = 'all';

// FIX: currentProduct lives here in module scope and is exposed on window
// so inline HTML onclick handlers can also access it
let currentProduct = null;

const CATEGORIES = [
  { id: 'all',              name: 'All Products',     image: 'https://img.icons8.com/fluency/96/shopping-bag.png' },
  { id: 'customized-gifts', name: 'Customized Gifts', image: 'https://img.icons8.com/fluency/96/paint-palette.png' },
  { id: 'photo-gifts',      name: 'Photo Gifts',      image: 'https://img.icons8.com/fluency/96/picture.png' },
  { id: 'trophies',         name: 'Trophies',         image: 'https://img.icons8.com/fluency/96/trophy.png' },
  { id: 'mementos',         name: 'Mementos',         image: 'https://img.icons8.com/fluency/96/medal.png' },
  { id: 'stationery',       name: 'Stationery',       image: 'https://img.icons8.com/fluency/96/edit-file.png' },
  { id: 'corporate-gifts',  name: 'Corporate Gifts',  image: 'https://img.icons8.com/fluency/96/briefcase.png' },
  { id: 'wooden',           name: 'Wooden Items',     image: 'https://img.icons8.com/fluency/96/wood.png' },
];

const SAMPLE_PRODUCTS = [
  { id: 'PF-001',  name: 'Photo Frame - Classic Wood',       item_code: 'PF-001',  category: 'photo-gifts',      price: 599,  description: 'Beautiful wooden photo frame with personalized engraving.',                         badge: 'Bestseller' },
  { id: 'PM-001',  name: 'Photo Mug - Magic Color Change',   item_code: 'PM-001',  category: 'photo-gifts',      price: 449,  description: 'Heat sensitive magic mug that reveals your photo when filled with hot liquid.',     badge: 'Popular' },
  { id: 'PK-001',  name: 'Photo Keychain - Oval Shape',      item_code: 'PK-001',  category: 'photo-gifts',      price: 199,  description: 'Compact oval shaped keychain with high-quality printed photo.' },
  { id: 'PC-001',  name: 'Photo Clock - Wall Mount',         item_code: 'PC-001',  category: 'photo-gifts',      price: 799,  description: 'Elegant wall clock with your photo beautifully embedded in the design.' },
  { id: 'MM-001',  name: 'Magic Mirror Photo Frame',         item_code: 'MM-001',  category: 'photo-gifts',      price: 1299, description: 'Premium LED magic mirror frame with warm glow.',                                     badge: 'New' },
  { id: 'PCU-001', name: 'Photo Cushion - Soft Touch',       item_code: 'PCU-001', category: 'photo-gifts',      price: 699,  description: 'High quality cushion with vibrant photo print.' },
  { id: 'CAL-001', name: 'Photo Calendar - 12 Month',        item_code: 'CAL-001', category: 'photo-gifts',      price: 549,  description: 'Custom 12-month calendar with your photos on each page.' },
  { id: 'WP-001',  name: 'Wooden Engraved Plaque',           item_code: 'WP-001',  category: 'wooden',           price: 899,  description: 'Premium wooden plaque with laser engraving.' },
  { id: 'TG-001',  name: 'Gold Trophy - Standard',           item_code: 'TG-001',  category: 'trophies',         price: 349,  description: 'Classic gold trophy for competitions and events.' },
  { id: 'TA-001',  name: 'Acrylic Trophy - Premium',         item_code: 'TA-001',  category: 'trophies',         price: 1199, description: 'Crystal clear acrylic trophy with custom engraving.',                               badge: 'Premium' },
  { id: 'CA-001',  name: 'Crystal Award - Executive',        item_code: 'CA-001',  category: 'trophies',         price: 2499, description: 'Stunning crystal award for corporate recognition.',                                badge: 'Luxury' },
  { id: 'TW-001',  name: 'Wooden Trophy - Artisan',          item_code: 'TW-001',  category: 'trophies',         price: 899,  description: 'Handcrafted wooden trophy with natural finish.' },
  { id: 'TS-001',  name: 'Sports Trophy - Champion',         item_code: 'TS-001',  category: 'trophies',         price: 599,  description: 'Classic sports trophy for schools and colleges.' },
  { id: 'MA-001',  name: 'Acrylic Memento - Logo',           item_code: 'MA-001',  category: 'mementos',         price: 799,  description: 'Elegant acrylic memento with your logo and message.' },
  { id: 'MW-001',  name: 'Wooden Engraved Memento',          item_code: 'MW-001',  category: 'mementos',         price: 999,  description: 'Premium wooden memento with deep laser engraving.' },
  { id: 'RG-001',  name: 'Retirement Gift Set',              item_code: 'RG-001',  category: 'mementos',         price: 1999, description: 'Special retirement memento set with personalized plaque.',                         badge: 'Special' },
  { id: 'FM-001',  name: 'Farewell Memento - Premium',       item_code: 'FM-001',  category: 'mementos',         price: 1299, description: 'Beautiful farewell memento with custom message.' },
  { id: 'NB-001',  name: 'Notebook - Hardbound',             item_code: 'NB-001',  category: 'stationery',       price: 299,  description: 'Premium A5 hardbound notebook with your company logo.' },
  { id: 'PS-001',  name: 'Pen Set - Executive',              item_code: 'PS-001',  category: 'stationery',       price: 449,  description: 'Elegant metal pen set in gift box with branding.' },
  { id: 'CGH-001', name: 'Corporate Gift Hamper',            item_code: 'CGH-001', category: 'corporate-gifts',  price: 2999, description: 'Curated corporate gift hamper with premium items.',                                 badge: 'Popular' },
  { id: 'WK-001',  name: 'Welcome Kit - Employee',           item_code: 'WK-001',  category: 'corporate-gifts',  price: 1599, description: 'Complete welcome kit for new employees.' },
  { id: 'AS-001',  name: 'Anniversary Souvenir',             item_code: 'AS-001',  category: 'mementos',         price: 1499, description: 'Beautiful anniversary souvenir for corporate milestones.' },
  { id: 'MP-001',  name: 'Metal Plate - Engraved',           item_code: 'MP-001',  category: 'mementos',         price: 699,  description: 'Premium metal plate with precision engraving.' },
  { id: 'TGL-001', name: 'Glass Trophy - Modern',            item_code: 'TGL-001', category: 'trophies',         price: 1799, description: 'Sleek glass trophy with sandblasted engraving.',                                   badge: 'New' },
];

const CATEGORY_IMAGES = {
  'photo-gifts':      'https://img.icons8.com/fluency/96/picture.png',
  'customized-gifts': 'https://img.icons8.com/fluency/96/paint-palette.png',
  'trophies':         'https://img.icons8.com/fluency/96/trophy.png',
  'mementos':         'https://img.icons8.com/fluency/96/medal.png',
  'stationery':       'https://img.icons8.com/fluency/96/edit-file.png',
  'corporate-gifts':  'https://img.icons8.com/fluency/96/briefcase.png',
  'wooden':           'https://img.icons8.com/fluency/96/wood.png',
};

function getProductImageHtml(p, size) {
  size = size || 70;
  var fallback = CATEGORY_IMAGES[p.category] || 'https://img.icons8.com/fluency/96/gift.png';
  if (p.image_url) {
    return '<img src="' + p.image_url + '" alt="' + escHtml(p.name) + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;" onerror="this.src=\'' + fallback + '\'" />';
  }
  return '<img src="' + fallback + '" alt="' + escHtml(p.name) + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;opacity:0.85;" />';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function() {
  renderCategories();
  await loadProducts();
  renderCart();
  updateCartCount();
  initSearch();
  initScrollAnimations();
});

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  var loaded = false;
  try {
    var snap = await getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc')));
    if (!snap.empty) {
      allProducts = snap.docs
        .map(function(d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function(p) { return p.is_active !== false; });
      loaded = true;
    }
  } catch (e1) {
    try {
      var snap2 = await getDocs(collection(db, 'products'));
      if (!snap2.empty) {
        allProducts = snap2.docs
          .map(function(d) { return Object.assign({ id: d.id }, d.data()); })
          .filter(function(p) { return p.is_active !== false; });
        loaded = true;
      }
    } catch (e2) {
      console.warn('Firebase unavailable, using sample data:', e2.message);
    }
  }
  if (!loaded || allProducts.length === 0) {
    allProducts = SAMPLE_PRODUCTS;
  }
  renderProducts(allProducts);
}

// ===== CATEGORIES =====
function renderCategories() {
  var container = document.getElementById('categoryGrid');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(function(cat) {
    return '<div class="cat-card' + (cat.id === currentCategory ? ' active' : '') + '" onclick="filterByCategory(\'' + cat.id + '\')">'
      + '<img src="' + cat.image + '" alt="' + escHtml(cat.name) + '" class="cat-img" loading="lazy" onerror="this.style.display=\'none\'" />'
      + '<span class="cat-name">' + escHtml(cat.name) + '</span></div>';
  }).join('');
}

window.filterByCategory = function(catId) {
  currentCategory = catId;
  renderCategories();
  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.classList.remove('active');
  });
  var filtered = catId === 'all' ? allProducts : allProducts.filter(function(p) { return p.category === catId; });
  renderProducts(filtered);
  var sec = document.getElementById('productsSection');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ===== PRODUCTS =====
function renderProducts(products) {
  var grid = document.getElementById('productsGrid');
  var heading = document.getElementById('productsHeading');
  var countEl = document.getElementById('productCount');
  if (!grid) return;
  var cat = CATEGORIES.find(function(c) { return c.id === currentCategory; });
  if (heading) heading.textContent = cat ? cat.name : 'All Products';
  if (countEl) countEl.textContent = products.length > 0 ? products.length + ' products' : '';
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="icon">🔍</span><h3>No products found</h3><p>Try a different category or search term</p></div>';
    return;
  }
  grid.innerHTML = products.map(function(p) {
    return '<div class="product-card" onclick="openProductDetail(\'' + p.id + '\')" role="button" tabindex="0" aria-label="View ' + escHtml(p.name) + '">'
      + '<div class="product-img">'
      + getProductImageHtml(p, 80)
      + (p.badge ? '<span class="product-badge">' + escHtml(p.badge) + '</span>' : '')
      + '</div>'
      + '<div class="product-body">'
      + '<div class="product-category">' + getCatName(p.category) + '</div>'
      + '<div class="product-name">' + escHtml(p.name) + '</div>'
      + '<div class="product-code">Code: ' + escHtml(p.item_code || 'N/A') + '</div>'
      + '<div class="product-desc">' + escHtml(p.description || '') + '</div>'
      + '<div class="product-footer">'
      + '<div class="product-price">&#8377;' + Number(p.price).toLocaleString('en-IN') + ' <span>onwards</span></div>'
      + '<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(\'' + p.id + '\')">+ Add</button>'
      + '</div></div></div>';
  }).join('');

  // Re-init scroll animations for new cards
  initScrollAnimations();
}

function getCatName(catId) {
  var c = CATEGORIES.find(function(x) { return x.id === catId; });
  return c ? c.name : (catId || 'Gift');
}

// ===== PRODUCT DETAIL =====
window.openProductDetail = function(productId) {
  var p = allProducts.find(function(x) { return x.id === productId; });
  if (!p) return;
  currentProduct = p;
  window._currentProduct = p; // Expose for any inline scripts
  var modal = document.getElementById('productDetailModal');
  if (!modal) return;
  document.getElementById('detailImg').innerHTML = getProductImageHtml(p, 140);
  document.getElementById('detailCat').textContent = getCatName(p.category);
  document.getElementById('detailName').textContent = p.name;
  document.getElementById('detailCode').textContent = 'Item Code: ' + (p.item_code || 'N/A');
  document.getElementById('detailPrice').textContent = '₹' + Number(p.price).toLocaleString('en-IN');
  document.getElementById('detailDesc').textContent = p.description || '';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeProductDetail = function() {
  var modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.remove('active');
  currentProduct = null;
  window._currentProduct = null;
  document.body.style.overflow = '';
};

window.addToCartFromDetail = function() {
  if (currentProduct) {
    addToCart(currentProduct.id);
    window.closeProductDetail();
  }
};

window.orderDirectWhatsApp = function() {
  var p = currentProduct;
  if (!p) return;
  var msg = 'Hi! I\'m interested in ordering:\n\n🎁 *' + p.name + '*\nCode: ' + (p.item_code || 'N/A') + '\nPrice: ₹' + Number(p.price).toLocaleString('en-IN') + '\n\nPlease let me know availability and customization options.';
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
};

// ===== CART =====
window.addToCart = function(productId) {
  var product = allProducts.find(function(p) { return p.id === productId; });
  if (!product) return;
  var existing = cart.find(function(c) { return c.id === productId; });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push(Object.assign({}, product, { qty: 1 }));
  }
  saveCart();
  renderCart();
  updateCartCount();
  showToast('✅ "' + product.name + '" added to cart', 'success');
};

// Also make addToCart accessible as local (used above)
function addToCart(productId) { window.addToCart(productId); }

window.removeFromCart = function(productId) {
  cart = cart.filter(function(c) { return c.id !== productId; });
  saveCart();
  renderCart();
  updateCartCount();
};

window.updateQty = function(productId, delta) {
  var item = cart.find(function(c) { return c.id === productId; });
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
};

function saveCart() {
  try { localStorage.setItem('tah_cart', JSON.stringify(cart)); } catch(e) {}
}

function renderCart() {
  var container = document.getElementById('cartItems');
  var total = document.getElementById('cartTotal');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-state"><span class="icon">🛒</span><h3>Your cart is empty</h3><p>Browse our collection and add items!</p></div>';
    if (total) total.textContent = '₹0';
    return;
  }
  container.innerHTML = cart.map(function(item) {
    return '<div class="cart-item">'
      + '<div class="cart-item-icon">' + getProductImageHtml(item, 40) + '</div>'
      + '<div class="cart-item-info">'
      + '<h4>' + escHtml(item.name) + '</h4>'
      + '<div class="price">₹' + Number(item.price).toLocaleString('en-IN') + '</div>'
      + '<div class="cart-item-qty">'
      + '<button class="qty-btn" onclick="updateQty(\'' + item.id + '\',-1)" aria-label="Decrease quantity">−</button>'
      + '<span class="qty-display">' + item.qty + '</span>'
      + '<button class="qty-btn" onclick="updateQty(\'' + item.id + '\',1)" aria-label="Increase quantity">+</button>'
      + '<button class="qty-btn" onclick="removeFromCart(\'' + item.id + '\')" style="margin-left:6px;color:#c0392b" aria-label="Remove item">🗑️</button>'
      + '</div></div></div>';
  }).join('');
  var totalAmt = cart.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
  if (total) total.textContent = '₹' + totalAmt.toLocaleString('en-IN');
}

function updateCartCount() {
  var count = document.getElementById('cartCount');
  var total = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  if (count) {
    count.textContent = total;
    count.style.display = total > 0 ? 'flex' : 'none';
  }
}

window.toggleCart = function() {
  document.getElementById('cartSidebar').classList.toggle('active');
  document.getElementById('cartOverlay').classList.toggle('active');
};

window.closeCart = function() {
  document.getElementById('cartSidebar').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
};

// ===== ORDER MODAL =====
window.openOrderModal = function() {
  if (!cart.length) { showToast('🛒 Add items to your cart first!', 'info'); return; }
  var summary = cart.map(function(i) {
    return i.name + ' (x' + i.qty + ') — ₹' + (i.price * i.qty).toLocaleString('en-IN');
  }).join('\n');
  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  document.getElementById('orderSummaryText').textContent = summary + '\n\nTotal: ₹' + total.toLocaleString('en-IN');
  document.getElementById('orderModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  window.closeCart();
};

window.closeOrderModal = function() {
  document.getElementById('orderModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.submitOrder = async function() {
  var name    = document.getElementById('orderName').value.trim();
  var phone   = document.getElementById('orderPhone').value.trim();
  var address = document.getElementById('orderAddress').value.trim();
  var notes   = document.getElementById('orderNotes').value.trim();
  if (!name || !phone) { showToast('⚠️ Please fill your name and phone number', 'info'); return; }
  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var itemsList = cart.map(function(i) { return '• ' + i.name + ' (x' + i.qty + ') — ₹' + (i.price * i.qty).toLocaleString('en-IN'); }).join('\n');
  // Save order to Firebase (non-blocking)
  try {
    await addDoc(collection(db, 'orders'), {
      customer_name: name,
      customer_phone: phone,
      delivery_address: address || '',
      notes: notes || '',
      items: JSON.stringify(cart),
      total_amount: total,
      status: 'pending',
      created_at: serverTimestamp()
    });
  } catch (e) {
    console.warn('Order save to Firestore failed (will still send WhatsApp):', e.message);
  }
  var msg = '🎁 *New Order - The Artisans Hub*\n\n'
    + '👤 *Customer:* ' + name + '\n'
    + '📱 *Phone:* ' + phone + '\n'
    + '📍 *Address:* ' + (address || 'Not provided') + '\n\n'
    + '🛒 *Items:*\n' + itemsList + '\n\n'
    + '💰 *Total:* ₹' + total.toLocaleString('en-IN') + '\n\n'
    + '📝 *Notes:* ' + (notes || 'None') + '\n\n'
    + new Date().toLocaleString('en-IN');
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
  cart = [];
  saveCart();
  renderCart();
  updateCartCount();
  window.closeOrderModal();
  showToast('🎉 Order sent via WhatsApp!', 'success');
  ['orderName', 'orderPhone', 'orderAddress', 'orderNotes'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
};

// ===== QUICK ORDER (for custom section cards) =====
window.quickOrder = function(itemName) {
  var msg = 'Hi! I\'m interested in a custom order for:\n\n🎁 *' + itemName + '*\n\nPlease share details, pricing and availability. Thank you!';
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
};

// ===== SEARCH =====
function initSearch() {
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  if (!input || !results) return;

  input.addEventListener('input', function() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.classList.remove('active'); return; }
    var matches = allProducts.filter(function(p) {
      return p.name.toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q)
        || (p.item_code || '').toLowerCase().includes(q);
    }).slice(0, 8);
    if (!matches.length) { results.classList.remove('active'); return; }
    results.innerHTML = matches.map(function(p) {
      return '<div class="search-result-item" onclick="handleSearchClick(\'' + p.id + '\')">'
        + '<div style="width:40px;height:40px;background:var(--bg-cream);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">'
        + getProductImageHtml(p, 36) + '</div>'
        + '<div class="item-info">'
        + '<div class="name">' + escHtml(p.name) + '</div>'
        + '<div class="cat">' + getCatName(p.category) + ' · ₹' + Number(p.price).toLocaleString('en-IN') + '</div>'
        + '</div></div>';
    }).join('');
    results.classList.add('active');
  });

  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('active');
    }
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') results.classList.remove('active');
  });
}

window.handleSearchClick = function(productId) {
  document.getElementById('searchResults').classList.remove('active');
  document.getElementById('searchInput').value = '';
  window.openProductDetail(productId);
};

// ===== TOAST =====
window.showToast = function(msg, type) {
  type = type || 'info';
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3200);
};

function showToast(msg, type) { window.showToast(msg, type || 'info'); }

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.product-card:not([data-observed]), .cat-card:not([data-observed]), .feature-item:not([data-observed])').forEach(function(el) {
    el.setAttribute('data-observed', '1');
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.closeProductDetail();
    window.closeOrderModal();
    window.closeCart();
  }
});

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', function() {
  var orderModal = document.getElementById('orderModal');
  var productModal = document.getElementById('productDetailModal');
  if (orderModal) {
    orderModal.addEventListener('click', function(e) {
      if (e.target === orderModal) window.closeOrderModal();
    });
  }
  if (productModal) {
    productModal.addEventListener('click', function(e) {
      if (e.target === productModal) window.closeProductDetail();
    });
  }
});
