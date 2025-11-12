document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('cart-list');
  const subtotalEl = document.getElementById('subtotal');
  const discountEl = document.getElementById('discount');
  const totalEl = document.getElementById('total');
  const applyPromoBtn = document.getElementById('apply-promo');
  const promoInput = document.getElementById('promo');
  const checkoutBtn = document.getElementById('checkout-btn');
  const appliedPromoContainer = document.getElementById('applied-promo');

  let cart = JSON.parse(localStorage.getItem('kk_cart') || '[]');
  let activePromos = JSON.parse(localStorage.getItem('kk_active_promos') || '[]');

  const promos = {
    'KEBAB10': { valid: true, discount: 0.10 },
    'FIRST10': { valid: true, discount: 0.10 },
  };

  render();
  updatePromoList();

  function render() {
    if (!cart.length) {
      list.innerHTML = '<div class="card">Your cart is empty</div>';
      subtotalEl.textContent = '0.00';
      discountEl.textContent = '0.00';
      totalEl.textContent = '0.00';
      return;
    }

    list.innerHTML = cart.map((c, i) => `
      <div class="card">
        <h3>${escapeHtml(c.name)}</h3>
        <div>Price: $${c.price.toFixed(2)} x
          <input data-idx="${i}" class="qty" type="number" min="1" value="${c.qty}" style="width:60px" />
        </div>
        <div><button class="btn remove" data-idx="${i}">Remove</button></div>
      </div>
    `).join('');

    attachBtns();
    recalc();
  }

  function attachBtns() {
    document.querySelectorAll('.remove').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.idx);
        cart.splice(i, 1);
        saveCart();
        render();
      });
    });

    document.querySelectorAll('.qty').forEach(input => {
      input.addEventListener('change', () => {
        const i = Number(input.dataset.idx);
        const v = Math.max(1, Number(input.value) || 1);
        cart[i].qty = v;
        saveCart();
        recalc();
      });
    });
  }

  function recalc() {
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    let totalDiscount = 0;

    for (const code of activePromos) {
      const promo = promos[code];
      if (promo && promo.valid) {
        totalDiscount += subtotal * promo.discount;
      }
    }

    subtotalEl.textContent = subtotal.toFixed(2);
    discountEl.textContent = totalDiscount.toFixed(2);
    totalEl.textContent = (subtotal - totalDiscount).toFixed(2);
  }

  applyPromoBtn.addEventListener('click', async () => {
    const code = (promoInput.value || '').trim().toUpperCase();
    if (!code) {
      alert('Enter promo code');
      return;
    }

    const res = await apiFetch('/promo/apply', { method: 'POST', body: JSON.stringify({ code }) });
    if (res.status !== 200 || !res.body.valid) {
      alert(res.body.message || 'Invalid promo');
      return;
    }

    activePromos.push(code);
    savePromos();
    updatePromoList();
    recalc();
    promoInput.value = '';
  });

  promoInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const code = (promoInput.value || '').trim().toUpperCase();
      if (!code) {
        alert('Enter promo code');
        return;
      }

      const res = await apiFetch('/promo/apply', { method: 'POST', body: JSON.stringify({ code }) });
      if (res.status !== 200 || !res.body.valid) {
        alert(res.body.message || 'Invalid promo');
        return;
      }

      activePromos.push(code);
      savePromos();
      updatePromoList();
      recalc();
      promoInput.value = '';
    }
  });

  function updatePromoList() {
    appliedPromoContainer.innerHTML = activePromos.map(code => {
      const promo = promos[code];
      return `<div class="card">Promo applied: <strong>${escapeHtml(code)}</strong> — ${(promo.discount * 100).toFixed(0)}% off</div>`;
    }).join('');
  }

  checkoutBtn && checkoutBtn.addEventListener('click', async () => {
    if (!cart.length) { alert('Cart empty'); return; }
    const order = { items: cart, promo: activePromos };
    const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
    if (res.status === 201) {
      cart = [];
      activePromos = [];
      saveCart();
      savePromos();
      alert('Order placed');
      window.location = 'orders.html';
    } else {
      alert('Checkout failed');
    }
  });

  function saveCart() {
    localStorage.setItem('kk_cart', JSON.stringify(cart));
    apiFetch('/cart/save', { method: 'POST', body: JSON.stringify({ cart }) });
    document.getElementById('cart-count').textContent = cart.length;
  }

  function savePromos() {
    localStorage.setItem('kk_active_promos', JSON.stringify(activePromos));
  }

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>'); }
});
