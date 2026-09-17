/**
 * Cadence — Premium Audio Store
 * Main Application Logic
 * State → Render architecture: all UI derives from a single state object.
 */

'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  cart: [],
  wishlist: [],
  filters: {
    category: 'All',
    search: '',
    maxPrice: 5000,
    inStockOnly: false,
    sort: 'default',
  },
  modalProductId: null,
  cartOpen: false,
  wishlistOpen: false,
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MAX_PRICE_CEILING = 5000;

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
function saveCart() {
  try { localStorage.setItem('cadence_cart', JSON.stringify(state.cart)); } catch {}
}
function loadCart() {
  try {
    const raw = localStorage.getItem('cadence_cart');
    if (raw) state.cart = JSON.parse(raw);
  } catch { state.cart = []; }
}
function saveWishlist() {
  try { localStorage.setItem('cadence_wishlist', JSON.stringify(state.wishlist)); } catch {}
}
function loadWishlist() {
  try {
    const raw = localStorage.getItem('cadence_wishlist');
    if (raw) state.wishlist = JSON.parse(raw);
  } catch { state.wishlist = []; }
}

// ─── PRODUCT HELPERS ──────────────────────────────────────────────────────────
function getEffectivePrice(p) {
  return p.salePrice !== null ? p.salePrice : p.price;
}
function isInWishlist(id) {
  return state.wishlist.includes(id);
}
function isInCart(id) {
  return state.cart.some(i => i.id === id);
}
function getCartItem(id) {
  return state.cart.find(i => i.id === id) || null;
}

// ─── FILTER + SORT ────────────────────────────────────────────────────────────
function getFilteredProducts() {
  let products = [...PRODUCTS];
  const { category, search, maxPrice, inStockOnly, sort } = state.filters;

  if (category !== 'All') {
    products = products.filter(p => p.category === category);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (inStockOnly) {
    products = products.filter(p => p.inStock);
  }
  products = products.filter(p => getEffectivePrice(p) <= maxPrice);

  switch (sort) {
    case 'price-asc':  products.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b)); break;
    case 'price-desc': products.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a)); break;
    case 'rating':     products.sort((a, b) => b.rating - a.rating); break;
    case 'newest':     products.sort((a, b) => (b.tags.includes('New') ? 1 : 0) - (a.tags.includes('New') ? 1 : 0)); break;
    default: break;
  }
  return products;
}

// ─── PRODUCT SVG ART ─────────────────────────────────────────────────────────
/**
 * Generates a consistent, shape-specific SVG illustration per product.
 * Each shape gets a gradient that uses the product's accent color,
 * ensuring the catalog looks unified but not identical.
 */
function productSVG(product) {
  const c = product.color;
  const id = `p${product.id}`;

  const gradDef = `
    <defs>
      <linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.3"/>
      </linearGradient>
      <radialGradient id="r${id}" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="${c}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>
      <filter id="f${id}">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>`;

  const shapes = {
    'headphones-open': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <path d="M42 100 C42 68 68 42 100 42 C132 42 158 68 158 100" stroke="url(#g${id})" stroke-width="10" stroke-linecap="round" fill="none"/>
      <rect x="26" y="88" width="28" height="44" rx="14" fill="url(#g${id})"/>
      <rect x="146" y="88" width="28" height="44" rx="14" fill="url(#g${id})"/>
      <rect x="29" y="92" width="22" height="36" rx="11" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <rect x="149" y="92" width="22" height="36" rx="11" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="100" cy="100" r="12" fill="${c}" opacity="0.15" stroke="${c}" stroke-width="1" stroke-opacity="0.4"/>`,

    'headphones-closed': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <path d="M40 104 C40 69 66 42 100 42 C134 42 160 69 160 104" stroke="url(#g${id})" stroke-width="8" stroke-linecap="round" fill="none"/>
      <ellipse cx="32" cy="108" rx="18" ry="24" fill="url(#g${id})"/>
      <ellipse cx="168" cy="108" rx="18" ry="24" fill="url(#g${id})"/>
      <ellipse cx="32" cy="108" rx="12" ry="16" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <ellipse cx="168" cy="108" rx="12" ry="16" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <circle cx="32" cy="108" r="4" fill="${c}" opacity="0.8"/>
      <circle cx="168" cy="108" r="4" fill="${c}" opacity="0.8"/>`,

    'headphones-wireless': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <path d="M45 98 C45 68 70 44 100 44 C130 44 155 68 155 98" stroke="url(#g${id})" stroke-width="10" stroke-linecap="round" fill="none"/>
      <rect x="30" y="86" width="26" height="40" rx="13" fill="url(#g${id})"/>
      <rect x="144" y="86" width="26" height="40" rx="13" fill="url(#g${id})"/>
      <circle cx="43" cy="132" r="5" fill="${c}" opacity="0.9"/>
      <circle cx="157" cy="132" r="5" fill="${c}" opacity="0.9"/>
      <circle cx="43" cy="132" r="8" fill="none" stroke="${c}" stroke-width="1" stroke-opacity="0.4"/>
      <circle cx="157" cy="132" r="8" fill="none" stroke="${c}" stroke-width="1" stroke-opacity="0.4"/>`,

    'headphones-studio': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <path d="M44 100 C44 69 69 44 100 44 C131 44 156 69 156 100" stroke="url(#g${id})" stroke-width="9" stroke-linecap="round" fill="none"/>
      <rect x="28" y="88" width="30" height="38" rx="8" fill="url(#g${id})"/>
      <rect x="142" y="88" width="30" height="38" rx="8" fill="url(#g${id})"/>
      <rect x="31" y="91" width="24" height="32" rx="6" fill="rgba(0,0,0,0.35)"/>
      <rect x="145" y="91" width="24" height="32" rx="6" fill="rgba(0,0,0,0.35)"/>
      <line x1="43" y1="96" x2="43" y2="116" stroke="${c}" stroke-width="2" stroke-opacity="0.7"/>
      <line x1="49" y1="93" x2="49" y2="119" stroke="${c}" stroke-width="2" stroke-opacity="0.5"/>
      <line x1="157" y1="96" x2="157" y2="116" stroke="${c}" stroke-width="2" stroke-opacity="0.7"/>
      <line x1="163" y1="93" x2="163" y2="119" stroke="${c}" stroke-width="2" stroke-opacity="0.5"/>`,

    'speaker-bookshelf': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="55" y="40" width="90" height="120" rx="10" fill="rgba(255,255,255,0.04)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="100" cy="84" r="28" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="100" cy="84" r="18" fill="url(#g${id})" opacity="0.7"/>
      <circle cx="100" cy="84" r="6" fill="${c}"/>
      <rect x="80" y="122" width="40" height="12" rx="6" fill="url(#g${id})" opacity="0.8"/>
      <rect x="55" y="148" width="90" height="4" rx="2" fill="url(#g${id})" opacity="0.3"/>`,

    'speaker-round': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <circle cx="100" cy="100" r="58" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="100" cy="100" r="40" fill="rgba(0,0,0,0.3)" stroke="${c}" stroke-width="1" stroke-opacity="0.3"/>
      <circle cx="100" cy="100" r="24" fill="url(#g${id})" opacity="0.7"/>
      <circle cx="100" cy="100" r="10" fill="${c}" opacity="0.9"/>
      <circle cx="100" cy="100" r="4" fill="white" opacity="0.6"/>
      <circle cx="100" cy="154" r="6" fill="${c}" opacity="0.5"/>`,

    'speaker-tower': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="70" y="30" width="60" height="140" rx="12" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <ellipse cx="100" cy="64" rx="18" ry="6" fill="url(#g${id})" opacity="0.6"/>
      <circle cx="100" cy="90" r="20" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="100" cy="90" r="12" fill="url(#g${id})" opacity="0.7"/>
      <circle cx="100" cy="120" r="14" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="100" cy="120" r="8" fill="url(#g${id})" opacity="0.5"/>
      <rect x="83" y="148" width="34" height="8" rx="4" fill="url(#g${id})" opacity="0.4"/>`,

    'speaker-bar': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="25" y="80" width="150" height="50" rx="10" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="100" cy="105" r="18" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="100" cy="105" r="10" fill="url(#g${id})" opacity="0.7"/>
      <circle cx="60" cy="105" r="12" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="60" cy="105" r="6" fill="url(#g${id})" opacity="0.5"/>
      <circle cx="140" cy="105" r="12" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="140" cy="105" r="6" fill="url(#g${id})" opacity="0.5"/>
      <rect x="25" y="134" width="150" height="3" rx="1.5" fill="url(#g${id})" opacity="0.2"/>`,

    'turntable': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <circle cx="100" cy="100" r="70" fill="rgba(0,0,0,0.5)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="100" cy="100" r="54" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <circle cx="100" cy="100" r="36" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <circle cx="100" cy="100" r="18" fill="url(#g${id})" opacity="0.6"/>
      <circle cx="100" cy="100" r="7" fill="${c}"/>
      <circle cx="100" cy="100" r="3" fill="white" opacity="0.8"/>
      <line x1="130" y1="52" x2="148" y2="36" stroke="url(#g${id})" stroke-width="3" stroke-linecap="round"/>
      <circle cx="148" cy="36" r="5" fill="${c}" opacity="0.9"/>`,

    'turntable-pro': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="28" y="28" width="144" height="144" rx="16" fill="rgba(255,255,255,0.02)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="100" cy="100" r="62" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <circle cx="100" cy="100" r="46" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <circle cx="100" cy="100" r="28" fill="url(#g${id})" opacity="0.5"/>
      <circle cx="100" cy="100" r="10" fill="${c}" opacity="0.9"/>
      <circle cx="100" cy="100" r="4" fill="white" opacity="0.8"/>
      <line x1="138" y1="55" x2="158" y2="38" stroke="url(#g${id})" stroke-width="4" stroke-linecap="round"/>
      <circle cx="158" cy="38" r="7" fill="${c}"/>`,

    'turntable-entry': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <circle cx="100" cy="100" r="65" fill="rgba(0,0,0,0.5)" stroke="url(#g${id})" stroke-width="2"/>
      <circle cx="100" cy="100" r="48" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <circle cx="100" cy="100" r="22" fill="url(#g${id})" opacity="0.65"/>
      <circle cx="100" cy="100" r="8" fill="${c}"/>
      <circle cx="100" cy="100" r="3.5" fill="white" opacity="0.7"/>
      <path d="M136 56 L152 40" stroke="url(#g${id})" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="152" cy="40" r="5.5" fill="${c}" opacity="0.9"/>`,

    'phono-stage': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="35" y="60" width="130" height="80" rx="12" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="68" cy="95" r="14" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="68" cy="95" r="8" fill="url(#g${id})" opacity="0.7"/>
      <circle cx="68" cy="95" r="3" fill="${c}"/>
      <circle cx="104" cy="95" r="14" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1"/>
      <circle cx="104" cy="95" r="8" fill="url(#g${id})" opacity="0.5"/>
      <circle cx="104" cy="95" r="3" fill="${c}"/>
      <rect x="130" y="78" width="20" height="5" rx="2.5" fill="${c}" opacity="0.7"/>
      <rect x="130" y="89" width="20" height="5" rx="2.5" fill="${c}" opacity="0.5"/>
      <rect x="130" y="100" width="20" height="5" rx="2.5" fill="${c}" opacity="0.3"/>
      <rect x="35" y="148" width="130" height="3" rx="1.5" fill="url(#g${id})" opacity="0.2"/>`,

    'dac': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="30" y="55" width="140" height="90" rx="14" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <rect x="44" y="70" width="52" height="60" rx="8" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <rect x="52" y="80" width="36" height="6" rx="3" fill="${c}" opacity="0.6"/>
      <rect x="52" y="92" width="28" height="4" rx="2" fill="${c}" opacity="0.4"/>
      <rect x="52" y="102" width="32" height="4" rx="2" fill="${c}" opacity="0.3"/>
      <circle cx="130" cy="100" r="18" fill="rgba(0,0,0,0.4)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="130" cy="100" r="10" fill="url(#g${id})" opacity="0.8"/>
      <circle cx="130" cy="100" r="4" fill="${c}"/>
      <circle cx="155" cy="74" r="6" fill="${c}" opacity="0.7"/>
      <circle cx="155" cy="90" r="6" fill="${c}" opacity="0.5"/>`,

    'cable': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <path d="M38 130 C38 130 55 90 100 100 C145 110 162 70 162 70" stroke="url(#g${id})" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M38 130 C38 130 55 90 100 100 C145 110 162 70 162 70" stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="38" cy="130" r="10" fill="url(#g${id})"/>
      <circle cx="38" cy="130" r="6" fill="rgba(0,0,0,0.5)"/>
      <circle cx="162" cy="70" r="10" fill="url(#g${id})"/>
      <circle cx="162" cy="70" r="6" fill="rgba(0,0,0,0.5)"/>
      <rect x="28" y="124" width="20" height="12" rx="6" fill="${c}" opacity="0.3"/>
      <rect x="152" y="64" width="20" height="12" rx="6" fill="${c}" opacity="0.3"/>`,

    'kit': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="40" y="55" width="50" height="90" rx="8" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <rect x="50" y="65" width="30" height="5" rx="2.5" fill="${c}" opacity="0.5"/>
      <rect x="50" y="76" width="22" height="4" rx="2" fill="${c}" opacity="0.35"/>
      <rect x="50" y="86" width="26" height="4" rx="2" fill="${c}" opacity="0.25"/>
      <circle cx="65" cy="115" r="18" fill="rgba(0,0,0,0.4)" stroke="${c}" stroke-width="1" stroke-opacity="0.4"/>
      <circle cx="65" cy="115" r="10" fill="url(#g${id})" opacity="0.6"/>
      <rect x="104" y="55" width="56" height="90" rx="8" fill="rgba(255,255,255,0.03)" stroke="url(#g${id})" stroke-width="1.5"/>
      <circle cx="132" cy="85" r="20" fill="rgba(0,0,0,0.35)" stroke="${c}" stroke-width="1" stroke-opacity="0.3"/>
      <path d="M120 85 C120 78.4 125.4 73 132 73 C138.6 73 144 78.4 144 85" stroke="${c}" stroke-width="2" fill="none" stroke-opacity="0.7"/>
      <rect x="125" y="80" width="5" height="10" rx="2.5" fill="${c}" opacity="0.6"/>
      <rect x="134" y="80" width="5" height="10" rx="2.5" fill="${c}" opacity="0.6"/>`,

    'stand': `
      <circle cx="100" cy="100" r="90" fill="url(#r${id})"/>
      <rect x="70" y="38" width="20" height="110" rx="6" fill="rgba(255,255,255,0.04)" stroke="url(#g${id})" stroke-width="1.5"/>
      <rect x="110" y="38" width="20" height="110" rx="6" fill="rgba(255,255,255,0.04)" stroke="url(#g${id})" stroke-width="1.5"/>
      <rect x="55" y="32" width="90" height="16" rx="6" fill="url(#g${id})" opacity="0.5"/>
      <rect x="50" y="144" width="100" height="8" rx="4" fill="url(#g${id})" opacity="0.3"/>
      <line x1="73" y1="152" x2="68" y2="162" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="80" y1="152" x2="80" y2="164" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="120" y1="152" x2="120" y2="164" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="127" y1="152" x2="132" y2="162" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>`
  };

  const svg = shapes[product.shape] || shapes['headphones-open'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="product-svg" aria-hidden="true">${gradDef}${svg}</svg>`;
}

// ─── STAR RATING ──────────────────────────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  return `<span class="stars" aria-label="${rating} out of 5 stars">${stars}</span>`;
}

// ─── RENDER PRODUCT CARD ──────────────────────────────────────────────────────
function renderProductCard(product) {
  const effectivePrice = getEffectivePrice(product);
  const inWL = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const tagHTML = product.tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('');

  return `
  <article class="product-card ${!product.inStock ? 'out-of-stock' : ''}" role="listitem"
           data-id="${product.id}" tabindex="0" aria-label="${product.name}">
    <div class="card-image-wrap">
      <div class="card-image-bg" style="--product-color: ${product.color}">
        ${productSVG(product)}
      </div>
      ${!product.inStock ? '<div class="stock-overlay"><span>Out of Stock</span></div>' : ''}
      <div class="card-actions-overlay">
        <button class="card-action-btn wishlist-btn ${inWL ? 'active' : ''}"
                data-action="wishlist" data-id="${product.id}"
                aria-label="${inWL ? 'Remove from wishlist' : 'Add to wishlist'}"
                aria-pressed="${inWL}">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="${inWL ? 'currentColor' : 'none'}">
            <path d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"
                  stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="card-action-btn quick-view-btn"
                data-action="quickview" data-id="${product.id}"
                aria-label="Quick view ${product.name}">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 10s2.9-6 8-6 8 6 8 6-2.9 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="category-badge">${product.category}</span>
        <div class="card-tags">${tagHTML}</div>
      </div>
      <h3 class="card-name">${product.name}</h3>
      <div class="card-rating">
        ${renderStars(product.rating)}
        <span class="review-count">(${product.reviewCount.toLocaleString()})</span>
      </div>
      <div class="card-price-row">
        <div class="price-group">
          <span class="price-current">$${effectivePrice.toLocaleString()}</span>
          ${product.salePrice !== null ? `<span class="price-original">$${product.price.toLocaleString()}</span>` : ''}
        </div>
        <button class="add-to-cart-btn ${!product.inStock ? 'disabled' : ''} ${inCart ? 'in-cart' : ''}"
                data-action="addtocart" data-id="${product.id}"
                ${!product.inStock ? 'disabled aria-disabled="true"' : ''}
                aria-label="${inCart ? 'Already in cart' : 'Add ' + product.name + ' to cart'}">
          ${inCart
            ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Added`
            : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1h2l1.5 6.5h6l1.5-4.5H4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="11" r="1" fill="currentColor"/></svg> Add`}
        </button>
      </div>
    </div>
  </article>`;
}

// ─── RENDER CATALOG ───────────────────────────────────────────────────────────
function renderCatalog() {
  const products = getFilteredProducts();
  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('results-count');

  if (products.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    count.textContent = 'No products found';
  } else {
    empty.hidden = true;
    // Stagger animation with data attribute
    grid.innerHTML = products.map((p, i) =>
      `<div class="card-wrapper" style="--card-index:${i}" data-id="${p.id}">${renderProductCard(p)}</div>`
    ).join('');
    const total = PRODUCTS.length;
    count.textContent = `Showing ${products.length} of ${total} products`;
  }
}

// ─── CART OPERATIONS ─────────────────────────────────────────────────────────
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product || !product.inStock) return;
  const existing = getCartItem(id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
  updateBadges();
  renderCatalog(); // update button state
  showToast(`${product.name} added to cart`, 'success');
  flyToCart(id);
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  updateBadges();
  renderCatalog();
}

function updateQty(id, delta) {
  const item = getCartItem(id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
  updateBadges();
}

function clearCart() {
  state.cart = [];
  saveCart();
  renderCart();
  updateBadges();
  renderCatalog();
}

// ─── CART UI ──────────────────────────────────────────────────────────────────
function cartItemHTML(item) {
  const product = PRODUCTS.find(p => p.id === item.id);
  if (!product) return '';
  const price = getEffectivePrice(product);
  return `
  <div class="cart-item" data-cart-id="${item.id}">
    <div class="cart-item-img" style="--product-color: ${product.color}">
      ${productSVG(product)}
    </div>
    <div class="cart-item-info">
      <p class="cart-item-name">${product.name}</p>
      <p class="cart-item-cat">${product.category}</p>
      <div class="cart-item-price-row">
        <span class="cart-item-price">$${(price * item.qty).toLocaleString()}</span>
        <div class="qty-stepper">
          <button class="qty-btn" data-action="qty-down" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="qty-val" aria-label="Quantity: ${item.qty}">${item.qty}</span>
          <button class="qty-btn" data-action="qty-up" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
    </div>
    <button class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="Remove ${product.name} from cart">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
  </div>`;
}

function renderCart() {
  const body = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  const itemCount = document.getElementById('cart-item-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  const totalItems = state.cart.reduce((s, i) => s + i.qty, 0);
  itemCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
            <path d="M12 12h5l9 26h16l5-16H19" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="24" cy="42" r="3" fill="rgba(255,255,255,0.15)"/>
            <circle cx="36" cy="42" r="3" fill="rgba(255,255,255,0.15)"/>
          </svg>
        </div>
        <p class="empty-cart-title">Your cart is empty</p>
        <p class="empty-cart-sub">Add some gear to get started.</p>
        <button class="btn btn-ghost btn-sm" id="empty-cart-shop">Browse Products</button>
      </div>`;
    footer.hidden = true;
  } else {
    const subtotal = state.cart.reduce((s, i) => {
      const p = PRODUCTS.find(pr => pr.id === i.id);
      return s + (p ? getEffectivePrice(p) * i.qty : 0);
    }, 0);
    body.innerHTML = `<div class="cart-items">${state.cart.map(cartItemHTML).join('')}</div>`;
    subtotalEl.textContent = `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    totalEl.textContent = `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    footer.hidden = false;
  }
}

// ─── WISHLIST OPERATIONS ──────────────────────────────────────────────────────
function toggleWishlist(id) {
  const idx = state.wishlist.indexOf(id);
  const product = PRODUCTS.find(p => p.id === id);
  if (idx === -1) {
    state.wishlist.push(id);
    if (product) showToast(`${product.name} added to wishlist`, 'wishlist');
  } else {
    state.wishlist.splice(idx, 1);
    if (product) showToast(`${product.name} removed from wishlist`, 'info');
  }
  saveWishlist();
  updateBadges();
  renderWishlist();
  // Update card heart button without full re-render
  const btn = document.querySelector(`.wishlist-btn[data-id="${id}"]`);
  if (btn) {
    const isNowWL = isInWishlist(id);
    btn.classList.toggle('active', isNowWL);
    btn.setAttribute('aria-pressed', isNowWL);
    btn.setAttribute('aria-label', isNowWL ? 'Remove from wishlist' : 'Add to wishlist');
    btn.querySelector('path').setAttribute('fill', isNowWL ? 'currentColor' : 'none');
  }
}

function renderWishlist() {
  const body = document.getElementById('wishlist-body');
  const count = document.getElementById('wishlist-item-count');
  count.textContent = `${state.wishlist.length} ${state.wishlist.length === 1 ? 'item' : 'items'}`;

  if (state.wishlist.length === 0) {
    body.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
            <path d="M28 42s-16-10-16-20a9 9 0 0 1 16-5.8A9 9 0 0 1 44 22c0 10-16 20-16 20z"
                  stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="empty-cart-title">No saved items</p>
        <p class="empty-cart-sub">Tap the heart on any product to save it.</p>
      </div>`;
  } else {
    body.innerHTML = `<div class="cart-items">${state.wishlist.map(id => {
      const p = PRODUCTS.find(pr => pr.id === id);
      if (!p) return '';
      const price = getEffectivePrice(p);
      return `
      <div class="cart-item" data-wish-id="${id}">
        <div class="cart-item-img" style="--product-color: ${p.color}">
          ${productSVG(p)}
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${p.name}</p>
          <p class="cart-item-cat">${p.category}</p>
          <span class="cart-item-price">$${price.toLocaleString()}</span>
        </div>
        <div class="wish-actions">
          <button class="qty-btn" data-action="wish-add-cart" data-id="${id}" aria-label="Add to cart">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1h2l1.5 6.5h6l1.5-4.5H4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="6" cy="11" r="1" fill="currentColor"/>
              <circle cx="10" cy="11" r="1" fill="currentColor"/>
            </svg>
          </button>
          <button class="remove-btn" data-action="wish-remove" data-id="${id}" aria-label="Remove from wishlist">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }
}

// ─── BADGES ───────────────────────────────────────────────────────────────────
function updateBadges() {
  const totalItems = state.cart.reduce((s, i) => s + i.qty, 0);
  const cartBadge = document.getElementById('cart-badge');
  const wishlistBadge = document.getElementById('wishlist-badge');
  cartBadge.textContent = totalItems;
  cartBadge.setAttribute('aria-label', `${totalItems} items in cart`);
  cartBadge.classList.toggle('visible', totalItems > 0);
  wishlistBadge.textContent = state.wishlist.length;
  wishlistBadge.setAttribute('aria-label', `${state.wishlist.length} wishlist items`);
  wishlistBadge.classList.toggle('visible', state.wishlist.length > 0);
}

// ─── CART DRAWER OPEN/CLOSE ───────────────────────────────────────────────────
function openCart() {
  state.cartOpen = true;
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('cart-overlay').classList.add('visible');
  document.body.classList.add('drawer-open');
  if (state.wishlistOpen) closeWishlist();
}
function closeCart() {
  state.cartOpen = false;
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('cart-overlay').classList.remove('visible');
  document.body.classList.remove('drawer-open');
}
function openWishlist() {
  state.wishlistOpen = true;
  document.getElementById('wishlist-drawer').classList.add('open');
  document.getElementById('wishlist-drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('wishlist-overlay').classList.add('visible');
  document.body.classList.add('drawer-open');
  if (state.cartOpen) closeCart();
}
function closeWishlist() {
  state.wishlistOpen = false;
  document.getElementById('wishlist-drawer').classList.remove('open');
  document.getElementById('wishlist-drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('wishlist-overlay').classList.remove('visible');
  document.body.classList.remove('drawer-open');
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function openModal(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  state.modalProductId = id;

  const price = getEffectivePrice(product);
  const inWL = isInWishlist(id);
  const inCart = isInCart(id);
  const cartItem = getCartItem(id);
  const qty = cartItem ? cartItem.qty : 1;

  const specsHTML = Object.entries(product.specs)
    .map(([k, v]) => `<div class="spec-row"><span class="spec-key">${k.charAt(0).toUpperCase() + k.slice(1)}</span><span class="spec-val">${v}</span></div>`)
    .join('');

  const tagHTML = product.tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-image-col">
      <div class="modal-image-bg" style="--product-color: ${product.color}">
        ${productSVG(product)}
      </div>
    </div>
    <div class="modal-info-col">
      <div class="modal-meta">
        <span class="category-badge">${product.category}</span>
        <div class="card-tags">${tagHTML}</div>
      </div>
      <h2 class="modal-title" id="modal-product-name">${product.name}</h2>
      <div class="modal-rating">
        ${renderStars(product.rating)}
        <span class="review-count">${product.rating} · ${product.reviewCount.toLocaleString()} reviews</span>
      </div>
      <div class="modal-price">
        <span class="price-current large">$${price.toLocaleString()}</span>
        ${product.salePrice !== null ? `<span class="price-original">$${product.price.toLocaleString()}</span>` : ''}
        ${product.salePrice !== null ? `<span class="save-badge">Save $${(product.price - product.salePrice).toLocaleString()}</span>` : ''}
      </div>
      <p class="modal-desc">${product.description}</p>
      <div class="specs-grid">${specsHTML}</div>
      ${product.inStock
        ? `<div class="modal-actions">
            <div class="modal-qty-row">
              <label class="qty-label">Qty</label>
              <div class="qty-stepper large">
                <button class="qty-btn" id="modal-qty-down" aria-label="Decrease quantity">−</button>
                <span class="qty-val" id="modal-qty-val" aria-label="Quantity: ${qty}">${qty}</span>
                <button class="qty-btn" id="modal-qty-up" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="modal-btn-row">
              <button class="btn btn-primary btn-full modal-add-cart" id="modal-add-cart-btn"
                      data-id="${id}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M1 1h2.5l2 8h8l2-5.5H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor"/>
                  <circle cx="11.5" cy="12.5" r="1.5" fill="currentColor"/>
                </svg>
                ${inCart ? 'Add More' : 'Add to Cart'}
              </button>
              <button class="btn btn-ghost modal-wish-btn ${inWL ? 'active' : ''}" id="modal-wish-btn" data-id="${id}"
                      aria-pressed="${inWL}" aria-label="${inWL ? 'Remove from wishlist' : 'Save to wishlist'}">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="${inWL ? 'currentColor' : 'none'}">
                  <path d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"
                        stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                ${inWL ? 'Saved' : 'Save'}
              </button>
            </div>
           </div>`
        : `<div class="out-of-stock-notice">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
               <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
               <path d="M8 5v3M8 10.5v.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round"/>
             </svg>
             Currently out of stock — check back soon
           </div>`}
      <div class="modal-stock-status">
        <span class="stock-dot ${product.inStock ? 'in' : 'out'}"></span>
        ${product.inStock ? 'In Stock · Ships in 2–3 days' : 'Out of Stock'}
      </div>
    </div>`;

  // Modal qty controls
  let modalQty = qty;
  document.getElementById('modal-qty-up')?.addEventListener('click', () => {
    modalQty++;
    document.getElementById('modal-qty-val').textContent = modalQty;
  });
  document.getElementById('modal-qty-down')?.addEventListener('click', () => {
    if (modalQty > 1) { modalQty--; document.getElementById('modal-qty-val').textContent = modalQty; }
  });

  document.getElementById('modal-add-cart-btn')?.addEventListener('click', () => {
    const existing = getCartItem(id);
    if (existing) {
      existing.qty += modalQty;
    } else {
      state.cart.push({ id, qty: modalQty });
    }
    saveCart();
    renderCart();
    updateBadges();
    renderCatalog();
    const product = PRODUCTS.find(p => p.id === id);
    showToast(`${product.name} ×${modalQty} added to cart`, 'success');
    closeModal();
    openCart();
  });

  document.getElementById('modal-wish-btn')?.addEventListener('click', (e) => {
    toggleWishlist(id);
    // Update button state
    const isNowWL = isInWishlist(id);
    e.currentTarget.classList.toggle('active', isNowWL);
    e.currentTarget.setAttribute('aria-pressed', isNowWL);
    e.currentTarget.setAttribute('aria-label', isNowWL ? 'Remove from wishlist' : 'Save to wishlist');
    e.currentTarget.querySelector('path').setAttribute('fill', isNowWL ? 'currentColor' : 'none');
    e.currentTarget.textContent = '';
    e.currentTarget.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="${isNowWL ? 'currentColor' : 'none'}"><path d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.5-7 9-7 9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>${isNowWL ? 'Saved' : 'Save'}`;
  });

  const overlay = document.getElementById('modal-overlay');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));
  document.body.classList.add('modal-open');
  document.getElementById('modal-close').focus();
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('visible');
  setTimeout(() => { overlay.hidden = true; }, 350);
  document.body.classList.remove('modal-open');
  state.modalProductId = null;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    wishlist: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('visible')); });
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ─── FLY TO CART ANIMATION ────────────────────────────────────────────────────
function flyToCart(productId) {
  const card = document.querySelector(`.card-wrapper[data-id="${productId}"] .card-image-bg`);
  const cartBtn = document.getElementById('cart-btn');
  if (!card || !cartBtn) return;

  const cardRect = card.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  const fly = document.createElement('div');
  fly.className = 'fly-particle';
  fly.style.cssText = `
    left: ${cardRect.left + cardRect.width / 2}px;
    top: ${cardRect.top + cardRect.height / 2}px;
    --tx: ${cartRect.left + cartRect.width / 2 - (cardRect.left + cardRect.width / 2)}px;
    --ty: ${cartRect.top + cartRect.height / 2 - (cardRect.top + cardRect.height / 2)}px;`;
  document.body.appendChild(fly);
  fly.addEventListener('animationend', () => fly.remove());
}

// ─── CHECKOUT FLOW ────────────────────────────────────────────────────────────
function triggerCheckout() {
  closeCart();
  const confirm = document.getElementById('order-confirm');
  confirm.hidden = false;
  requestAnimationFrame(() => confirm.classList.add('visible'));
  clearCart();
}

// ─── FILTER HELPERS ───────────────────────────────────────────────────────────
function setCategory(cat) {
  state.filters.category = cat;
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.category === cat);
  });
  renderCatalog();
}

function resetFilters() {
  state.filters = { category: 'All', search: '', maxPrice: MAX_PRICE_CEILING, inStockOnly: false, sort: 'default' };
  document.getElementById('header-search').value = '';
  const prRange = document.getElementById('price-range');
  prRange.value = MAX_PRICE_CEILING;
  prRange.style.setProperty('--val', '100%');
  document.getElementById('price-display').textContent = `$${MAX_PRICE_CEILING.toLocaleString()}`;
  document.getElementById('instock-toggle').checked = false;
  document.getElementById('sort-select').value = 'default';
  setCategory('All');
}

// ─── KEYBOARD SHORTCUT ────────────────────────────────────────────────────────
function setupSearchShortcut() {
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('header-search').focus();
    }
    if (e.key === 'Escape') {
      if (!document.getElementById('modal-overlay').hidden) closeModal();
      if (state.cartOpen) closeCart();
      if (state.wishlistOpen) closeWishlist();
    }
  });
}

// ─── HEADER SCROLL ────────────────────────────────────────────────────────────
function setupHeaderScroll() {
  let lastY = 0;
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    lastY = y;
  }, { passive: true });
}

// ─── EVENT DELEGATION ─────────────────────────────────────────────────────────
function setupDelegatedEvents() {
  // Product grid: card actions
  document.getElementById('product-grid').addEventListener('click', e => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) {
      // Card click = open modal
      const card = e.target.closest('.product-card');
      if (card) {
        const id = parseInt(card.dataset.id, 10);
        openModal(id);
      }
      return;
    }
    const id = parseInt(actionBtn.dataset.id, 10);
    e.stopPropagation();
    switch (actionBtn.dataset.action) {
      case 'addtocart':  addToCart(id); break;
      case 'wishlist':   toggleWishlist(id); break;
      case 'quickview':  openModal(id); break;
    }
  });

  // Card keyboard accessibility
  document.getElementById('product-grid').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.product-card');
      if (card && e.target === card) {
        e.preventDefault();
        openModal(parseInt(card.dataset.id, 10));
      }
    }
  });

  // Cart drawer
  document.getElementById('cart-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    switch (btn.dataset.action) {
      case 'qty-up':    updateQty(id, 1); break;
      case 'qty-down':  updateQty(id, -1); break;
      case 'remove':    removeFromCart(id); break;
    }
  });

  // Empty cart "browse" button (dynamic)
  document.getElementById('cart-body').addEventListener('click', e => {
    if (e.target.id === 'empty-cart-shop') { closeCart(); }
  });

  // Wishlist drawer
  document.getElementById('wishlist-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    switch (btn.dataset.action) {
      case 'wish-add-cart': addToCart(id); break;
      case 'wish-remove':   toggleWishlist(id); break;
    }
  });

  // Category pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => setCategory(pill.dataset.category));
  });

  // Nav category links (header nav + mobile nav only — not the filter pills)
  document.querySelectorAll('.nav-link[data-category], .mobile-nav-link[data-category]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const cat = link.dataset.category;
      setCategory(cat);
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hero "new arrivals"
  document.getElementById('hero-new-btn')?.addEventListener('click', e => {
    e.preventDefault();
    state.filters.sort = 'newest';
    document.getElementById('sort-select').value = 'newest';
    setCategory('All');
    renderCatalog();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });

  // Hero shop btn
  document.getElementById('hero-shop-btn')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });

  // Sort select
  document.getElementById('sort-select').addEventListener('change', e => {
    state.filters.sort = e.target.value;
    renderCatalog();
  });

  // Search
  const searchInput = document.getElementById('header-search');
  let searchTimer;
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = e.target.value;
      renderCatalog();
    }, 180);
  });

  // Price range — update filter state, display label, and slider fill via CSS custom property
  const priceRangeEl = document.getElementById('price-range');
  function updatePriceRangeFill(el) {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty('--val', pct + '%');
  }
  updatePriceRangeFill(priceRangeEl); // set initial fill
  priceRangeEl.addEventListener('input', e => {
    const val = parseInt(e.target.value, 10);
    state.filters.maxPrice = val;
    document.getElementById('price-display').textContent = `$${val.toLocaleString()}`;
    updatePriceRangeFill(e.target);
    renderCatalog();
  });

  // Stock toggle
  document.getElementById('instock-toggle').addEventListener('change', e => {
    state.filters.inStockOnly = e.target.checked;
    renderCatalog();
  });

  // Cart button
  document.getElementById('cart-btn').addEventListener('click', () => {
    state.cartOpen ? closeCart() : openCart();
  });
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Wishlist button
  document.getElementById('wishlist-btn').addEventListener('click', () => {
    state.wishlistOpen ? closeWishlist() : openWishlist();
  });
  document.getElementById('wishlist-close').addEventListener('click', closeWishlist);
  document.getElementById('wishlist-overlay').addEventListener('click', closeWishlist);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Checkout
  document.getElementById('checkout-btn').addEventListener('click', triggerCheckout);
  document.getElementById('confirm-continue').addEventListener('click', () => {
    const confirm = document.getElementById('order-confirm');
    confirm.classList.remove('visible');
    setTimeout(() => { confirm.hidden = true; }, 400);
  });

  // Promo banner close
  document.getElementById('promo-close').addEventListener('click', () => {
    const banner = document.getElementById('promo-banner');
    banner.style.height = banner.offsetHeight + 'px';
    banner.classList.add('closing');
    setTimeout(() => { banner.hidden = true; }, 400);
  });

  // Reset filters button
  document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);

  // Mobile menu
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const nav = document.getElementById('mobile-nav');
    const btn = document.getElementById('mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
    nav.setAttribute('aria-hidden', !isOpen);
  });

  // Mobile nav links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('mobile-nav').classList.remove('open');
      document.getElementById('mobile-menu-btn').classList.remove('active');
      document.getElementById('mobile-menu-btn').setAttribute('aria-expanded', 'false');
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  loadCart();
  loadWishlist();
  renderCatalog();
  renderCart();
  renderWishlist();
  updateBadges();
  setupDelegatedEvents();
  setupSearchShortcut();
  setupHeaderScroll();

  // Intersection observer for card entrance animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  // Observe catalog section to trigger card animations on re-renders
  const catalogObserver = new MutationObserver(() => {
    document.querySelectorAll('.card-wrapper:not(.in-view)').forEach(el => observer.observe(el));
  });
  catalogObserver.observe(document.getElementById('product-grid'), { childList: true });

  // Seed the already-rendered first batch (MutationObserver only fires on future changes)
  document.querySelectorAll('.card-wrapper:not(.in-view)').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', init);
