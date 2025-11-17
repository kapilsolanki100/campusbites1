import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export default function CampusBitesPreview(){
  const [view, setView] = useState('student')
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [orders, setOrders] = useState([])
  const [student, setStudent] = useState({ roll:'', email:'' })
  const [form, setForm] = useState({ name:'', description:'', price:'' })

  useEffect(()=>{
    const unsubMenu = onSnapshot(collection(db,'menu'), snap => {
      const items = []
      snap.forEach(d=>items.push({ id:d.id, ...d.data() }))
      setMenu(items)
    })
    const unsubOrders = onSnapshot(collection(db,'orders'), snap => {
      const arr = []
      snap.forEach(d=>arr.push({ id:d.id, ...d.data() }))
      setOrders(arr)
    })
    return ()=>{ unsubMenu(); unsubOrders(); }
  },[])

  const addToCart = (item) => setCart(prev => ({...prev, [item.id]: (prev[item.id]||0)+1}))
  const removeFromCart = (id) => setCart(prev => { const n={...prev}; delete n[id]; return n })

  const placeOrder = async ()=>{
    if(!student.roll||!student.email) return alert('Enter details')
    const cartItems = Object.entries(cart).map(([id,qty])=>({id,qty}))
    await addDoc(collection(db,'orders'), { student, cart:cartItems, status:'Pending', createdAt:serverTimestamp() })
    setCart({})
  }

  const addMenu = async ()=>{
    await addDoc(collection(db,'menu'), form)
    setForm({ name:'', description:'', price:'' })
  }

  const markDone = async (id)=>{ await updateDoc(doc(db,'orders',id), { status:'Completed' }) }
  const delMenu = async (id)=>{ await deleteDoc(doc(db,'menu',id)) }

  return (
    <div className="p-6 font-sans min-h-screen bg-gradient-to-r from-pink-200 to-yellow-100">
      <header className="flex justify-between mb-4">
        <h1 className="text-3xl font-bold text-indigo-700">CampusBites</h1>
        <div className="space-x-2">
          <button onClick={()=>setView('student')} className="px-4 py-1 bg-indigo-500 text-white rounded">Student</button>
          <button onClick={()=>setView('admin')} className="px-4 py-1 bg-rose-500 text-white rounded">Admin</button>
        </div>
      </header>

      {view==='student'? (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white/80 p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Menu</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {menu.map(m=>(
                <div key={m.id} className="border rounded p-2">
                  <h3 className="font-medium">{m.name}</h3>
                  <p className="text-sm">{m.description}</p>
                  <div className="flex justify-between mt-2">
                    <span className="font-semibold">₹{m.price}</span>
                    <button onClick={()=>addToCart(m)} className="bg-green-500 text-white px-3 py-1 rounded">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Cart</h2>
            {Object.keys(cart).length===0? <p>No items</p> : (
              Object.entries(cart).map(([id,qty])=>{
                const it = menu.find(i=>i.id===id)
                return <div key={id} className="flex justify-between items-center mb-1"><span>{it?.name} x {qty}</span><button onClick={()=>removeFromCart(id)} className="text-red-600">x</button></div>
              })
            )}
            <input placeholder="Roll" className="w-full p-1 mt-2 border rounded" value={student.roll} onChange={e=>setStudent({...student, roll:e.target.value})} />
            <input placeholder="Email" className="w-full p-1 mt-1 border rounded" value={student.email} onChange={e=>setStudent({...student, email:e.target.value})} />
            <button onClick={placeOrder} className="w-full bg-indigo-600 text-white py-1 mt-2 rounded">Place Order</button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/80 p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Add Menu Item</h2>
            <input placeholder="Name" className="w-full p-1 mb-1 border rounded" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <input placeholder="Description" className="w-full p-1 mb-1 border rounded" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <input placeholder="Price" className="w-full p-1 mb-2 border rounded" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
            <button onClick={addMenu} className="bg-green-500 text-white px-3 py-1 rounded">Add</button>

            <h3 className="font-semibold mt-4">Menu List</h3>
            {menu.map(m=>(
              <div key={m.id} className="flex justify-between border-b py-1">
                <span>{m.name} - ₹{m.price}</span>
                <button onClick={()=>delMenu(m.id)} className="text-red-500">Delete</button>
              </div>
            ))}
          </div>

          <div className="bg-white/80 p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Orders</h2>
            {orders.map(o=>(
              <div key={o.id} className="border rounded p-2 mb-2">
                <div className="font-medium">{o.student?.roll}</div>
                <div className="text-sm">{o.student?.email}</div>
                <div className="text-sm">Status: {o.status}</div>
                {o.status!=='Completed' && <button onClick={()=>markDone(o.id)} className="mt-1 bg-indigo-500 text-white px-2 py-1 rounded">Mark Done</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
