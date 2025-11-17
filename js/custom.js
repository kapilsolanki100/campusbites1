// custom.js - improved real-time listeners + QR and cart
import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const UPI_ID = 'rio321@ptyes';
const ADMIN_EMAIL = 'kapilsolanki971942@gmail.com';
const ADMIN_KEY = 'Campusbites@123';

const menuGrid = document.getElementById('menu-grid');
const cartPanel = document.getElementById('cart-panel');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const openCartBtn = document.getElementById('open-cart');
const checkoutBtn = document.getElementById('checkout');
const modalRoot = document.getElementById('modal-root');
const adminLoginBtn = document.getElementById('admin-login');

let cart = {};
function saveCart(){ localStorage.setItem('campusbites_cart', JSON.stringify(cart)); }
function loadCart(){ cart = JSON.parse(localStorage.getItem('campusbites_cart') || '{}'); updateCartUI(); }
loadCart();

function updateCartUI(){
  const items = Object.values(cart);
  cartItemsEl.innerHTML = items.length ? items.map(it=>`<div class="cart-row"><div>${it.name} x ${it.qty}</div><div>₹${it.qty * it.price}</div></div>`).join('') : '<div class="small-muted">Cart is empty</div>';
  const total = items.reduce((s,i)=>s + i.qty * i.price,0);
  cartTotalEl.textContent = total;
  cartCountEl.textContent = items.reduce((s,i)=>s + i.qty,0);
}

function addToCart(item){
  if(!item.available){ alert('Not available'); return; }
  if(!cart[item.id]) cart[item.id] = {...item, qty:0};
  cart[item.id].qty++;
  saveCart();
  updateCartUI();
}

openCartBtn.addEventListener('click', ()=> cartPanel.hidden = !cartPanel.hidden);

// Subscribe to menu in realtime with error handling
const menuCol = collection(db,'menu_items');
const menuQuery = query(menuCol, orderBy('name'));

onSnapshot(menuQuery, snap => {
  console.log('[menu] snapshot size:', snap.size);
  if(snap.empty){
    menuGrid.innerHTML = '<div class="small-muted">Menu is empty. Admin may add items from dashboard.</div>';
    return;
  }
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  renderMenu(items);
}, err => {
  console.error('[menu] onSnapshot error:', err);
  menuGrid.innerHTML = '<div class="small-muted">Error loading menu. Check firebase config and Firestore rules.</div>';
  alert('Menu load error: ' + (err.message || err));
});

function renderMenu(items){
  menuGrid.innerHTML = items.map(it=>`
    <div class="card">
      <div class="item-img" style="background-image:url('${it.img || 'img/food/lays.jpg'}')"></div>
      <div style="flex:1">
        <div class="title">${it.name}</div>
        <div class="desc">${it.desc || ''}</div>
      </div>
      <div class="meta">
        <div class="price">₹${it.price}</div>
        <div>${it.available ? `<button class="add-btn" data-id="${it.id}">Add</button>` : '<div class="small-muted">Not available</div>'}</div>
      </div>
    </div>
  `).join('');
  // wire add buttons
  document.querySelectorAll('.add-btn').forEach(b => b.addEventListener('click', ()=>{
    const id = b.dataset.id;
    const item = items.find(x=>x.id === id);
    if(item) addToCart(item);
  }));
}

// Checkout -> details modal -> QR -> save on I Paid
checkoutBtn.addEventListener('click', ()=>{
  const items = Object.values(cart);
  if(items.length === 0){ alert('Cart is empty'); return; }
  showDetailsModal(items);
});

function showDetailsModal(items){
  const total = items.reduce((s,i)=>s + i.qty * i.price,0);
  const modal = document.createElement('div'); modal.className='modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h3>Confirm Order</h3>
      <div class="form-grid">
        <input id="cust-name" placeholder="Full name" />
        <input id="cust-roll" placeholder="Roll no" />
        <input id="cust-mobile" placeholder="Mobile" />
        <input id="cust-email" placeholder="Email" />
        <input id="cust-date" type="datetime-local" value="${new Date().toISOString().slice(0,16)}" />
        <textarea id="cust-msg" placeholder="Message (optional)"></textarea>
      </div>
      <div style="margin-top:.6rem"><strong>Total: ₹${total}</strong></div>
      <div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:.8rem">
        <button id="cancel" class="btn">Cancel</button>
        <button id="proceed" class="btn primary">Proceed to Pay</button>
      </div>
    </div>
  `;
  modalRoot.appendChild(modal);
  modal.querySelector('#cancel').addEventListener('click', ()=> modal.remove());
  modal.querySelector('#proceed').addEventListener('click', ()=>{
    const name = modal.querySelector('#cust-name').value.trim();
    const roll = modal.querySelector('#cust-roll').value.trim();
    const mobile = modal.querySelector('#cust-mobile').value.trim();
    const email = modal.querySelector('#cust-email').value.trim();
    const date = modal.querySelector('#cust-date').value;
    const msg = modal.querySelector('#cust-msg').value.trim();
    if(!name || !roll || !mobile || !email){ alert('Please fill required fields'); return; }
    modal.remove();
    showQRModal({name,roll,mobile,email,date,msg,items,amount:total});
  });
}

function showQRModal(order){
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent('CampusBites')}&am=${encodeURIComponent(order.amount)}&cu=INR&tn=${encodeURIComponent('CampusBites order')}`;
  const backdrop = document.createElement('div'); backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>Pay via UPI</h3>
      <p class="small-muted">Scan the QR code or open your UPI app. Amount: ₹${order.amount}</p>
      <div id="qrcode" style="text-align:center;margin:8px 0"></div>
      <div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:.8rem">
        <button id="qr-close" class="btn">Close</button>
        <button id="open-upi" class="btn">Open UPI</button>
        <button id="i-paid" class="btn primary">I Paid</button>
      </div>
    </div>
  `;
  modalRoot.appendChild(backdrop);
  // QR via Google Chart API (works without extra libs)
  const upiQr = `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(upiLink)}`;
  backdrop.querySelector('#qrcode').innerHTML = `<img src="${upiQr}" alt="UPI QR" style="width:200px;height:200px">`;
  backdrop.querySelector('#qr-close').addEventListener('click', ()=> backdrop.remove());
  backdrop.querySelector('#open-upi').addEventListener('click', ()=> { window.location.href = upiLink; });
  backdrop.querySelector('#i-paid').addEventListener('click', async ()=>{
    try{
      const payload = {
        name: order.name, roll: order.roll, mobile: order.mobile, email: order.email,
        date: order.date, msg: order.msg, items: order.items, amount: order.amount, createdAt: Date.now()
      };
      await addDoc(collection(db,'orders'), payload);
      // notify admin via mailto (user must send)
      const subject = encodeURIComponent('New CampusBites Order: ' + payload.name);
      const body = encodeURIComponent(`Name: ${payload.name}\nRoll: ${payload.roll}\nMobile: ${payload.mobile}\nEmail: ${payload.email}\nAmount: ₹${payload.amount}\nItems:\n${payload.items.map(i=>i.name+' x '+i.qty).join('\n')}`);
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
      cart = {}; saveCart(); updateCartUI();
      alert('Order saved. Thank you!');
      backdrop.remove();
    }catch(e){ console.error(e); alert('Failed to record order: ' + (e.message||e)); }
  });
}

// Admin login prompt
adminLoginBtn.addEventListener('click', ()=>{
  const key = prompt('Enter Admin panel key to open Canteen owner dashboard :');
  if(key === ADMIN_KEY) window.location.href = 'admin.html';
  else alert('Wrong key');
});
