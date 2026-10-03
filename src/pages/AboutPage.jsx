import React from 'react'
import { Link } from 'react-router-dom'

const PHONE_DISPLAY = '+91 8910434478'
const PHONE_HREF = 'tel:+918910434478'

const locations = [
  'Purbachal, East Udayrajpur',
  'Madhyamgram, Kolkata',
  'North 24 Parganas, West Bengal, 700129'
]

const values = [
  { icon: 'eco', label: 'Vegan Formula' },
  { icon: 'science', label: 'Clinically Tested' },
  { icon: 'favorite', label: 'Cruelty Free' },
  { icon: 'inventory_2', label: 'Sustainable Packaging' }
]

const AboutPage = () => {
  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-stack-xl">
      {/* Header */}
      <div className="mb-10">
        <span className="font-label-caps text-label-caps text-primary tracking-[0.3em]">OUR STORY</span>
        <h1 className="font-playfair text-display-lg-mobile md:text-headline-md text-on-surface mt-3">
          About Glow Haven
        </h1>
        <p className="text-body-lg text-on-surface-variant mt-3 max-w-3xl">
          Curating a world of luminous beauty and holistic wellness. Empowering you to glow from within.
        </p>
      </div>

      {/* Philosophy */}
      <div className="bg-surface-container-lowest p-6 md:p-10 rounded-2xl shadow-[0_10px_40px_rgba(244,194,194,0.15)] mb-8">
        <span className="font-label-caps text-label-caps text-primary tracking-[0.3em]">OUR PHILOSOPHY</span>
        <h2 className="font-playfair text-headline-sm md:text-headline-md text-on-surface mt-3 mb-4">
          The Science of Subtle Sophistication.
        </h2>
        <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
          We believe that beauty isn't about masking, but revealing. Glow Haven was born from a desire to create a
          skincare-first makeup line that treats your skin while providing that "lit-from-within" finish that defines
          modern luxury.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {values.map((value) => (
            <div key={value.label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {value.icon}
                </span>
              </div>
              <span className="font-label-caps text-label-caps">{value.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Locations & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-8">
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_10px_40px_rgba(244,194,194,0.15)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">location_on</span>
            <h2 className="font-playfair text-headline-sm">Locations</h2>
          </div>
          <div className="space-y-3">
            {locations.map((location) => (
              <p key={location} className="text-body-md text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">pin_drop</span>
                {location}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_10px_40px_rgba(244,194,194,0.15)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">call</span>
            <h2 className="font-playfair text-headline-sm">Contact Details</h2>
          </div>
          <div className="space-y-4">
            <a
              href={PHONE_HREF}
              className="flex items-center gap-3 text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">phone</span>
              {PHONE_DISPLAY}
            </a>
            <div className="flex items-start gap-3 text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              <span>{locations[2]}</span>
            </div>
            <div className="flex items-start gap-3 text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">support_agent</span>
              <span>Customer care, order support &amp; feedback</span>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <span className="material-symbols-outlined text-on-surface-variant" title="Website">public</span>
              <span className="material-symbols-outlined text-on-surface-variant" title="Instagram">camera</span>
              <span className="material-symbols-outlined text-on-surface-variant" title="Facebook">brand_awareness</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reseller - important */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#7b5455] to-[#7b5455]/80 rounded-2xl p-8 md:p-12 text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="font-label-caps text-label-caps tracking-[0.3em] text-white/80 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-white/80"></span>
              IMPORTANT
            </span>
            <h2 className="font-playfair text-[32px] mt-3">Reseller &amp; Wholesale Enquiries</h2>
            <p className="text-white/90 mt-2">
              Want to sell Glow Haven products? We partner with resellers and wholesalers across India.
              Contact us at <span className="font-semibold">{PHONE_DISPLAY}</span> for pricing, minimum
              order quantities and dealership details.
            </p>
          </div>
          <a
            href={PHONE_HREF}
            className="bg-white text-[#7b5455] px-8 py-4 rounded-full font-label-caps text-label-caps hover:bg-[#1c1b1b] hover:text-white transition-all duration-300 shadow-lg whitespace-nowrap flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/shop"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-on-background transition-colors"
        >
          Explore Our Products
        </Link>
      </div>
    </div>
  )
}

export default AboutPage
