/* ==========================================================================
   BREWLAB CONSTANȚA — LOGICĂ SIMPLIFICATĂ
   Meniu, Comandă cu Ridicare (WhatsApp/Telefon) & Solicitare Rezervare
   ========================================================================== */

// 1. DATELE PENTRU MENIU (Specialty Coffee & Patiserie)
const MENU_ITEMS = [
  {
    id: 'ethiopia-pourover',
    name: 'V60 Etiopia Yirgacheffe',
    category: 'filtru',
    price: 24,
    description: 'Cafea de origine unică, prăjită light. Note curate de iasomie și caisă.',
    volume: '250ml'
  },
  {
    id: 'flat-white-oat',
    name: 'Flat White cu Lapte de Ovăz Bio',
    category: 'espresso',
    price: 21,
    description: 'Dublu shot de espresso Colombia Huila și micro-spumă catifelată de ovăz.',
    volume: '180ml'
  },
  {
    id: 'espresso-dublu',
    name: 'Espresso Dublu (Doppio)',
    category: 'espresso',
    price: 14,
    description: 'Extracție echilibrată din lot proaspăt, cu aciditate fină și corp ciocolatiu.',
    volume: '40ml'
  },
  {
    id: 'caramel-salted-latte',
    name: 'Artisan Salted Caramel Latte',
    category: 'specialitati',
    price: 25,
    description: 'Sirop preparat în casă din caramel brun, sare de mare și lapte mătăsos.',
    volume: '300ml'
  },
  {
    id: 'nitro-cold-brew',
    name: 'Nitro Cold Brew',
    category: 'rece',
    price: 23,
    description: 'Infuzie la rece timp de 20 de ore, servită cu presiune de azot pentru textură densă.',
    volume: '330ml'
  },
  {
    id: 'iced-pistachio-latte',
    name: 'Iced Pistachio Latte',
    category: 'rece',
    price: 27,
    description: 'Cremă pură de fistic, espresso dublu proaspăt și lapte turnat peste gheață.',
    volume: '350ml'
  },
  {
    id: 'croissant-unt-fistic',
    name: 'Croissant cu Unt și Cremă de Fistic',
    category: 'patiserie',
    price: 19,
    description: 'Foietaj rumenit crocant, copt proaspăt în fiecare dimineață.',
    volume: '140g'
  },
  {
    id: 'avocado-sourdough-toast',
    name: 'Avocado Toast pe Pâine cu Maia',
    category: 'patiserie',
    price: 36,
    description: 'Pâine cu maia fermentată lent, avocado proaspăt, fulgi de ardei și semințe.',
    volume: '260g'
  }
];

// STATE MANAGEMENT
let cart = loadCart();
let currentCategory = 'all';

// Reconstruiește coșul doar din produsele cunoscute (localStorage poate fi modificat manual)
function loadCart() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem('brewlab_pickup_cart') || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(saved)) return [];

  return saved.reduce((list, entry) => {
    const item = MENU_ITEMS.find(i => i.id === entry?.id);
    const quantity = Math.min(Math.floor(Number(entry?.quantity)), 99);
    if (item && quantity > 0 && !list.some(i => i.id === item.id)) {
      list.push({ id: item.id, name: item.name, price: item.price, quantity });
    }
    return list;
  }, []);
}

// Escapează textul introdus de utilizator înainte de a-l pune în HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

// INIȚIALIZARE DOM
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateCartBadge();
  renderCartDrawer();
  initReservationForm();
});

// 2. RENDER MENIU (Simplu, aerisit, fără carduri încărcate)
function renderMenu() {
  const container = document.getElementById('menu-list-container');
  if (!container) return;

  const filteredItems = currentCategory === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.category === currentCategory);

  container.innerHTML = filteredItems.map(item => `
    <article class="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5DCCE] flex flex-col justify-between hover:border-[#A84D2B] transition-colors">
      <div>
        <div class="flex justify-between items-baseline gap-3 mb-1.5">
          <h3 class="text-lg font-bold text-[#211510] leading-snug">
            ${item.name}
          </h3>
          <span class="text-base font-bold text-[#A84D2B] whitespace-nowrap">
            ${item.price} Lei
          </span>
        </div>
        <p class="text-sm text-[#5C4E46] mb-3 leading-relaxed">
          ${item.description}
        </p>
        <span class="inline-block text-xs font-medium text-[#5C4E46] bg-[#FAF7F2] px-2.5 py-1 rounded-md mb-4 border border-[#E5DCCE]">
          Gramaj: ${item.volume}
        </span>
      </div>

      <div>
        <button 
          onclick="addToCart('${item.id}')"
          class="w-full py-2.5 px-4 bg-transparent hover:bg-[#FAF7F2] text-[#211510] hover:text-[#A84D2B] border border-[#E5DCCE] hover:border-[#A84D2B] rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
          <span aria-hidden="true">+</span>
          <span>Adaugă pentru ridicare</span>
        </button>
      </div>
    </article>
  `).join('');
}

// Filtrare categorii
function filterCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });
  renderMenu();
}

// 3. COMANDĂ PENTRU RIDICARE (Flux transparent cu WhatsApp & Telefon)
function addToCart(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const existing = cart.find(i => i.id === itemId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, 99);
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`Ai adăugat „${item.name}” în lista de ridicare.`);
}

function updateQuantity(itemId, delta) {
  const item = cart.find(i => i.id === itemId);
  if (!item) return;

  item.quantity = Math.min(item.quantity + delta, 99);
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== itemId);
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast('Produs eliminat.');
}

function saveCart() {
  try {
    localStorage.setItem('brewlab_pickup_cart', JSON.stringify(cart));
  } catch {
    // Stocare indisponibilă (mod privat): coșul rămâne doar în sesiunea curentă
  }
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-counter-badge');
  badges.forEach(b => {
    b.textContent = totalCount;
    if (totalCount > 0) {
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const footerEl = document.getElementById('cart-footer-actions');
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const whatsappBtn = document.getElementById('btn-order-whatsapp');

  if (!listContainer) return;

  if (cart.length === 0) {
    listContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (footerEl) footerEl.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (footerEl) footerEl.classList.remove('hidden');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (subtotalEl) subtotalEl.textContent = `${total} Lei`;

  // Generează lista produselor
  listContainer.innerHTML = cart.map(item => `
    <div class="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5DCCE]">
      <div class="flex-1 min-w-0 pr-3">
        <h4 class="text-sm font-bold text-[#211510] truncate">${item.name}</h4>
        <p class="text-xs text-[#5C4E46]">${item.price} Lei × ${item.quantity} = <strong class="text-[#211510]">${item.price * item.quantity} Lei</strong></p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="updateQuantity('${item.id}', -1)" aria-label="Scade cantitatea" class="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E5DCCE] text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-[#E5DCCE]">-</button>
        <span class="text-sm font-semibold text-[#211510] min-w-[18px] text-center">${item.quantity}</span>
        <button onclick="updateQuantity('${item.id}', 1)" aria-label="Crește cantitatea" class="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E5DCCE] text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-[#E5DCCE]">+</button>
        <button onclick="removeFromCart('${item.id}')" aria-label="Elimină produsul" class="ml-1 text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer">✕</button>
      </div>
    </div>
  `).join('');

  // Pregătește mesajul de WhatsApp precompletat
  if (whatsappBtn) {
    const itemsText = cart.map(i => `• ${i.quantity}x ${i.name} (${i.price * i.quantity} Lei)`).join('\n');
    const message = `Bună ziua! Aș dori să comand pentru ridicare din cafenea (Constanța):\n${itemsText}\nTotal estimat: ${total} Lei.\nAproximativ la ce oră va fi gata? Vă mulțumesc!`;
    // Placeholder WhatsApp: folosește linkul cu mesajul precompletat
    whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const panel = document.getElementById('cart-panel');
  if (!drawer || !panel) return;

  if (open) {
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      panel.classList.remove('translate-x-full');
    }, 10);
  } else {
    panel.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden', 'true');
    }, 300);
  }
}

// 4. SOLICITARE REZERVARE MASĂ
function openReservationModal() {
  const modal = document.getElementById('reservation-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // Precompletează data cu ziua de mâine dacă e goală
    const dateInput = document.getElementById('res-date');
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
  }
}

function closeReservationModal() {
  const modal = document.getElementById('reservation-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function initReservationForm() {
  const form = document.getElementById('reservation-form');
  const responseBox = document.getElementById('reservation-response');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = escapeHTML(document.getElementById('res-name').value.trim());
    const phone = escapeHTML(document.getElementById('res-phone').value.trim());
    const date = escapeHTML(document.getElementById('res-date').value);
    const time = escapeHTML(document.getElementById('res-time').value);
    const guests = escapeHTML(document.getElementById('res-guests').value);

    if (!name || !phone) return;

    // Afișează confirmarea sinceră că cererea a fost trimisă (fără a afirma disponibilitate automată)
    if (responseBox) {
      responseBox.innerHTML = `
        <div class="p-4 bg-[#FAF7F2] rounded-xl border border-[#A84D2B]/30 text-left">
          <p class="font-bold text-[#A84D2B] mb-1">✓ Cererea a fost trimisă</p>
          <p class="text-sm text-[#211510] mb-2">
            Mulțumim, <strong>${name}</strong>! Am recepționat solicitarea pentru <strong>${guests} persoane</strong>, pe data de <strong>${date}</strong>, ora <strong>${time}</strong>.
          </p>
          <p class="text-xs text-[#5C4E46]">
            Aceasta este o solicitare demonstrativă. Te vom contacta telefonic la numărul <strong>${phone}</strong> pentru a confirma disponibilitatea mesei.
          </p>
        </div>
      `;
      responseBox.classList.remove('hidden');
    }

    form.reset();
  });
}

// 5. TOAST FEEDBACK NOTIFICATION
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'p-3.5 bg-[#211510] text-white text-sm font-medium rounded-xl shadow-lg border border-[#A84D2B]/30 max-w-sm transition-all duration-300';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-nav-panel');
  const btn = document.getElementById('btn-mobile-menu');
  if (!menu) return;

  const isHidden = menu.classList.toggle('hidden');
  if (btn) btn.setAttribute('aria-expanded', !isHidden);
}
