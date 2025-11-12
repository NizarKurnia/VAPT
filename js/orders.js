document.addEventListener('DOMContentLoaded', ()=> {
  const list = document.getElementById('orders-list');
  list.innerHTML = '<div class="card">Loading...</div>';
  apiFetch('/orders/mine', { method: 'GET' }).then(res=>{
    if(res.status === 200 && Array.isArray(res.body)){
      if(!res.body.length) list.innerHTML = '<div class="card">No orders yet</div>';
      else list.innerHTML = res.body.map(o=> `<div class="card"><h3>Order #${escapeHtml(o.id)}</h3><div>Status: ${escapeHtml(o.status)}</div><div>Total: $${Number(o.total).toFixed(2)}</div></div>`).join('');
    } else {
      list.innerHTML = '<div class="card">Unable to load orders</div>';
    }
  });
});

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>'); }
