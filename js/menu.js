document.addEventListener('DOMContentLoaded', ()=> {
  const productsDiv = document.getElementById('products');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  async function loadProducts(q){
    productsDiv.innerHTML = '<div class="card">Loading...</div>';
    const suffix = q ? '?q=' + encodeURIComponent(q) : '';
    const res = await apiFetch('/products' + suffix, { method: 'GET' });
    if(res.status === 200 && Array.isArray(res.body)){
      renderProducts(res.body, q);
    } else {
      productsDiv.innerHTML = '<div class="card">Unable to load products</div>';
    }
  }

  function renderProducts(items, q){
    if(!items.length){
      productsDiv.innerHTML = `<div class="card">No items for query: ${q}</div>`;
      return;
    }
    productsDiv.innerHTML = items.map(p => productCard(p, q)).join('');
    document.querySelectorAll('.add-cart').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        addToCart({id,name,price,qty:1});
      });
    });
  }

  function productCard(p, q){
    const img = p.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">No image</text></svg>';
    return `<div class="card">
      <img src="${img}" alt="${escapeHtml(p.name)}" />
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.desc || '')}</p>
      <div class="price">$${p.price.toFixed(2)}</div>
      <button class="btn add-cart" data-id="${p.id}" data-name="${escapeAttr(p.name)}" data-price="${p.price}" style="width:100%;margin-top:12px;">Add to cart</button>
    </div>`;
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>'); }
  function escapeAttr(s){ return String(s).replace(/"/g,'"'); }

  function addToCart(item){
    const raw = localStorage.getItem('kk_cart') || '[]';
    const cart = JSON.parse(raw);
    const idx = cart.findIndex(c=>c.id===item.id);
    if(idx >= 0) cart[idx].qty += 1;
    else cart.push(item);
    localStorage.setItem('kk_cart', JSON.stringify(cart));
    document.getElementById('cart-count').textContent = cart.length;
    apiFetch('/cart/save', { method: 'POST', body: JSON.stringify({ cart }) });
    alert('Added to cart');
  }

  searchBtn && searchBtn.addEventListener('click', ()=> loadProducts(searchInput.value));
  searchInput && searchInput.addEventListener('keydown', (e)=> {
    if(e.key === 'Enter') loadProducts(searchInput.value);
  });
  loadProducts();
});
