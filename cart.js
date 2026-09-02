// ============================================================
//  Scentonish – Cart System v1.0
//  Shared across all pages
// ============================================================

const CART = (() => {
  const CART_KEY = 'scentonish_cart';
  const WA_NUMBER = '923457566768';
  const STORE_EMAIL = 'scentonish@gmail.com';

  // ── STATE ──────────────────────────────────────────────────
  function getItems() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e) { return []; }
  }
  function saveItems(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateAllBadges();
    window.dispatchEvent(new CustomEvent('cart_updated'));
  }
  function getCount() { return getItems().reduce((s,i) => s + i.qty, 0); }
  function getTotal() { return getItems().reduce((s,i) => s + i.price * i.qty, 0); }

  // ── ACTIONS ────────────────────────────────────────────────
 function addItem(product) {
  const items = getItems();
  const existing = items.find(i => i.id === product.id);
  if (existing) { existing.qty += 1; }   // ← yahan bug hai
  else { items.push({ ...product, qty: 1 }); }
  saveItems(items);
  showAddedToast(product.name);
}
  function removeItem(id) {
    saveItems(getItems().filter(i => i.id !== id));
  }
  function updateQty(id, qty) {
    if (qty < 1) { removeItem(id); return; }
    const items = getItems();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = qty; saveItems(items); }
  }
  function clearCart() { saveItems([]); }

  // ── BADGE UPDATE ───────────────────────────────────────────
  function updateAllBadges() {
    const count = getCount();
    const container = document.getElementById('cartIconContainer');
    if(container) {
      container.innerHTML = getCartIconHTML();
      const badge = container.querySelector('.cart-badge');
      if(badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    }
  }

  // ── TOAST ──────────────────────────────────────────────────
  function showAddedToast(name) {
    let toast = document.getElementById('cart-add-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-add-toast';
      toast.style.cssText = `position:fixed;bottom:90px;right:28px;z-index:9999;
        background:#2a1f1a;color:#fff;padding:12px 18px;border-radius:12px;
        font-size:.82rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.25);
        transform:translateY(20px);opacity:0;transition:.3s;pointer-events:none;
        border-left:3px solid #a8413a;font-family:'Plus Jakarta Sans',sans-serif;`;
      document.body.appendChild(toast);
    }
    toast.textContent = '🛒 "' + name + '" has been added to your cart!';
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
    }, 2500);
  }

  // ── CART DRAWER HTML ──────────────────────────────────────
  function injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const html = `
    <div id="cart-overlay" onclick="CART.closeDrawer()" style="display:none;position:fixed;inset:0;background:rgba(42,31,26,.5);z-index:500;backdrop-filter:blur(4px);transition:.3s;"></div>

    <div id="cart-drawer" style="position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);background:#fff;z-index:501;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(42,31,26,.15);">
      <!-- Header -->
      <div style="padding:18px 20px;border-bottom:1px solid #e8ddd5;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <div style="font-family:'Playfair Display','Outfit',serif;font-size:1.1rem;font-weight:900;color:#2a1f1a;">🛒 Your Cart</div>
          <div style="font-size:.72rem;color:#8b7b72;margin-top:2px;" id="cart-item-count">0 items</div>
        </div>
        <button onclick="CART.closeDrawer()" style="background:#f0ebe5;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;color:#5a4a42;transition:.2s;" onmouseover="this.style.background='#e8ddd5'" onmouseout="this.style.background='#f0ebe5'">✕</button>
      </div>

      <!-- Items -->
      <div id="cart-items-list" style="flex:1;overflow-y:auto;padding:16px 20px;"></div>

      <!-- Footer -->
      <div id="cart-footer" style="padding:16px 20px;border-top:1px solid #e8ddd5;flex-shrink:0;display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span style="font-size:.85rem;color:#5a4a42;font-weight:600;">Subtotal</span>
          <span id="cart-subtotal" style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;color:#a8413a;"></span>
        </div>
        <div style="font-size:.72rem;color:#8b7b72;margin-bottom:12px;text-align:center;"><div>
        <button onclick="CART.openCheckout()" style="width:100%;padding:13px;background:linear-gradient(135deg,#a8413a,#c85a4a);color:#fff;border:none;border-radius:50px;font-size:.92rem;font-weight:700;cursor:pointer;transition:.2s;font-family:'Plus Jakarta Sans','Inter',sans-serif;margin-bottom:8px;" onmouseover="this.style.background='#8a3530'" onmouseout="this.style.background='linear-gradient(135deg,#a8413a,#c85a4a)'">✓ Proceed to Checkout</button>
        <button onclick="CART.clearCart();CART.renderDrawer()" style="width:100%;padding:9px;background:transparent;color:#8b7b72;border:1px solid #e8ddd5;border-radius:50px;font-size:.8rem;cursor:pointer;font-family:'Plus Jakarta Sans','Inter',sans-serif;">🗑️ Clear Cart</button>
      </div>
    </div>

    <!-- CHECKOUT MODAL -->
    <div id="checkout-modal" style="display:none;position:fixed;inset:0;z-index:600;background:rgba(42,31,26,.6);backdrop-filter:blur(6px);overflow-y:auto;padding:16px;">
      <div id="checkout-box" style="background:#fff;border-radius:16px;max-width:540px;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(42,31,26,.25);">
        <!-- Checkout Header -->
        <div style="background:linear-gradient(135deg,#2a1f1a,#3d3530);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-family:'Playfair Display','Outfit',serif;font-size:1.15rem;font-weight:900;color:#fff;">📦 Order Details</div>
            <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:2px;">Please fill in all fields</div>
          </div>
          <button onclick="CART.closeCheckout()" style="background:rgba(255,255,255,.1);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#fff;font-size:.9rem;">✕</button>
        </div>

        <div style="padding:24px;">
          <!-- Order Summary -->
          <div style="background:#faf8f5;border:1px solid #e8ddd5;border-radius:12px;padding:14px;margin-bottom:20px;">
            <div style="font-size:.72rem;color:#8b7b72;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">🛒 Order Summary</div>
            <div id="checkout-items-summary"></div>
            <div style="border-top:1px solid #e8ddd5;margin-top:10px;padding-top:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:.82rem;color:#5a4a42;">Subtotal</span>
                <span id="co-subtotal" style="font-family:'JetBrains Mono',monospace;font-size:.88rem;font-weight:600;color:#2a1f1a;"></span>
              </div>
              <div id="co-discount-row" style="display:none;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:.82rem;color:#16a34a;">🎁 Discount</span>
                <span id="co-discount-val" style="font-family:'JetBrains Mono',monospace;font-size:.88rem;font-weight:700;color:#16a34a;"></span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:.85rem;font-weight:700;color:#2a1f1a;">Total</span>
                <span id="co-total" style="font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:800;color:#a8413a;"></span>
              </div>
            </div>
          </div>

          <!-- Promo Code -->
          <div style="margin-bottom:18px;">
            <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px;">🎁 Promo Code (Optional)</label>
            <div style="display:flex;gap:8px;">
              <input type="text" id="promo-input" placeholder="e.g. SAVE10" style="flex:1;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.85rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;" oninput="this.value=this.value.toUpperCase()"/>
              <button onclick="CART.applyPromo()" style="padding:10px 16px;background:#2a1f1a;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:.8rem;font-weight:700;font-family:'Plus Jakarta Sans','Inter',sans-serif;transition:.2s;white-space:nowrap;">Apply</button>
            </div>
            <div id="promo-msg" style="font-size:.72rem;margin-top:5px;height:16px;"></div>
          </div>

          <!-- Form Fields -->
          <div style="display:flex;flex-direction:column;gap:13px;">
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">👤 Full Name *</label>
              <input type="text" id="co-name" placeholder="Your full name" style="width:100%;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.88rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;transition:.2s;" onfocus="this.style.borderColor='#a8413a'" onblur="this.style.borderColor='#e8ddd5'"/>
            </div>
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">📱 Phone Number *</label>
              <input type="tel" id="co-phone" placeholder="03XX-XXXXXXX" style="width:100%;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.88rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;transition:.2s;" onfocus="this.style.borderColor='#a8413a'" onblur="this.style.borderColor='#e8ddd5'"/>
            </div>
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">📧 Email Address *</label>
              <input type="email" id="co-email" placeholder="your@email.com" style="width:100%;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.88rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;transition:.2s;" onfocus="this.style.borderColor='#a8413a'" onblur="this.style.borderColor='#e8ddd5'"/>
            </div>
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">🏙️ City *</label>
              <select id="co-city" style="width:100%;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.88rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;cursor:pointer;transition:.2s;" onfocus="this.style.borderColor='#a8413a'" onblur="this.style.borderColor='#e8ddd5'">
                <option value="">-- Select your city --</option>
                <option>Lahore</option><option>Karachi</option><option>Islamabad</option>
                <option>Rawalpindi</option><option>Faisalabad</option><option>Multan</option>
                <option>Peshawar</option><option>Quetta</option><option>Sialkot</option>
                <option>Gujranwala</option><option>Other</option>
              </select>
            </div>
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px;">🏠 Complete Address *</label>
              <textarea id="co-address" placeholder="House/street/area full address" rows="2" style="width:100%;padding:10px 14px;border:1px solid #e8ddd5;border-radius:10px;font-size:.88rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;color:#2a1f1a;outline:none;background:#faf8f5;resize:none;transition:.2s;" onfocus="this.style.borderColor='#a8413a'" onblur="this.style.borderColor='#e8ddd5'"></textarea>
            </div>
            <div>
              <label style="font-size:.7rem;font-weight:700;color:#5a4a42;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:8px;">💳 Payment Method *</label>
              <div style="display:flex;gap:10px;">
                <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #e8ddd5;border-radius:10px;cursor:pointer;font-size:.85rem;color:#2a1f1a;font-weight:600;transition:.2s;" id="pay-cod-label">
                  <input type="radio" name="payment" value="COD" id="pay-cod" onchange="CART.highlightPayment()" style="accent-color:#a8413a;" checked/> 💵 Cash on Delivery
                </label>
                <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #e8ddd5;border-radius:10px;cursor:pointer;font-size:.85rem;color:#2a1f1a;font-weight:600;transition:.2s;" id="pay-bank-label">
                  <input type="radio" name="payment" value="Bank" id="pay-bank" onchange="CART.highlightPayment()" style="accent-color:#a8413a;"/> 🏦 Bank Transfer
                </label>
              </div>
            </div>
          </div>

          <!-- Error msg -->
          <div id="co-error" style="display:none;margin-top:12px;padding:10px 14px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;font-size:.8rem;color:#a8413a;font-weight:600;"></div>

          <!-- Place Order Button -->
          <button onclick="CART.placeOrder()" style="width:100%;margin-top:18px;padding:14px;background:linear-gradient(135deg,#a8413a,#c85a4a);color:#fff;border:none;border-radius:50px;font-size:.95rem;font-weight:700;cursor:pointer;transition:.2s;font-family:'Plus Jakarta Sans','Inter',sans-serif;" onmouseover="this.style.background='#8a3530'" onmouseout="this.style.background='linear-gradient(135deg,#a8413a,#c85a4a)'">🎉 Place Order</button>
        </div>
      </div>
    </div>

    <!-- SUCCESS MODAL -->
    <div id="success-modal" style="display:none;position:fixed;inset:0;z-index:700;background:rgba(42,31,26,.7);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:16px;">
      <div style="background:#fff;border-radius:20px;max-width:460px;width:100%;padding:32px;text-align:center;box-shadow:0 24px 60px rgba(42,31,26,.3);animation:successPop .5s cubic-bezier(.22,1,.36,1);">
        <div style="width:72px;height:72px;background:linear-gradient(135deg,#dcfce7,#bbf7d0);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 20px;">✅</div>
        <div style="font-family:'Playfair Display','Outfit',serif;font-size:1.4rem;font-weight:900;color:#2a1f1a;margin-bottom:8px;">Thank You! 🎉</div>
        <div id="success-order-num" style="font-size:.78rem;color:#8b7b72;margin-bottom:16px;"></div>
        <div style="background:#faf8f5;border-radius:12px;padding:14px;margin-bottom:20px;font-size:.85rem;color:#5a4a42;line-height:1.7;" id="success-summary"></div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a id="wa-order-link" href="#" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:13px;background:linear-gradient(135deg,#25D366,#20ba5a);color:#fff;border-radius:50px;font-weight:700;font-size:.9rem;text-decoration:none;transition:.2s;">💬 Confirm on WhatsApp</a>
          <div style="font-size:.75rem;color:#8b7b72;padding:8px 12px;background:#f0ebe5;border-radius:8px;">📧 A confirmation email has been sent to <span id="success-email" style="font-weight:700;color:#a8413a;"></span></div>
          <button onclick="CART.closeSuccess()" style="padding:10px;background:transparent;border:1px solid #e8ddd5;border-radius:50px;cursor:pointer;color:#5a4a42;font-size:.82rem;font-family:'Plus Jakarta Sans','Inter',sans-serif;">✕ Close</button>
        </div>
      </div>
    </div>
    <style>
    @keyframes successPop {
      from { transform:scale(.85); opacity:0; }
      to { transform:scale(1); opacity:1; }
    }
    </style>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    renderDrawer();
    updateAllBadges();
    highlightPayment();
  }

  // ── RENDER DRAWER ─────────────────────────────────────────
  function renderDrawer() {
    const items = getItems();
    const listEl = document.getElementById('cart-items-list');
    const footerEl = document.getElementById('cart-footer');
    const countEl = document.getElementById('cart-item-count');
    if (!listEl) return;

    const count = getCount();
    if (countEl) countEl.textContent = count + ' item' + (count !== 1 ? 's' : '');

    if (!items.length) {
      listEl.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#8b7b72;">
        <div style="font-size:3rem;margin-bottom:12px;">🛒</div>
        <div style="font-size:.9rem;font-weight:600;">Your cart is empty</div>
        <div style="font-size:.78rem;margin-top:6px;">Add some products to get started</div>
      </div>`;
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f0ebe5;align-items:center;">
        <div style="width:58px;height:58px;background:linear-gradient(135deg,#fdf3ed,#f5ede5);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.6rem;overflow:hidden;">
          ${item.img ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;" onerror="this.parentElement.textContent='${item.emoji||'🌹'}'"/>` : (item.emoji||'🌹')}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.83rem;font-weight:700;color:#2a1f1a;line-height:1.3;margin-bottom:4px;">${item.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:.8rem;font-weight:700;color:#a8413a;">Rs. ${(item.price*item.qty).toLocaleString('en-PK')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button onclick="CART.updateQty('${item.id}',${item.qty-1})" style="width:26px;height:26px;background:#f0ebe5;border:none;border-radius:6px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;color:#2a1f1a;transition:.15s;" onmouseover="this.style.background='#e8ddd5'" onmouseout="this.style.background='#f0ebe5'">−</button>
          <span style="min-width:20px;text-align:center;font-size:.85rem;font-weight:700;color:#2a1f1a;">${item.qty}</span>
          <button onclick="CART.updateQty('${item.id}',${item.qty+1})" style="width:26px;height:26px;background:#f0ebe5;border:none;border-radius:6px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;color:#2a1f1a;transition:.15s;" onmouseover="this.style.background='#e8ddd5'" onmouseout="this.style.background='#f0ebe5'">+</button>
          <button onclick="CART.removeItem('${item.id}');CART.renderDrawer()" style="width:26px;height:26px;background:#fee2e2;border:none;border-radius:6px;cursor:pointer;font-size:.75rem;color:#a8413a;margin-left:2px;transition:.15s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'">✕</button>
        </div>
      </div>
    `).join('');

    const total = getTotal();
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = 'Rs. ' + total.toLocaleString('en-PK');
    if (footerEl) footerEl.style.display = 'block';
  }

  // ── OPEN / CLOSE DRAWER ───────────────────────────────────
  function openDrawer() {
    renderDrawer();
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) { drawer.style.transform = 'translateX(0)'; }
    if (overlay) { overlay.style.display = 'block'; setTimeout(() => overlay.style.opacity = '1', 10); }
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.style.transform = 'translateX(100%)';
    if (overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 300); }
    document.body.style.overflow = '';
  }

  // ── PROMO CODES ───────────────────────────────────────────
  let _discount = 0;
  let _promoApplied = '';
  const PROMOS = {
    'SAVE10':     { type:'percent', val:10,  label:'10% discount' },
    'WELCOME':    { type:'flat',    val:200, label:'Rs. 200 off' },
    'EID20':      { type:'percent', val:20,  label:'20% discount' },
    'SCENTONISH': { type:'percent', val:15,  label:'15% discount' },
  };

  function applyPromo() {
    const code = (document.getElementById('promo-input')?.value || '').trim().toUpperCase();
    const msgEl = document.getElementById('promo-msg');
    if (!code) { if(msgEl) { msgEl.textContent = '⚠️ Please enter a code'; msgEl.style.color = '#a8413a'; } return; }
    const promo = PROMOS[code];
    if (!promo) {
      _discount = 0; _promoApplied = '';
      if(msgEl) { msgEl.textContent = '❌ Invalid code'; msgEl.style.color = '#a8413a'; }
    } else {
      const subtotal = getTotal();
      _discount = promo.type === 'percent' ? Math.round(subtotal * promo.val / 100) : Math.min(promo.val, subtotal);
      _promoApplied = code;
      if(msgEl) { msgEl.textContent = '✅ ' + promo.label + ' applied!'; msgEl.style.color = '#16a34a'; }
    }
    updateCheckoutTotals();
  }

  function updateCheckoutTotals() {
    const subtotal = getTotal();
    const finalTotal = Math.max(0, subtotal - _discount);
    const coSubtotal = document.getElementById('co-subtotal');
    const coTotal = document.getElementById('co-total');
    const discRow = document.getElementById('co-discount-row');
    const discVal = document.getElementById('co-discount-val');
    if (coSubtotal) coSubtotal.textContent = 'Rs. ' + subtotal.toLocaleString('en-PK');
    if (coTotal) coTotal.textContent = 'Rs. ' + finalTotal.toLocaleString('en-PK');
    if (_discount > 0) {
      if (discRow) discRow.style.display = 'flex';
      if (discVal) discVal.textContent = '− Rs. ' + _discount.toLocaleString('en-PK');
    } else {
      if (discRow) discRow.style.display = 'none';
    }
  }

  function openCheckout() {
    closeDrawer();
    window.location.href = 'checkout.html';
  }
  function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── HIGHLIGHT PAYMENT ─────────────────────────────────────
  function highlightPayment() {
    const codLabel = document.getElementById('pay-cod-label');
    const bankLabel = document.getElementById('pay-bank-label');
    const cod = document.getElementById('pay-cod');
    if (codLabel && bankLabel && cod) {
      codLabel.style.borderColor = cod.checked ? '#a8413a' : '#e8ddd5';
      codLabel.style.background = cod.checked ? 'rgba(168,65,58,.06)' : '#fff';
      bankLabel.style.borderColor = !cod.checked ? '#a8413a' : '#e8ddd5';
      bankLabel.style.background = !cod.checked ? 'rgba(168,65,58,.06)' : '#fff';
    }
  }

  // ── PLACE ORDER ───────────────────────────────────────────
  function placeOrder() {
    const name    = document.getElementById('co-name')?.value.trim();
    const phone   = document.getElementById('co-phone')?.value.trim();
    const email   = document.getElementById('co-email')?.value.trim();
    const city    = document.getElementById('co-city')?.value;
    const address = document.getElementById('co-address')?.value.trim();
    const payment = document.querySelector('input[name="payment"]:checked')?.value;
    const errorEl = document.getElementById('co-error');

    // Validation
    const errors = [];
    if (!name)    errors.push('Full name is required');
    if (!phone || phone.length < 10) errors.push('Please enter a valid phone number');
    if (!email || !email.includes('@')) errors.push('Please enter a valid email address');
    if (!city)    errors.push('Please select your city');
    if (!address) errors.push('Delivery address is required');
    if (!payment) errors.push('Please select a payment method');

    if (errors.length) {
      if (errorEl) { errorEl.textContent = '⚠️ ' + errors[0]; errorEl.style.display = 'block'; }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    const items = getItems();
    const subtotal = getTotal();
    const finalTotal = Math.max(0, subtotal - _discount);
    const orderNum = 'SNS-' + Date.now().toString().slice(-5);

    // Build WhatsApp message
    const itemsText = items.map(i => `  • ${i.name} ×${i.qty} = Rs. ${(i.price*i.qty).toLocaleString('en-PK')}`).join('\n');
    const discountLine = _discount > 0 ? `\n🎁 Discount: −Rs. ${_discount.toLocaleString('en-PK')} (${_promoApplied})` : '';
    const waText = encodeURIComponent(
      `🛍️ *NEW ORDER — ${orderNum}*\n\n` +
      `👤 Name: ${name}\n` +
      `📱 Phone: ${phone}\n` +
      `📧 Email: ${email}\n` +
      `🏙️ City: ${city}\n` +
      `🏠 Address: ${address}\n` +
      `💳 Payment: ${payment}\n\n` +
      `📦 *Order Items:*\n${itemsText}\n` +
      `💰 Subtotal: Rs. ${subtotal.toLocaleString('en-PK')}` +
      discountLine +
      `\n✅ *Total: Rs. ${finalTotal.toLocaleString('en-PK')}*\n\n` +
      `Please confirm this order. Thank you! 🙏`
    );

    // Show success modal
    closeCheckout();
    const successModal = document.getElementById('success-modal');
    if (successModal) {
      document.getElementById('success-order-num').textContent = `Order #${orderNum} · ${new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}`;
      document.getElementById('success-summary').innerHTML =
        `<strong>${name}</strong> — ${city}<br>` +
        `📱 ${phone}<br>` +
        `💳 ${payment}<br>` +
        `<strong style="color:#a8413a;">Total: Rs. ${finalTotal.toLocaleString('en-PK')}</strong>` +
        (_discount > 0 ? ` <span style="color:#16a34a;font-size:.78rem;">(You saved Rs. ${_discount.toLocaleString('en-PK')}!)</span>` : '');
      document.getElementById('wa-order-link').href = `https://wa.me/${WA_NUMBER}?text=${waText}`;
      document.getElementById('success-email').textContent = email;
      successModal.style.display = 'flex';
    }

    clearCart();
    renderDrawer();
    document.body.style.overflow = 'hidden';
  }

  function closeSuccess() {
    const m = document.getElementById('success-modal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── CART ICON HTML ────────────────────────────────────────
  function getCartIconHTML() {
    return `<button onclick="CART.openDrawer()" style="position:relative;background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;gap:6px;color:#5a4a42;font-size:.88rem;font-weight:600;border-radius:8px;transition:.2s;font-family:'Plus Jakarta Sans','Inter',sans-serif;" onmouseover="this.style.color='#a8413a'" onmouseout="this.style.color='#5a4a42'">
      <span style="font-size:1.25rem;">🛒</span>
      <span class="cart-badge" style="position:absolute;top:0;right:0;background:#a8413a;color:#fff;border-radius:50%;width:18px;height:18px;font-size:.6rem;font-weight:800;display:none;align-items:center;justify-content:center;line-height:1;"></span>
    </button>`;
  }

  // ── INIT ──────────────────────────────────────────────────
  function init() {
    injectCartDrawer();
    window.addEventListener('cart_updated', renderDrawer);
  }

  return {
    init, getItems, getCount, getTotal,
    addItem, removeItem, updateQty, clearCart,
    openDrawer, closeDrawer,
    openCheckout, closeCheckout,
    applyPromo, highlightPayment,
    placeOrder, closeSuccess,
    renderDrawer,
    getCartIconHTML,
    updateAllBadges,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  CART.init();

  // Inject cart icon on every page
  const container = document.getElementById('cartIconContainer');
  if(container) {
    container.innerHTML = CART.getCartIconHTML();
  }

  // Update badge immediately
  CART.updateAllBadges();
});
