// ============================================================
//  ImportHub — Data Store v3.1
//  Google Sheets Backend Connected
//  FIX: videos/gallery/specs arrays properly JSON serialized
// ============================================================
// https://docs.google.com/spreadsheets/d/1lFo9IpkBYE8p1d089WuheGeryaafiBP0Go1eNzPnN6U/edit?gid=1510447287#gid=1510447287
const IH = (() => {

  const API = 'https://script.google.com/macros/s/AKfycbwDOecUlsgP5vLWH7owqjZe-Ii8xyHdeosDLuptiWnMAKd0cgNPjiGiErGfhkpXBZrl/exec';
const IMGBB_KEY = 'f97770fd273ae2009be4b92c93835ec7'; // imgbb.com/api se free key lo
  // ── LOCAL CACHE (fast UI) ──
  let _products = [];
  let _sales    = [];
  let _ready    = false;

  // ── DEFAULT PRODUCTS ──
  const DEFAULT_PRODUCTS = [
    {id:'kb1',name:'Compact Mechanical Keyboard',emoji:'⌨️',price:13999,cost:8000,badge:'BEST',type:'tech',rating:5,reviews:128,stock:45,img:'',gallery:[],videos:[],description:'The Compact Mechanical Keyboard is engineered for developers, writers, and travelers who demand premium typing feedback without the bulk.',details:[{id:'Switch Type',value:'Cherry MX Blue'},{id:'Layout',value:'60% Compact'},{id:'Connectivity',value:'USB-C'},{id:'Material',value:'Aluminum'},{id:'Weight',value:'680g'}],reviews_list:[],specs:{}},
    {id:'mouse1',name:'Wireless Ergonomic Mouse',emoji:'🖱️',price:9799,cost:5500,badge:'NEW',type:'tech',rating:4.9,reviews:96,stock:30,img:'https://static.wixstatic.com/media/2d0f7e_c57a005eee72416cb0998cb0943e8523~mv2.png',gallery:[],videos:[],description:'Ergonomic wireless mouse with silent clicks and long battery life.',details:[{id:'DPI',value:'200-4000'},{id:'Battery',value:'12 months'}],reviews_list:[],specs:{}},
    {id:'kb2',name:'RGB Gaming Keyboard',emoji:'⌨️',price:19599,cost:12000,badge:'',type:'tech',rating:4.8,reviews:72,stock:20,img:'',gallery:[],videos:[],description:'Full RGB gaming keyboard with per-key lighting.',details:[],reviews_list:[],specs:{}},
    {id:'charger1',name:'GaN 65W Fast Charger',emoji:'🔌',price:11199,cost:6000,badge:'HOT',type:'tech',rating:4.9,reviews:103,stock:60,img:'',gallery:[],videos:[],description:'65W GaN technology charger with 3 ports.',details:[],reviews_list:[],specs:{}},
    {id:'head1',name:'ANC Wireless Headphones',emoji:'🎧',price:24999,cost:15000,badge:'HOT',type:'tech',rating:4.9,reviews:87,stock:18,img:'',gallery:[],videos:[],description:'Active noise cancellation headphones with 30hr battery.',details:[],reviews_list:[],specs:{}},
    {id:'bp1',name:'Smart Travel Backpack 40L',emoji:'🎒',price:22399,cost:13000,badge:'',type:'tour',rating:4.7,reviews:63,stock:35,img:'',gallery:[],videos:[],description:'40L smart travel backpack with USB charging port.',details:[],reviews_list:[],specs:{}},
    {id:'luggage1',name:'Hardshell Carry-On 20"',emoji:'🧳',price:34999,cost:21000,badge:'HOT',type:'tour',rating:4.8,reviews:78,stock:14,img:'',gallery:[],videos:[],description:'20" hardshell carry-on with spinner wheels and TSA lock.',details:[],reviews_list:[],specs:{}},
    {id:'hub1',name:'USB-C Hub 7-in-1',emoji:'🔗',price:8999,cost:5000,badge:'HOT',type:'acc',rating:4.8,reviews:89,stock:40,img:'',gallery:[],videos:[],description:'7-in-1 USB-C hub with HDMI 4K, 3x USB-A, SD card reader.',details:[],reviews_list:[],specs:{}},
    {id:'pb1',name:'20000mAh Power Bank Slim',emoji:'⚡',price:7999,cost:4500,badge:'',type:'acc',rating:4.7,reviews:76,stock:35,img:'',gallery:[],videos:[],description:'Slim 20000mAh power bank with dual output.',details:[],reviews_list:[],specs:{}},
    {id:'charger2',name:'Wireless Charger 3-in-1',emoji:'⚡',price:11999,cost:7000,badge:'HOT',type:'acc',rating:4.8,reviews:63,stock:25,img:'',gallery:[],videos:[],description:'3-in-1 wireless charger for phone, watch, and earbuds.',details:[],reviews_list:[],specs:{}},
  ];

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

  // Normalize a product coming FROM Google Sheets (strings → arrays/objects)
  function normalizeProduct(p) {
    return {
      ...p,
      price:       Number(p.price)   || 0,
      cost:        Number(p.cost)    || 0,
      stock:       Number(p.stock)   || 0,
      rating:      Number(p.rating)  || 4.5,
      reviews:     Number(p.reviews) || 0,
      gallery:     safeParseArray(p.gallery),
      videos:      safeParseArray(p.videos),
      details:     safeParseArray(p.details),
      reviews_list:safeParseArray(p.reviews_list),
      specs:       safeParseObject(p.specs),
    };
  }

  // Prepare a product FOR Google Sheets (arrays/objects → JSON strings)
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
  };
}
async function uploadToImgBB(base64) {
  try {
    const formData = new FormData();
    formData.append('image', base64.split(',')[1]);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) return data.data.url;
    return null;
  } catch(e) {
    return null;
  }
}
  // ════════════════════════════════════════
  // API CALL HELPER
  // ════════════════════════════════════════
 async function apiCall(action, data) {
  data = data || {};
  try {
    const res = await fetch(API, {
      method: 'POST',
      mode: 'no-cors',                          // ← yeh add karo
      headers: { 'Content-Type': 'text/plain' }, // ← yeh bhi
      body: JSON.stringify({ action, ...data }),
    });
    // no-cors mein response.json() nahi milta — isliye workaround
    return { success: true };
  } catch (err) {
    console.error('API Error:', err);
    return { error: err.message };
  }
}

  // ════════════════════════════════════════
  // INIT — Google Sheets se load karo
  // ════════════════════════════════════════
async function init() {
  // Cache se fast load
  const cachedP = localStorage.getItem('ih_products_cache');
  const cachedS = localStorage.getItem('ih_sales_cache');
  if (cachedP) {
    try { _products = JSON.parse(cachedP).map(normalizeProduct); } catch(e) { _products = []; }
  }
  if (cachedS) {
    try { _sales = JSON.parse(cachedS); } catch(e) { _sales = []; }
  }

  try {
    // GET request — CORS issue nahi hota
    const [pRes, sRes] = await Promise.all([
      fetch(API + '?action=getProducts').then(r => r.json()),
      fetch(API + '?action=getSales').then(r => r.json()),
    ]);

    if (Array.isArray(pRes) && pRes.length > 0) {
      _products = pRes.map(normalizeProduct);
      localStorage.setItem('ih_products_cache', JSON.stringify(_products));
    } else if (_products.length === 0) {
      _products = DEFAULT_PRODUCTS.map(normalizeProduct);
      await seedDefaultProducts();
    }

    if (Array.isArray(sRes)) {
      _sales = sRes;
      localStorage.setItem('ih_sales_cache', JSON.stringify(_sales));
    }

    _ready = true;
    window.dispatchEvent(new CustomEvent('ih_products_updated'));
    window.dispatchEvent(new CustomEvent('ih_sales_updated'));

  } catch(err) {
    console.warn('Offline mode:', err);
    _ready = true;
  }
}

  // Pehli baar default products seed karo
  async function seedDefaultProducts() {
    for (var i = 0; i < DEFAULT_PRODUCTS.length; i++) {
      await apiCall('addProduct', serializeProduct(DEFAULT_PRODUCTS[i]));
    }
  }

  // ════════════════════════════════════════
  // PRODUCTS
  // ════════════════════════════════════════
  function getProducts() {
    return _products;
  }

  async function addProduct(p) {
    p.id           = 'prod_' + Date.now();
    p.rating       = p.rating  || 4.5;
    p.reviews      = p.reviews || 0;
    p.img          = p.img     || '';
    p.gallery      = Array.isArray(p.gallery)      ? p.gallery      : [];
    p.videos       = Array.isArray(p.videos)       ? p.videos       : [];
    p.description  = p.description  || '';
    p.details      = Array.isArray(p.details)      ? p.details      : [];
    p.specs        = (p.specs && typeof p.specs === 'object') ? p.specs : {};
    p.reviews_list = Array.isArray(p.reviews_list) ? p.reviews_list : [];

    // Local update (fast)
    _products.push(p);
    localStorage.setItem('ih_products_cache', JSON.stringify(_products));
    window.dispatchEvent(new CustomEvent('ih_products_updated'));

    // Google Sheets mein save — arrays ko JSON string banao
    const res = await apiCall('addProduct', serializeProduct(p));
    if (res && res.error) console.error('Save error:', res.error);

    return p;
  }

  async function updateProduct(id, updates) {
  const idx = _products.findIndex(function(p) { return p.id === id; });
  if (idx !== -1) {
    _products[idx] = Object.assign({}, _products[idx], updates);
    _products[idx] = normalizeProduct(_products[idx]);

    localStorage.setItem('ih_products_cache', JSON.stringify(_products));
    window.dispatchEvent(new CustomEvent('ih_products_updated'));

    // Serialize karo Google Sheets ke liye
    const toSend = serializeProduct(_products[idx]);
    
    // Debug: console mein dekho kya ja raha hai
    console.log('Sending to Sheets:', toSend);
    
    const res = await apiCall('updateProduct', toSend);
    
    // Debug: response dekho
    console.log('Sheets response:', res);
    
    if (res && res.error) {
      console.error('Update error:', res.error);
    }
    
    return _products[idx];
  }
  return null;
}
  async function removeProduct(id) {
    _products = _products.filter(function(p) { return p.id !== id; });
    localStorage.setItem('ih_products_cache', JSON.stringify(_products));
    window.dispatchEvent(new CustomEvent('ih_products_updated'));

    await apiCall('deleteProduct', { id: id });
  }

  function getCounts() {
    return {
      total: _products.length,
      tech:  _products.filter(function(p) { return p.type === 'tech'; }).length,
      tour:  _products.filter(function(p) { return p.type === 'tour'; }).length,
      acc:   _products.filter(function(p) { return p.type === 'acc';  }).length,
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
      emoji:       product.emoji || '📦',
      type:        product.type,
      qty:         qty || 1,
      salePrice:   salePrice,
      cost:        product.cost || 0,
      profit:      (salePrice - (product.cost || 0)) * (qty || 1),
      total:       salePrice * (qty || 1),
      date:        new Date().toISOString(),
    };

    // Stock update
    await updateProduct(productId, { stock: Math.max(0, (product.stock || 0) - (qty || 1)) });

    // Local update
    _sales.push(sale);
    localStorage.setItem('ih_sales_cache', JSON.stringify(_sales));
    window.dispatchEvent(new CustomEvent('ih_sales_updated'));

    // Google Sheets
    await apiCall('addSale', sale);

    return sale;
  }

  async function deleteSale(id) {
    _sales = _sales.filter(function(s) { return s.id !== id; });
    localStorage.setItem('ih_sales_cache', JSON.stringify(_sales));
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
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  const data = JSON.parse(e.postData.contents);

  if (data.action === "updateProduct") {

    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {

        // ✅ FIXED ORDER (match with sheet columns)
        const rowData = [
          data.id,
          data.name,
          data.emoji,
          data.type,
          data.price,
          data.cost,
          data.stock,
          data.badge,
          data.rating,
          data.reviews,
          data.img,
          data.gallery,
          data.videos,
          data.description,
          data.specs,
          data.details,
          data.reviews_list,
          data.date_added
        ];

        sheet.getRange(i + 1, 1, 1, rowData.length)
          .setValues([rowData]);

        return ContentService
          .createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ error: "ID NOT FOUND" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
  // ════════════════════════════════════════
  // UTILS
  // ════════════════════════════════════════
  function pkr(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
  }

  function waMsg(name, price) {
    return encodeURIComponent('Hello ImportHub! I\'d like to order:\n\n🛍️ *' + name + '*\n💰 Price: Rs. ' + Number(price).toLocaleString('en-PK') + '\n\nPlease confirm availability and delivery details. Thank you!');
  }

  // saveProducts — backward compatibility
  function saveProducts(products) {
    _products = products.map(normalizeProduct);
    localStorage.setItem('ih_products_cache', JSON.stringify(_products));
    window.dispatchEvent(new CustomEvent('ih_products_updated'));
  }

  return {
    init:           init,
    getProducts:    getProducts,
    saveProducts:   saveProducts,
    addProduct:     addProduct,
    updateProduct:  updateProduct,
    removeProduct:  removeProduct,
    getCounts:      getCounts,
    getSales:       getSales,
    recordSale:     recordSale,
    deleteSale:     deleteSale,
    getStats:       getStats,
    pkr:            pkr,
    waMsg:          waMsg,
     uploadToImgBB:  uploadToImgBB,
    DEFAULT_PRODUCTS: DEFAULT_PRODUCTS,
  };

})();