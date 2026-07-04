import { AppShell, Badge, Burger, Group, NavLink, ThemeIcon, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconCalendarEvent,
  IconClockHour4,
  IconTicket,
  IconWorld,
} from '@tabler/icons-react'

const links = [
  { to: '/', label: 'Типы встреч', icon: IconCalendarEvent },
  { to: '/schedules', label: 'Расписания', icon: IconClockHour4 },
  { to: '/bookings', label: 'Бронирования', icon: IconTicket },
  { to: '/book', label: 'Превью бронирования', icon: IconWorld },
]

export default function AdminLayout() {
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
          <Badge variant="light" color="gray" size="sm">
            админка
          </Badge>
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
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
