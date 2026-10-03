import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/database'
import ProductCard from '../components/products/ProductCard'

const OFFER_THRESHOLD = 20

const getOfferPercent = (product) => {
  const mrp = product?.mrp
  const price = product?.price
  if (!mrp || mrp <= 0 || !price) return 0
  return ((mrp - price) / mrp) * 100
}

const OfferPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.getProducts({ minDiscount: OFFER_THRESHOLD, limit: 100 })
        const productArray = Array.isArray(data) ? data : []
        setProducts(productArray.filter(product => getOfferPercent(product) >= OFFER_THRESHOLD))
      } catch (err) {
        console.error('Error loading offers:', err)
        setError('Failed to load offers. Please try again.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadOffers()
  }, [])

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-stack-xl">
      {/* Offer Banner */}
      <div className="bg-gradient-to-r from-[#7b5455] to-[#7b5455]/80 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden mb-10">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-label-caps text-label-caps tracking-[0.3em] text-white/80 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-white/80"></span>
              LIMITED TIME OFFER
            </span>
            <h1 className="font-playfair text-[32px] md:text-headline-md mt-3">
              Get 20% off on all best sellers.
            </h1>
            <p className="text-white/90 mt-2">
              Enjoy minimum 20% off between MRP and selling price on selected products.
            </p>
          </div>
          <Link
            to="/shop"
            className="bg-white text-[#7b5455] px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-[#1c1b1b] hover:text-white transition-all duration-300 shadow-lg whitespace-nowrap"
          >
            Shop All
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter mb-8">
        <div>
          <h2 className="font-playfair text-display-lg-mobile md:text-headline-md text-on-surface">
            20% Off &amp; Above
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Products with a minimum {OFFER_THRESHOLD}% discount on MRP.
          </p>
        </div>
        <Link to="/shop" className="font-label-caps text-label-caps text-primary border-b border-primary pb-1 self-start md:self-auto">
          View All →
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {Array.from({ length: 8 }, (_, i) => i).map((index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="aspect-square bg-secondary-container rounded-2xl"></div>
              <div className="h-4 bg-secondary-container rounded mt-4 w-3/4"></div>
              <div className="h-4 bg-secondary-container rounded mt-2 w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-error mb-4 block">error</span>
          <p className="text-on-surface-variant text-body-lg">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">sell</span>
          <h3 className="font-playfair text-headline-sm mb-2">No offers available right now</h3>
          <p className="text-on-surface-variant text-body-md">
            Check back soon for deals with at least {OFFER_THRESHOLD}% off.
          </p>
          <Link to="/shop" className="inline-block mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors">
            Browse All Products
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <>
          <p className="text-on-surface-variant text-sm mb-4">
            {products.length} product{products.length !== 1 ? 's' : ''} with {OFFER_THRESHOLD}% off or more
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {products.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default OfferPage
