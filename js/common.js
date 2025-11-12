const API_BASE = 'http://localhost:3000/api';

function getToken(){
  return localStorage.getItem('kk_token');
}
function setToken(t){
  localStorage.setItem('kk_token', t);
}
function clearToken(){
  localStorage.removeItem('kk_token');
}

function initHeader(){
  const authLink = document.getElementById('auth-link');
  const profileLink = document.getElementById('profile-link');
  const logoutBtn = document.getElementById('logout-btn');
  const cartCount = document.getElementById('cart-count');

  if(getToken()){
    if(authLink) authLink.style.display = 'none';
    if(profileLink) profileLink.style.display = 'inline';
  } else {
    if(authLink) authLink.style.display = 'inline';
    if(profileLink) profileLink.style.display = 'none';
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', e=>{
      e.preventDefault();
      clearToken();
      window.location = 'index.html';
    });
  }

  if(cartCount){
    const cart = JSON.parse(localStorage.getItem('kk_cart') || '[]');
    cartCount.textContent = cart.length;
  }
}

async function apiFetch(path, opts = {}){
  const headers = opts.headers || {};
  const token = getToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  if(!(opts.body instanceof FormData)){
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  opts.headers = headers;
  const res = await fetch(API_BASE + path, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch(e){ return { status: res.status, body: text }; }
}

function showMsg(el, txt){
  if(!el) return;
  el.textContent = txt;
}
document.addEventListener('DOMContentLoaded', initHeader);
