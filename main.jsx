import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BookingPage from './pages/BookingPage'
import OwnerDashboard from './pages/OwnerDashboard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/owner-dashboard-secret" element={<OwnerDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
