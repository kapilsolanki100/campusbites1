// chatbot.js - simple rule-based assistant
const toggle = document.getElementById('chatbot-toggle');
const panel = document.getElementById('chatbot-panel');
const chatLog = document.getElementById('chat-log');
const input = document.getElementById('chat-input');
const send = document.getElementById('chat-send');

toggle.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; });
send.addEventListener('click', handle);
input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') handle(); });

function append(msg, who='bot'){
  const el = document.createElement('div'); el.className = 'msg ' + (who==='user'?'user':'bot'); el.innerText = msg;
  chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight;
}
function handle(){
  const text = input.value.trim();
  if(!text) return;
  append(text,'user'); input.value='';
  const t = text.toLowerCase();
  if(t.includes('menu')||t.includes('food')) append('Open the Menu section to browse items and add to cart. Click Order Now to jump there.');
  else if(t.includes('pay')||t.includes('upi')) append('We use UPI. At checkout you will see a QR and an "I Paid" button. After you click it, your order is recorded.');
  else if(t.includes('admin')) append('Admins: click Admin Login and enter the admin key to open the dashboard.');
  else if(t.includes('how')||t.includes('help')) append('Steps to order: Add items → Cart → Proceed to Checkout → Fill details → Pay via UPI → Click "I Paid".');
  else append('Sorry I did not understand. Try "menu", "payment", "admin login", or "how to order".');
}
