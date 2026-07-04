// ============================================================
//  Scentonish – Perfume Store Data Store v4.0
//  CACHE-FIRST: pehle localStorage se dikhao, phir sync karo
// ============================================================
// https://docs.google.com/spreadsheets/d/1xj7YjE8lV8lzVkooKfwMCQdm5QWE10t2_KHVdjYGEHc/edit?gid=1486542084#gid=1486542084
const IH = (() => {

  const API = 'https://script.google.com/macros/s/AKfycbySfbAdZ6zwxDyg1MwSFpTW-8FdshgPIT-Hqms6ikJWduMwBSnMc7y6PYuFVZy-prAL/exec';
  const IMGBB_KEY = '31e9918c8fad5274d676dfeccd8647d2';
  const CACHE_KEY_P = 'ih_products_cache';
  const CACHE_KEY_S = 'ih_sales_cache';

  let _products = [];
  let _sales    = [];
  let _ready    = false;



  // ════════════════════════════════════════
  // SAFE PARSE HELPERS
  // ════════════════════════════════════════

  function safeParseArray(val, fallback) {
    if (!val || val === '' || val === 'undefined' || val === 'null') return fallback || [];
    if (Array.isArray(val)) return val;
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : (fallback || []); }
    catch (e) { return fallback || []; }
  }

  function safeParseObject(val, fallback) {
    if (!val || val === '' || val === 'undefined' || val === 'null') return fallback || {};
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    try { const p = JSON.parse(val); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : (fallback || {}); }
    catch (e) { return fallback || {}; }
  }

  function normalizeProduct(p) {
    return {
      ...p,
      price:        Number(p.price)   || 0,
      cost:         Number(p.cost)    || 0,
      stock:        Number(p.stock)   || 0,
      rating:       Number(p.rating)  || 4.5,
      reviews:      Number(p.reviews) || 0,
      gallery:      safeParseArray(p.gallery),
      videos:       safeParseArray(p.videos),
      details:      safeParseArray(p.details),
      reviews_list: safeParseArray(p.reviews_list),
      specs:        safeParseObject(p.specs),
      packaging: safeParseArray(p.packaging),
volumes: (() => {
  if (Array.isArray(p.volumes) && p.volumes.length > 0) return p.volumes;
  if (typeof p.volumes === 'string' && p.volumes.trim() && p.volumes !== '[]') {
    try {
      const parsed = JSON.parse(p.volumes);
      return Array.isArray(parsed) ? parsed : [];
    } catch(e) { return []; }
  }
  return [];
})(),
    };
  }

function serializeProduct(p) {
  function cleanImg(src) {
    if (!src) return '';
    if (String(src).startsWith('data:')) return '';
    return src;
  }
  function cleanGallery(arr) {
    if (!Array.isArray(arr)) return '[]';
    return JSON.stringify(arr.filter(src => src && !String(src).startsWith('data:')));
  }
  return {
    ...p,
    img:          cleanImg(p.img),
    gallery:      cleanGallery(p.gallery),
    videos:       JSON.stringify(Array.isArray(p.videos)       ? p.videos       : []),
    details:      JSON.stringify(Array.isArray(p.details)      ? p.details      : []),
    reviews_list: JSON.stringify(Array.isArray(p.reviews_list) ? p.reviews_list : []),
    specs:        JSON.stringify((p.specs && typeof p.specs === 'object') ? p.specs : {}),
    volumes:      JSON.stringify(Array.isArray(p.volumes)      ? p.volumes      : []),
    packaging:    JSON.stringify(Array.isArray(p.packaging)    ? p.packaging    : []),
  };
}

  // ════════════════════════════════════════
  // IMGBB UPLOAD
  // ════════════════════════════════════════
  async function uploadToImgBB(base64OrFile) {
    try {
      const formData = new FormData();
      if (base64OrFile instanceof Blob || base64OrFile instanceof File) {
        formData.append('image', base64OrFile);
      } else if (typeof base64OrFile === 'string') {
        const base64Data = base64OrFile.includes(',') ? base64OrFile.split(',')[1] : base64OrFile;
        formData.append('image', base64Data);
      } else {
        return null;
      }
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch(e) {
      console.error('ImgBB upload failed:', e);
      return null;
    }
  }

  // ════════════════════════════════════════
  // API CALL HELPER
  // ════════════════════════════════════════
  async function apiCall(action, data) {
  data = data || {};
  try {
    // Encode everything as URL params — GET is more reliable with Apps Script
    const params = new URLSearchParams();
    params.append('action', action);
    Object.keys(data).forEach(function(key) {
      const val = data[key];
      if (val === null || val === undefined) return;
      if (typeof val === 'object') {
        params.append(key, JSON.stringify(val));
      } else {
        params.append(key, String(val));
      }
    });

    const res = await fetch(API + '?' + params.toString(), {
      method: 'GET',
    });

    const result = await res.json();
    return result;
  } catch (err) {
    console.error('API Error [' + action + ']:', err);
    return { error: err.message };
  }
}

  // ════════════════════════════════════════
  // CACHE HELPERS
  // ════════════════════════════════════════
  function loadFromCache() {
    try {
      const cachedP = localStorage.getItem(CACHE_KEY_P);
      const cachedS = localStorage.getItem(CACHE_KEY_S);
      if (cachedP) {
        const parsed = JSON.parse(cachedP);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _products = parsed.map(normalizeProduct);
        }
      }
      if (cachedS) {
        const parsedS = JSON.parse(cachedS);
        if (Array.isArray(parsedS)) _sales = parsedS;
      }
    } catch(e) {
      console.warn('Cache read error:', e);
    }
  }

  function saveToCache() {
    try {
      localStorage.setItem(CACHE_KEY_P, JSON.stringify(_products));
      localStorage.setItem(CACHE_KEY_S, JSON.stringify(_sales));
    } catch(e) {
      console.warn('Cache write error:', e);
    }
  }

  // ════════════════════════════════════════
  // INIT — CACHE-FIRST STRATEGY
  // Step 1: Cache se foran dikhao (instant)
  // Step 2: Background mein Google Sheets se fetch
  // Step 3: Agar naya data aaya to silently update
  // ════════════════════════════════════════
  async function init() {
console.log('Cache se products:', _products.length); // yahan check karo
    // STEP 1: Cache se turant dikhao — page instant load hoga
    loadFromCache();

    if (_products.length > 0) {
      // Cache mein data hai — foran UI update karo
      _ready = true;
      window.dispatchEvent(new CustomEvent('ih_products_updated'));
      window.dispatchEvent(new CustomEvent('ih_sales_updated'));
    }

    // STEP 2: Background mein Google Sheets se fresh data fetch karo
    _backgroundSync();
  }

  async function _backgroundSync() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(API + '?action=getProducts').then(r => r.json()),
        fetch(API + '?action=getSales').then(r => r.json()),
      ]);

      let changed = false;

      if (Array.isArray(pRes) && pRes.length > 0) {
        const newProducts = pRes.map(normalizeProduct);
        // Sirf tab update karo jab data actually change hua ho
        // NAYI code — sirf length aur IDs compare karo:
const newIds = newProducts.map(p => p.id).sort().join(',');
const oldIds = _products.map(p => p.id).sort().join(',');
if (true) {
          _products = newProducts;
          changed = true;
        }
      }

      if (Array.isArray(sRes)) {
        _sales = sRes;
        changed = true;
      }

      if (changed) {
        saveToCache();
        _ready = true;
        window.dispatchEvent(new CustomEvent('ih_products_updated'));
        window.dispatchEvent(new CustomEvent('ih_sales_updated'));
      } else {
        _ready = true;
      }

    } catch(err) {
      // Offline — cache wala data use hota rahega (Step 1 mein already load ho gaya)
      console.warn('Background sync failed (offline mode):', err);

      _ready = true;
    }
  }


  // PRODUCTS
  // ════════════════════════════════════════
  function getProducts() {
    return _products;
  }

  async function addProduct(p) {
    p.id           = 'perf_' + Date.now();
    p.rating       = p.rating  || 4.5;
    p.reviews      = p.reviews || 0;
    p.img          = p.img     || '';
    p.gallery      = Array.isArray(p.gallery)      ? p.gallery      : [];
    p.videos       = Array.isArray(p.videos)       ? p.videos       : [];
    p.description  = p.description  || '';
    p.details      = Array.isArray(p.details)      ? p.details      : [];
    p.specs        = (p.specs && typeof p.specs === 'object') ? p.specs : {};
    p.reviews_list = Array.isArray(p.reviews_list) ? p.reviews_list : [];

    _products.push(p);
    saveToCache();
    window.dispatchEvent(new CustomEvent('ih_products_updated'));

    const res = await apiCall('addProduct', serializeProduct(p));
    if (res && res.error) console.error('Save error:', res.error);

    return p;
  }

  async function updateProduct(id, updates) {
    const idx = _products.findIndex(function(p) { return p.id === id; });
    if (idx !== -1) {
      _products[idx] = Object.assign({}, _products[idx], updates);
      _products[idx] = normalizeProduct(_products[idx]);

      saveToCache();
      window.dispatchEvent(new CustomEvent('ih_products_updated'));

      const toSend = serializeProduct(_products[idx]);
      const res = await apiCall('updateProduct', toSend);
      if (res && res.error) console.error('Update error:', res.error);

      return _products[idx];
    }
    return null;
  }
// window.dispatchEvent(new Event('ih_products_updated'));
  async function removeProduct(id) {
    _products = _products.filter(function(p) { return p.id !== id; });
    saveToCache();
    window.dispatchEvent(new CustomEvent('ih_products_updated'));
    await apiCall('deleteProduct', { id: id });
  }

  function getCounts() {
    return {
      total:  _products.length,
      men:    _products.filter(function(p) { return p.type === 'men'; }).length,
      women:  _products.filter(function(p) { return p.type === 'women'; }).length,
      unisex: _products.filter(function(p) { return p.type === 'unisex'; }).length,
    };
  }

  // ════════════════════════════════════════
  // SALES
  // ════════════════════════════════════════
  function getSales() {
    return _sales;
  }

  async function recordSale(productId, qty, priceOverride) {
    const product = _products.find(function(p) { return p.id === productId; });
    if (!product) return null;

    const salePrice = priceOverride || product.price;
    const sale = {
      id:          'sale_' + Date.now(),
      productId:   productId,
      productName: product.name,
      emoji:       product.emoji || '🌹',
      type:        product.type,
      qty:         qty || 1,
      salePrice:   salePrice,
      cost:        product.cost || 0,
      profit:      (salePrice - (product.cost || 0)) * (qty || 1),
      total:       salePrice * (qty || 1),
      date:        new Date().toISOString(),
    };

    await updateProduct(productId, { stock: Math.max(0, (product.stock || 0) - (qty || 1)) });

    _sales.push(sale);
    saveToCache();
    window.dispatchEvent(new CustomEvent('ih_sales_updated'));

    await apiCall('addSale', sale);

    return sale;
  }

  async function deleteSale(id) {
    _sales = _sales.filter(function(s) { return s.id !== id; });
    saveToCache();
    window.dispatchEvent(new CustomEvent('ih_sales_updated'));
    await apiCall('deleteSale', { id: id });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════
  function getStats() {
    const sales        = _sales;
    const totalRevenue = sales.reduce(function(s, x) { return s + (Number(x.total)  || 0); }, 0);
    const totalCost    = sales.reduce(function(s, x) { return s + ((Number(x.cost) || 0) * (Number(x.qty) || 1)); }, 0);
    const totalProfit  = sales.reduce(function(s, x) { return s + (Number(x.profit) || 0); }, 0);
    const today        = new Date().toDateString();
    const ts           = sales.filter(function(s) { return new Date(s.date).toDateString() === today; });
    return {
      totalRevenue:  totalRevenue,
      totalCost:     totalCost,
      totalProfit:   totalProfit,
      totalOrders:   sales.length,
      totalUnits:    sales.reduce(function(s, x) { return s + (Number(x.qty) || 1); }, 0),
      todayRevenue:  ts.reduce(function(s, x) { return s + (Number(x.total)  || 0); }, 0),
      todayProfit:   ts.reduce(function(s, x) { return s + (Number(x.profit) || 0); }, 0),
      todayOrders:   ts.length,
    };
  }

  // ════════════════════════════════════════
  // UTILS
  // ════════════════════════════════════════
  function pkr(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
  }

  function waMsg(name, price) {
    return encodeURIComponent('Hello Scentonish! I\'d like to order:\n\n🌹 *' + name + '*\n💰 Price: Rs. ' + Number(price).toLocaleString('en-PK') + '\n\nPlease confirm availability. Thank you!');
  }

  function saveProducts(products) {
    _products = products.map(normalizeProduct);
    saveToCache();
    window.dispatchEvent(new CustomEvent('ih_products_updated'));
  }
async function getShipping() {
  try {
    const res = await fetch(API + '?action=getShipping');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch(e) { return []; }
}

async function saveShipping(cities) {
  return await apiCall('saveShipping', { cities });
}
  return {
    init:             init,
    getProducts:      getProducts,
    saveProducts:     saveProducts,
    addProduct:       addProduct,
    updateProduct:    updateProduct,
    removeProduct:    removeProduct,
    getCounts:        getCounts,
    getSales:         getSales,
    recordSale:       recordSale,
    deleteSale:       deleteSale,
    getStats:         getStats,
    pkr:              pkr,
    waMsg:            waMsg,
    uploadToImgBB:    uploadToImgBB,
    getShipping:  getShipping,
saveShipping: saveShipping,
  };

})();
