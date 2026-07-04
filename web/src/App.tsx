import { Route, Routes } from 'react-router-dom'

import AdminLayout from './layouts/AdminLayout'
import EventTypes from './pages/EventTypes'
import Schedules from './pages/Schedules'
import Bookings from './pages/Bookings'
import PublicBooking from './pages/PublicBooking'
import PublicPage from './pages/PublicPage'

export default function App() {
  return (
    <Routes>
      {/* Публичная страница записи по ссылке /{username}/{slug} — без админ-меню */}
      <Route path="/:username/:slug" element={<PublicPage />} />

      {/* Админка владельца */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<EventTypes />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/book" element={<PublicBooking />} />
      </Route>
    </Routes>
  )
}
