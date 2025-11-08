import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Package, DollarSign, MapPin, Calendar, User, LogIn, LogOut } from 'lucide-react';

const PartyRentalApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Folding Chair', price: 5, deposit: 10, image: '🪑', stock: 50 },
    { id: 2, name: 'Canopy Tent (10x10)', price: 50, deposit: 100, image: '⛺', stock: 10 },
    { id: 3, name: 'Round Table', price: 15, deposit: 30, image: '🪵', stock: 20 },
    { id: 4, name: 'Dinner Plates (Set of 10)', price: 8, deposit: 15, image: '🍽️', stock: 30 },
    { id: 5, name: 'Cutlery Set (10 pieces)', price: 6, deposit: 10, image: '🍴', stock: 40 },
    { id: 6, name: 'Serving Bowls (Set of 5)', price: 10, deposit: 20, image: '🥣', stock: 25 },
    { id: 7, name: 'Beverage Dispenser', price: 12, deposit: 25, image: '🥤', stock: 15 },
    { id: 8, name: 'Party Lights String', price: 20, deposit: 30, image: '💡', stock: 20 },
  ]);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    deliveryDate: '',
    deliveryTime: ''
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await window.storage.list('order:', true);
      if (result && result.keys) {
        const orderPromises = result.keys.map(key => 
          window.storage.get(key, true)
        );
        const orderResults = await Promise.all(orderPromises);
        const loadedOrders = orderResults
          .filter(r => r && r.value)
          .map(r => JSON.parse(r.value))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setOrders(loadedOrders);
      }
    } catch (error) {
      console.log('No orders yet');
      setOrders([]);
    }
    setLoading(false);
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deposit = cart.reduce((sum, item) => sum + (item.deposit * item.quantity), 0);
    return { subtotal, deposit, total: subtotal + deposit };
  };

  const handleCheckout = async () => {
    if (!checkoutData.name || !checkoutData.email || !checkoutData.phone || 
        !checkoutData.location || !checkoutData.deliveryDate || !checkoutData.deliveryTime) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { subtotal, deposit, total } = calculateTotal();
    const order = {
      id: `ORD-${Date.now()}`,
      ...checkoutData,
      items: cart,
      subtotal,
      deposit,
      total,
      status: 'Pending',
      timestamp: new Date().toISOString()
    };

    try {
      await window.storage.set(`order:${order.id}`, JSON.stringify(order), true);
      alert(`Order confirmed! Order ID: ${order.id}\n\nTotal: $${total.toFixed(2)}\nDeposit (Refundable): $${deposit.toFixed(2)}`);
      setCart([]);
      setShowCheckout(false);
      setCheckoutData({
        name: '',
        email: '',
        phone: '',
        location: '',
        deliveryDate: '',
        deliveryTime: ''
      });
    } catch (error) {
      alert('Error placing order. Please try again.');
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, status: newStatus };
      try {
        await window.storage.set(`order:${orderId}`, JSON.stringify(updatedOrder), true);
        await loadOrders();
      } catch (error) {
        alert('Error updating order status');
      }
    }
  };

  const { subtotal, deposit, total } = calculateTotal();

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-purple-600 flex items-center gap-2">
                <Package className="w-8 h-8" />
                Admin Dashboard
              </h1>
              <button
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">All Orders</h2>
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-center text-gray-600">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{order.id}</h3>
                        <p className="text-sm text-gray-600">{new Date(order.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Deposit: ${order.deposit.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4" />
                          {order.name}
                        </p>
                        <p className="text-sm text-gray-600">{order.email}</p>
                        <p className="text-sm text-gray-600">{order.phone}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4" />
                          {order.location}
                        </p>
                        <p className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          {order.deliveryDate} at {order.deliveryTime}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <p key={item.id} className="text-sm text-gray-700">
                            {item.image} {item.name} × {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="px-3 py-2 border-2 border-purple-300 rounded-lg flex-1"
                      >
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Delivered</option>
                        <option>Returned</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                      <span className={`px-4 py-2 rounded-lg font-semibold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={() => setShowCheckout(false)}
              className="mb-4 text-purple-600 hover:text-purple-800"
            >
              ← Back to Cart
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h2>

            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Order Summary</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm mb-1">
                  <span>{item.image} {item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t-2 border-purple-200 mt-2 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Refundable Deposit:</span>
                  <span>${deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-purple-600 mt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={checkoutData.name}
                  onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={checkoutData.email}
                  onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={checkoutData.phone}
                  onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Location</label>
                <input
                  type="text"
                  placeholder="Full address"
                  value={checkoutData.location}
                  onChange={(e) => setCheckoutData({...checkoutData, location: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={checkoutData.deliveryDate}
                    onChange={(e) => setCheckoutData({...checkoutData, deliveryDate: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Time</label>
                  <input
                    type="time"
                    value={checkoutData.deliveryTime}
                    onChange={(e) => setCheckoutData({...checkoutData, deliveryTime: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & Confirm Order`}
              </button>

              <p className="text-sm text-gray-600 text-center">
                *Deposit of ${deposit.toFixed(2)} will be refunded upon return of items in good condition
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-purple-600 mb-2">Party Rentals</h1>
              <p className="text-gray-600">Everything you need for your perfect party</p>
            </div>
            <button
              onClick={() => setIsAdmin(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <LogIn className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Items</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {inventory.map(item => (
                  <div key={item.id} className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition">
                    <div className="text-5xl mb-2 text-center">{item.image}</div>
                    <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">In stock: {item.stock}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-lg font-bold text-purple-600">${item.price}/day</p>
                        <p className="text-xs text-gray-500">+${item.deposit} deposit</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Cart ({cart.length})
              </h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="border-2 border-purple-100 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{item.image} {item.name}</p>
                            <p className="text-sm text-gray-600">${item.price}/day + ${item.deposit} deposit</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 bg-purple-100 rounded hover:bg-purple-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 bg-gray-100 rounded font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 bg-purple-100 rounded hover:bg-purple-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="ml-auto font-bold text-purple-600">
                            ${((item.price + item.deposit) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-purple-200 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Deposit (Refundable):</span>
                      <span className="font-semibold">${deposit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-purple-600">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyRentalApp;