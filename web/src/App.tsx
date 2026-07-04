import { AppShell, Burger, Group, NavLink, ThemeIcon, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  IconCalendarEvent,
  IconClockHour4,
  IconTicket,
  IconWorld,
} from '@tabler/icons-react'

import EventTypes from './pages/EventTypes'
import Schedules from './pages/Schedules'
import Bookings from './pages/Bookings'
import PublicBooking from './pages/PublicBooking'

const links = [
  { to: '/', label: 'Типы встреч', icon: IconCalendarEvent },
  { to: '/schedules', label: 'Расписания', icon: IconClockHour4 },
  { to: '/bookings', label: 'Бронирования', icon: IconTicket },
  { to: '/book', label: 'Страница бронирования', icon: IconWorld },
]

export default function App() {
  const [opened, { toggle }] = useDisclosure()
  const location = useLocation()

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <ThemeIcon variant="light" size="md" radius="md">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <Title order={4}>Scheduling</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {links.map((l) => (
          <NavLink
            key={l.to}
            component={RouterNavLink}
            to={l.to}
            end
            label={l.label}
            leftSection={<l.icon size={18} />}
            active={location.pathname === l.to}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<EventTypes />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/book" element={<PublicBooking />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}
