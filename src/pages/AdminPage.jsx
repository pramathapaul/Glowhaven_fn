import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminProducts from '../components/admin/AdminProducts'
import AdminPromoCodes from '../components/admin/AdminPromoCodes'

const AdminPage = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="promos" element={<AdminPromoCodes />} />
    </Routes>
  )
}

export default AdminPage
