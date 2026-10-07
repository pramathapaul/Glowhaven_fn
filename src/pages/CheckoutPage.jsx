import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '../api/config'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Promo code state
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoMessage, setPromoMessage] = useState(null)
  const [applyingPromo, setApplyingPromo] = useState(false)

  // Order totals (promo discount applied to subtotal)
  const discount = appliedPromo ? appliedPromo.discount : 0
  const subtotal = totalPrice
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const shipping = discountedSubtotal > 1000 ? 0 : 50
  const tax = 0
  const total = discountedSubtotal + shipping + tax

  // WhatsApp number (replace with your actual number)
  const WHATSAPP_NUMBER = '9234567890' // Replace with your WhatsApp number

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'India',
    orderNotes: ''
  })

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
    }
  }, [items, navigate])

  // If not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
    }
  }, [user, navigate])

  // Keep the applied promo in sync when the cart total changes
  useEffect(() => {
    if (!appliedPromo) return
    const revalidate = async () => {
      try {
        const token = localStorage.getItem('glowHavenToken')
        const response = await fetch(`${API_URL}/promo-codes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: appliedPromo.code,
            subtotal: totalPrice,
            items: items.map(item => ({ product: item.id, quantity: item.quantity }))
          })
        })
        const data = await response.json()
        if (data.success) {
          setAppliedPromo(data.data)
        } else {
          setAppliedPromo(null)
          setPromoMessage({ type: 'error', text: data.message || 'Promo code no longer applies' })
        }
      } catch (err) {
        console.error('Error re-validating promo code:', err)
      }
    }
    revalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice, items])

  const handleApplyPromo = async () => {
    const code = promoInput.trim()
    if (!code) return

    setApplyingPromo(true)
    setPromoMessage(null)
    try {
      const token = localStorage.getItem('glowHavenToken')
      if (!token) {
        setPromoMessage({ type: 'error', text: 'Please login to apply a promo code' })
        return
      }

      const response = await fetch(`${API_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          subtotal: totalPrice,
          items: items.map(item => ({ product: item.id, quantity: item.quantity }))
        })
      })
      const data = await response.json()

      if (data.success) {
        setAppliedPromo(data.data)
        setPromoInput(data.data.code)
        setPromoMessage({ type: 'success', text: `Promo code "${data.data.code}" applied!` })
      } else {
        setAppliedPromo(null)
        setPromoMessage({ type: 'error', text: data.message || 'Invalid promo code' })
      }
    } catch (err) {
      console.error('Error applying promo code:', err)
      setPromoMessage({ type: 'error', text: 'Failed to apply promo code' })
    } finally {
      setApplyingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
    setPromoMessage(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName) newErrors.fullName = 'Full name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    if (!formData.address) newErrors.address = 'Address is required'
    if (!formData.city) newErrors.city = 'City is required'
    if (!formData.state) newErrors.state = 'State is required'
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required'
    if (!formData.country) newErrors.country = 'Country is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateWhatsAppMessage = (orderData) => {
    // Build the order items list
    let itemsList = ''
    items.forEach((item, index) => {
      itemsList += `${index + 1}. *${item.name}*\n`
      itemsList += `   Quantity: ${item.quantity}\n`
      itemsList += `   Price: ₹${item.price.toFixed(2)}\n`
      itemsList += `   Total: ₹${(item.price * item.quantity).toFixed(2)}\n\n`
    })

    // Build the full message
    const message = `
🛍️ *NEW ORDER - GLOW HAVEN*
━━━━━━━━━━━━━━━━━━━━
📋 *Order ID: ${orderData.orderId}*

👤 *Customer Information*
━━━━━━━━━━━━━━━━━━━━
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}

📍 *Shipping Address*
━━━━━━━━━━━━━━━━━━━━
${formData.address}
${formData.city}, ${formData.state} ${formData.zipCode}
${formData.country}

📦 *Order Items*
━━━━━━━━━━━━━━━━━━━━
${itemsList}

💰 *Order Summary*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${subtotal.toFixed(2)}
${appliedPromo ? `Promo (${appliedPromo.code}): -₹${discount.toFixed(2)}\n` : ''}Shipping: ${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
Tax: ₹0.00
━━━━━━━━━━━━━━━━━━━━
*TOTAL: ₹${total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━

${formData.orderNotes ? `📝 *Notes:*\n${formData.orderNotes}\n━━━━━━━━━━━━━━━━━━━━` : ''}

Thank you for choosing Glow Haven! ✨
    `.trim()

    return encodeURIComponent(message)
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const token = localStorage.getItem('glowHavenToken')
      if (!token) {
        alert('Please login to place an order')
        navigate('/login')
        return
      }

      const subtotal = totalPrice
      const shipping = discountedSubtotal > 1000 ? 0 : 50
      const tax = 0
      const total = discountedSubtotal + shipping + tax

      // 1. Create order in database
      const orderData = {
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          color: item.color ? {
            name: item.color.name,
            hex: item.color.hex
          } : null
        })),
        shippingAddress: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        paymentMethod: 'WhatsApp Order',
        subtotal: subtotal,
        shippingCost: shipping,
        tax: tax,
        total: total,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        notes: formData.orderNotes || 'Order placed via WhatsApp'
      }

      // console.log('📦 Creating order:', orderData)

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()
      // console.log('✅ Order response:', data)

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order')
      }

      const order = data.data

      // 2. Generate WhatsApp message with order ID
      const message = generateWhatsAppMessage(order)

      // 3. Open WhatsApp with the message
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
      window.open(whatsappUrl, '_blank')

      // 4. Clear cart
      clearCart()

      // 5. Navigate to order details page
      navigate(`/order/${order.orderId}`)

    } catch (error) {
      console.error('❌ Error placing order:', error)
      if (error.message && /already used|usage limit|paused|expired|invalid promo/i.test(error.message)) {
        handleRemovePromo()
        setPromoMessage({ type: 'error', text: error.message })
      }
      alert(error.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-stack-xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-headline-md">Checkout</h1>
        <Link to="/cart" className="text-primary font-label-caps text-label-caps hover:underline">
          ← Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <h2 className="font-playfair text-headline-sm mb-6">Shipping Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.fullName ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-error text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.email ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-error text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full bg-surface-container-low border-b-2 ${errors.phone ? 'border-error' : 'border-outline-variant focus:border-primary'
                    } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="text-error text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full bg-surface-container-low border-b-2 ${errors.address ? 'border-error' : 'border-outline-variant focus:border-primary'
                    } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                  placeholder="123 Main St"
                />
                {errors.address && (
                  <p className="text-error text-xs mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.city ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="text-error text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.state ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="text-error text-xs mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.zipCode ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="400001"
                  />
                  {errors.zipCode && (
                    <p className="text-error text-xs mt-1">{errors.zipCode}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-b-2 ${errors.country ? 'border-error' : 'border-outline-variant focus:border-primary'
                      } py-2 px-0 focus:ring-0 outline-none transition-colors`}
                    placeholder="India"
                  />
                  {errors.country && (
                    <p className="text-error text-xs mt-1">{errors.country}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 px-0 focus:ring-0 outline-none transition-colors resize-none"
                  placeholder="Any special instructions or delivery notes..."
                />
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-green-600 text-white py-4 rounded-full font-label-caps text-label-caps hover:bg-green-700 transition-colors mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">whatsapp</span>
                    Place Order via WhatsApp
                  </>
                )}
              </button>

              <p className="text-center text-xs text-on-surface-variant mt-2">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm sticky top-32">
            <h3 className="font-playfair text-headline-sm mb-4">Order Summary</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-outline-variant/30">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary-container flex-shrink-0">
                    <img className="w-full h-full object-cover" src={item.img} alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="mb-4">
              {!appliedPromo ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    placeholder="Promo code"
                    className="flex-1 min-w-0 bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors uppercase text-sm"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors disabled:opacity-50 text-xs"
                  >
                    {applyingPromo ? '...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-green-700 min-w-0">
                      <span className="material-symbols-outlined text-base">local_offer</span>
                      <span className="font-semibold truncate">{appliedPromo.code}</span>
                      <span className="text-xs">-₹{appliedPromo.discount.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-xs text-red-600 font-semibold hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                  {appliedPromo.categories && appliedPromo.categories.length > 0 && (
                    <p className="text-xs text-green-700/80 mt-1">
                      Applies to: {appliedPromo.categories.join(', ')}
                    </p>
                  )}
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs mt-2 ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-outline-variant">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal ({items.length} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo discount ({appliedPromo.code})</span>
                  <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Shipping</span>
                <span className="font-semibold">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Tax</span>
                <span className="font-semibold">₹0.00</span>
              </div>
              <div className="border-t border-outline-variant pt-3 mt-3">
                <div className="flex justify-between font-playfair text-headline-sm">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="material-symbols-outlined text-base">info</span>
                <span>You'll be redirected to WhatsApp to confirm your order.</span>
              </div>
            </div>

            <Link to="/cart" className="block text-center mt-4 text-primary font-label-caps text-label-caps hover:underline text-sm">
              Edit Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
