import React, { useState, useEffect } from 'react'
import { API_URL } from '../../api/config'

const emptyForm = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  minOrderValue: '',
  maxDiscount: '',
  startsAt: '',
  expiresAt: '',
  maxRedemptions: '',
  isActive: true,
  categories: []
}

const toDateInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const AdminPromoCodes = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    fetchPromos()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`)
      const data = await response.json()
      if (data.success) {
        setAvailableCategories(data.data.categories || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('glowHavenToken')
      const response = await fetch(`${API_URL}/promo-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (data.success) {
        setPromos(data.data)
      } else {
        setError(data.message || 'Failed to load promo codes')
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err)
      setError('Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingPromo(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (promo) => {
    setEditingPromo(promo)
    setForm({
      code: promo.code || '',
      description: promo.description || '',
      type: promo.type || 'percent',
      value: promo.value ?? '',
      minOrderValue: promo.minOrderValue || '',
      maxDiscount: promo.maxDiscount ?? '',
      startsAt: toDateInput(promo.startsAt),
      expiresAt: toDateInput(promo.expiresAt),
      maxRedemptions: promo.maxRedemptions ?? '',
      isActive: promo.isActive !== false,
      categories: promo.categories || []
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingPromo(null)
    setFormError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const toggleCategory = (category) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const validateForm = () => {
    if (!form.code || form.code.trim().length < 3) return 'Promo code must be at least 3 characters'
    if (!form.value || Number(form.value) <= 0) return 'Discount value must be greater than 0'
    if (form.type === 'percent' && Number(form.value) > 100) return 'Percentage cannot exceed 100'
    if (form.expiresAt && form.startsAt && form.expiresAt <= form.startsAt) {
      return 'Expiry date must be after the start date'
    }
    return ''
  }

  const handleSave = async () => {
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const token = localStorage.getItem('glowHavenToken')
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue === '' ? 0 : Number(form.minOrderValue),
        maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
        maxRedemptions: form.maxRedemptions === '' ? null : Number(form.maxRedemptions),
        isActive: form.isActive,
        categories: form.categories
      }

      if (form.startsAt) payload.startsAt = new Date(form.startsAt).toISOString()
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString()

      const url = editingPromo
        ? `${API_URL}/promo-codes/${editingPromo._id}`
        : `${API_URL}/promo-codes`

      const response = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        closeForm()
        fetchPromos()
      } else {
        setFormError(data.message || 'Failed to save promo code')
      }
    } catch (err) {
      console.error('Error saving promo code:', err)
      setFormError('Failed to save promo code')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (promo) => {
    setTogglingId(promo._id)
    try {
      const token = localStorage.getItem('glowHavenToken')
      const response = await fetch(`${API_URL}/promo-codes/${promo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !promo.isActive })
      })
      const data = await response.json()

      if (data.success) {
        setPromos(promos.map(p => p._id === promo._id ? { ...p, isActive: data.data.isActive } : p))
      } else {
        alert(data.message || 'Failed to update promo code')
      }
    } catch (err) {
      console.error('Error toggling promo code:', err)
      alert('Failed to update promo code')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (promo) => {
    if (!confirm(`Delete promo code "${promo.code}"? This cannot be undone.`)) return

    try {
      const token = localStorage.getItem('glowHavenToken')
      const response = await fetch(`${API_URL}/promo-codes/${promo._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (data.success) {
        setPromos(promos.filter(p => p._id !== promo._id))
      } else {
        alert(data.message || 'Failed to delete promo code')
      }
    } catch (err) {
      console.error('Error deleting promo code:', err)
      alert('Failed to delete promo code')
    }
  }

  const isExpired = (promo) => promo.expiresAt && new Date(promo.expiresAt) < new Date()
  const isScheduled = (promo) => promo.startsAt && new Date(promo.startsAt) > new Date()
  const isLimitReached = (promo) =>
    promo.maxRedemptions !== null && promo.maxRedemptions !== undefined &&
    promo.redemptionCount >= promo.maxRedemptions

  const getStatus = (promo) => {
    if (!promo.isActive) return { label: 'Paused', className: 'bg-red-100 text-red-700' }
    if (isExpired(promo)) return { label: 'Expired', className: 'bg-gray-100 text-gray-600' }
    if (isScheduled(promo)) return { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' }
    if (isLimitReached(promo)) return { label: 'Used Up', className: 'bg-orange-100 text-orange-700' }
    return { label: 'Active', className: 'bg-green-100 text-green-700' }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredPromos = normalizedQuery
    ? promos.filter(promo =>
        String(promo.code || '').toLowerCase().includes(normalizedQuery) ||
        String(promo.description || '').toLowerCase().includes(normalizedQuery) ||
        (promo.categories || []).some(c => String(c).toLowerCase().includes(normalizedQuery))
      )
    : promos

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-stack-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary-container rounded w-1/4"></div>
          <div className="h-20 bg-secondary-container rounded"></div>
          <div className="h-20 bg-secondary-container rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-stack-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-playfair text-headline-md">Promo Codes</h1>
          <p className="text-on-surface-variant">Create, pause, and delete discount codes - each customer can use a code once</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create Promo Code
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or description"
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-full pl-12 pr-10 py-3 text-body-md outline-none focus:border-primary transition-colors"
            aria-label="Search promo codes"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_40px_rgba(244,194,194,0.15)] overflow-hidden">
        <div className="overflow-x-auto">
          {filteredPromos.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-outline mb-4 block">
                local_offer
              </span>
              <p className="text-on-surface-variant">
                {normalizedQuery ? `No promo codes match "${searchQuery.trim()}"` : 'No promo codes yet'}
              </p>
              {!normalizedQuery && (
                <button
                  onClick={openCreate}
                  className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors"
                >
                  Create Your First Promo Code
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">CODE</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">DISCOUNT</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">CATEGORIES</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">MIN ORDER</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">VALIDITY</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">USAGE</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline">STATUS</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredPromos.map((promo) => {
                  const status = getStatus(promo)
                  return (
                    <tr key={promo._id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-primary">{promo.code}</span>
                        {promo.description && (
                          <p className="text-xs text-on-surface-variant mt-1">{promo.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        {promo.type === 'percent' ? `${promo.value}% OFF` : `₹${Number(promo.value).toFixed(2)} OFF`}
                        {promo.maxDiscount !== null && promo.maxDiscount !== undefined && promo.type === 'percent' && (
                          <span className="block text-xs text-on-surface-variant font-normal">
                            up to ₹{Number(promo.maxDiscount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {promo.categories && promo.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {promo.categories.map(cat => (
                              <span
                                key={cat}
                                className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-primary">All categories</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {promo.minOrderValue > 0 ? `₹${Number(promo.minOrderValue).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">
                        {promo.startsAt && <div>From {new Date(promo.startsAt).toLocaleDateString('en-IN')}</div>}
                        <div>{promo.expiresAt ? `Till ${new Date(promo.expiresAt).toLocaleDateString('en-IN')}` : 'No expiry'}</div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">
                        <span className="font-semibold text-on-surface">{promo.redemptionCount || 0}</span>
                        {promo.maxRedemptions !== null && promo.maxRedemptions !== undefined
                          ? ` / ${promo.maxRedemptions}`
                          : ' uses'}
                        <span className="block text-xs text-outline">1 per customer</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggle(promo)}
                            disabled={togglingId === promo._id}
                            className="p-2 hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50"
                            title={promo.isActive ? 'Pause Promo Code' : 'Resume Promo Code'}
                          >
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">
                              {promo.isActive ? 'pause' : 'play_arrow'}
                            </span>
                          </button>
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-2 hover:bg-surface-container rounded-lg transition-colors"
                            title="Edit Promo Code"
                          >
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(promo)}
                            className="p-2 hover:bg-error-container rounded-lg transition-colors"
                            title="Delete Promo Code"
                          >
                            <span className="material-symbols-outlined text-sm text-error">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-playfair text-headline-sm">
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-full hover:bg-surface-container" title="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Code *</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="WELCOME10"
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors uppercase"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="10% off for new customers"
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                  Applies to Categories <span className="text-outline">(optional)</span>
                </label>
                <p className="text-xs text-on-surface-variant mb-2">
                  Pick one or more categories. Leave all unselected to apply to the whole store.
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => {
                    const selected = form.categories.includes(category)
                    return (
                      <button
                        type="button"
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          selected
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:border-primary'
                        }`}
                      >
                        {selected && '✓ '}{category}
                      </button>
                    )
                  })}
                  {availableCategories.length === 0 && (
                    <span className="text-xs text-outline">No product categories found</span>
                  )}
                </div>
                <p className="text-xs mt-2 text-on-surface-variant">
                  {form.categories.length > 0
                    ? `Applies to: ${form.categories.join(', ')}`
                    : 'Applies to: all categories (storewide)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Type *</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                    Value * {form.type === 'percent' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    name="value"
                    min="0"
                    max={form.type === 'percent' ? '100' : undefined}
                    value={form.value}
                    onChange={handleChange}
                    placeholder={form.type === 'percent' ? '10' : '200'}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    min="0"
                    value={form.minOrderValue}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    min="0"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    placeholder="No limit"
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startsAt"
                    value={form.startsAt}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={form.expiresAt}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">
                  Total Uses Allowed (blank = unlimited)
                </label>
                <input
                  type="number"
                  name="maxRedemptions"
                  min="1"
                  value={form.maxRedemptions}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary py-2 outline-none transition-colors"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-body-md">Active (customers can use this code)</span>
              </label>

              <p className="text-xs text-on-surface-variant">
                Each customer can redeem this code only once.
              </p>
            </div>

            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="px-6 py-2 rounded-full font-label-caps text-label-caps bg-surface-container text-on-surface hover:bg-secondary-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingPromo ? 'Save Changes' : 'Create Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPromoCodes
