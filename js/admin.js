// admin.js - improved realtime and CSV download
import { db } from './firebase.js';
import { collection, setDoc, doc, onSnapshot, deleteDoc, updateDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const menuCol = collection(db,'menu_items');
const ordersCol = collection(db,'orders');

const nameIn = document.getElementById('m-name');
const priceIn = document.getElementById('m-price');
const imgIn = document.getElementById('m-img');
const availIn = document.getElementById('m-available');
const saveBtn = document.getElementById('save-item');
const menuTable = document.getElementById('menu-table');
const ordersTable = document.getElementById('orders-table');

saveBtn.addEventListener('click', async ()=>{
  const name = nameIn.value.trim();
  const price = Number(priceIn.value);
  const img = imgIn.value.trim() || 'img/food/thali.jpg';
  const available = availIn.value === 'true';
  if(!name || !price){ alert('Provide name and price'); return; }
  const id = name.toLowerCase().replace(/\s+/g,'-');
  try{
    await setDoc(doc(db,'menu_items',id), { name, price, img, available, desc:'' });
    nameIn.value=''; priceIn.value=''; imgIn.value='';
  }catch(e){ console.error('save item failed', e); alert('Save failed: '+(e.message||e)); }
});

// realtime menu listener (order by name if exists)
const menuQuery = query(menuCol, orderBy('name'));
onSnapshot(menuQuery, snap => {
  console.log('[admin] menu docs:', snap.size);
  const rows = []; snap.forEach(d=> rows.push({ id:d.id, ...d.data() }));
  renderMenu(rows);
}, err => { console.error('[admin] menu error', err); alert('Cannot load menu: '+(err.message||err)); });

function renderMenu(items){
  menuTable.innerHTML = `<table style="width:100%"><thead><tr><th>Name</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead><tbody>` +
    items.map(it=>`<tr><td>${it.name}</td><td>₹${it.price}</td><td>${it.available?'Yes':'No'}</td><td>
      <button class="edit" data-id="${it.id}">Edit</button>
      <button class="toggle" data-id="${it.id}" data-av="${it.available}">Toggle</button>
      <button class="del" data-id="${it.id}">Delete</button>
    </td></tr>`).join('') + `</tbody></table>`;

  menuTable.querySelectorAll('.del').forEach(b=>b.addEventListener('click', async e=>{
    const id = e.target.dataset.id;
    if(!confirm('Delete item?')) return;
    try{ await deleteDoc(doc(db,'menu_items',id)); } catch(err){ console.error(err); alert('Delete failed: '+(err.message||err)); }
  }));

  menuTable.querySelectorAll('.toggle').forEach(b=>b.addEventListener('click', async e=>{
    const id = e.target.dataset.id; const av = e.target.dataset.av === 'true';
    try{ await updateDoc(doc(db,'menu_items',id), { available: !av }); } catch(err){ console.error(err); alert('Toggle failed: '+(err.message||err)); }
  }));

  menuTable.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', async e=>{
    const id = e.target.dataset.id;
    try{
      const d = await getDocs(query(collection(db,'menu_items')));
      const docData = d.docs.find(x=>x.id===id);
      if(docData){ const data = docData.data(); nameIn.value=data.name; priceIn.value=data.price; imgIn.value=data.img; availIn.value = data.available ? 'true':'false'; }
    }catch(err){ console.error(err); alert('Edit failed'); }
  }));
}

// realtime orders listener
const ordersQuery = query(ordersCol, orderBy('createdAt','desc'));
onSnapshot(ordersQuery, snap => {
  console.log('[admin] orders:', snap.size);
  const rows = []; snap.forEach(d=> rows.push({ id:d.id, ...d.data() }));
  renderOrders(rows);
}, err => { console.error('[admin] orders error', err); alert('Cannot load orders: '+(err.message||err)); });

function renderOrders(rows){
  ordersTable.innerHTML = `<table style="width:100%"><thead><tr><th>Name</th><th>Roll</th><th>Mobile</th><th>Email</th><th>Items</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead><tbody>` +
    rows.map(r=>{
      const date = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      const items = (r.items || []).map(i=>i.name + ' x ' + i.qty).join(', ');
      return `<tr><td>${r.name}</td><td>${r.roll}</td><td>${r.mobile}</td><td>${r.email}</td><td>${items}</td><td>₹${r.amount}</td><td>${date}</td><td><button class="del-order" data-id="${r.id}">Delete</button></td></tr>`;
    }).join('') + `</tbody></table>`;

  ordersTable.querySelectorAll('.del-order').forEach(b=>b.addEventListener('click', async e=>{
    const id = e.target.dataset.id; if(!confirm('Delete this order?')) return;
    try{ await deleteDoc(doc(db,'orders',id)); } catch(err){ console.error(err); alert('Delete failed'); }
  }));
}

// CSV export - Excel-compatible CSV (UTF-8 BOM) so Excel opens it nicely
document.getElementById('download-csv').addEventListener('click', async ()=>{
  try{
    const snap = await getDocs(query(ordersCol, orderBy('createdAt','desc')));
    const rows = [['Name','Roll','Email','Mobile','Items','Amount','Date']];
    snap.forEach(d=>{
      const data = d.data();
      rows.push([data.name||'', data.roll||'', data.email||'', data.mobile||'', (data.items||[]).map(i=>i.name+' x '+i.qty).join('; '), data.amount||'', new Date(data.createdAt).toLocaleString()]);
    });
    const csvContent = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    // add UTF-8 BOM for Excel
    const bom = new Uint8Array([0xEF,0xBB,0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'campusbites_orders.csv'; a.click(); URL.revokeObjectURL(url);
  }catch(err){ console.error('CSV export failed', err); alert('CSV export failed: '+(err.message||err)); }
});
