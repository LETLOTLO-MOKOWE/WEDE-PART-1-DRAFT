// FRESHMART simple JS: cart (localStorage) + form validation UX

(function () {
  'use strict';

  const CART_KEY = 'freshmart_cart_items_v1';

  function safeText(el) {
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#39;');
  }


  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function addToCart(item) {
    const items = getCart();
    items.push({
      name: item.name,
      price: item.price || null,
      addedAt: new Date().toISOString(),
    });
    setCart(items);
    return items;
  }

  function wireBuyButtons() {
    // products page only
    const catalog = document.querySelector('.catalog');
    if (!catalog) return;

    const buttons = catalog.querySelectorAll('button');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // Prevent any accidental default action
        e.preventDefault();

        // Product name is usually inside the nearest <b> in the product card
        const productCard = btn.closest('.product');
        if (!productCard) return;

        const bold = productCard.querySelector('b');
        const name = safeText(bold);

        // Try to extract a price like Rxx or Rxx,xx or Rxx.xx
        let price = null;
        if (bold) {
          const m = safeText(bold).match(/R\s?\d+[\d\.,]*/i);
          if (m) price = m[0].replace(/\s+/g, '');
        }

        addToCart({ name, price });
        const count = getCart().length;
        alert(`Added to cart: ${name || 'Item'}\nCart items: ${count}`);
      });
    });
  }

  function wireForms() {
    const forms = document.querySelectorAll('form');
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        const requiredInputs = form.querySelectorAll('[required]');
        let missing = [];

        requiredInputs.forEach((input) => {
          const value = (input.value || '').trim();
          if (!value) {
            const placeholder = input.getAttribute('placeholder');
            missing.push(placeholder || input.name || 'Field');
          }
        });

        if (missing.length) {
          e.preventDefault();
          alert(`Please complete the following required fields:\n- ${missing.join('\n- ')}`);
          return;
        }

        // Basic email check when type=email is used
        const email = form.querySelector('input[type="email"]');
        if (email) {
          const val = (email.value || '').trim();
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          if (!ok) {
            e.preventDefault();
            alert('Please enter a valid email address.');
            return;
          }
        }

        // UX: prevent real navigation (no backend). Show success message.
        e.preventDefault();
        alert('Message sent! (Demo)');

        // Optional: clear the form
        form.reset();
      });
    });
  }

  function wireCartPage() {
    const cartEmpty = document.getElementById('cartEmpty');
    const cartContent = document.getElementById('cartContent');
    const cartRows = document.getElementById('cartRows');
    const clearCartBtn = document.getElementById('clearCartBtn');

    // If not on cart page, do nothing
    if (!cartEmpty || !cartContent || !cartRows) return;

    const items = getCart();

    if (!items.length) {
      cartEmpty.style.display = 'block';
      cartContent.style.display = 'none';
      return;
    }

    cartEmpty.style.display = 'none';
    cartContent.style.display = 'block';

    function parsePriceToNumber(price) {
      // Handles common SA/European formats: "R52,99", "R14.55", "29,99", "29.99", and "R1,234.56".
      if (!price) return 0;
      const s = String(price);
      const m = s.match(/\d[\d.,]*/);
      if (!m) return 0;

      const raw = m[0];
      const lastComma = raw.lastIndexOf(',');
      const lastDot = raw.lastIndexOf('.');

      // If both exist, the one that appears last is the decimal separator.
      // If only one exists: treat ',' or '.' as decimal separator (SA vs EU). Thousands separators are uncommon here.
      const decimalSep = lastComma > lastDot ? ',' : '.';
      const hasBoth = lastComma !== -1 && lastDot !== -1;

      let normalized;
      if (hasBoth) {
        // Remove thousands separators (the one that is NOT decimalSep) then convert decimalSep to '.'.
        normalized = raw
          .replaceAll(decimalSep === ',' ? '.' : ',', '')
          .replaceAll(decimalSep, '.');
      } else {
        // Only one separator type present -> treat it as decimal separator.
        normalized = raw.replaceAll(',', '.');
      }

      const num = Number(normalized);
      return Number.isFinite(num) ? num : 0;
    }

    const total = items.reduce((sum, it) => sum + parsePriceToNumber(it.price), 0);


    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
      cartTotalEl.textContent = total.toFixed(2);
    }

    cartRows.innerHTML = items
      .map((it) => {
        const added = it.addedAt ? new Date(it.addedAt) : null;
        const addedText = added && !isNaN(added.getTime())
          ? added.toLocaleString()
          : (it.addedAt || '');

        return `
          <tr>
            <td>${escapeHtml(it.name || 'Item')}</td>
            <td>${escapeHtml(it.price || '-')}</td>
            <td>${escapeHtml(addedText)}</td>
          </tr>
        `;

      })
      .join('');


    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        setCart([]);
        // reload UI
        wireCartPage();
      });
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    wireBuyButtons();
    wireForms();
    wireCartPage();
  });
})();


