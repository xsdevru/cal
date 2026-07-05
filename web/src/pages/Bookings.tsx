import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react'
import { api, ApiError, type Booking } from '../api'

const statusColor: Record<string, string> = {
  accepted: 'green',
  pending: 'yellow',
  cancelled: 'gray',
  rejected: 'red',
}

export default function Bookings() {
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    api
      .bookings()
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Подтвердить/отклонить ожидающую бронь (владелец).
  const resolve = async (uid: string, action: 'accept' | 'reject') => {
    setActing(uid)
    try {
      await (action === 'accept' ? api.acceptBooking(uid) : api.rejectBooking(uid))
      load()
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 409
          ? 'Бронь уже не ожидает подтверждения — обновите список.'
          : 'Не удалось выполнить действие: ' + e
      notifications.show({ color: 'red', message: msg })
    } finally {
      setActing(null)
    }
  }

  return (
    <Stack>
      <Title order={2}>Бронирования</Title>
      <Text c="dimmed" size="sm">
        Встречи, забронированные гостями по вашим ссылкам.
      </Text>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={640}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Встреча</Table.Th>
                <Table.Th>Гость</Table.Th>
                <Table.Th>Начало</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((b, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{b.title}</Table.Td>
                  <Table.Td>
                    {b.attendee?.name}{' '}
                    <Text span c="dimmed" size="xs">
                      {b.attendee?.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>{new Date(b.start).toLocaleString('ru-RU')}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor[b.status] ?? 'blue'} variant="light">
                      {b.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {b.status === 'pending' && (
                      <Group gap="xs" wrap="nowrap">
                        <Button
                          size="compact-sm"
                          color="green"
                          variant="light"
                          loading={acting === b.uid}
                          leftSection={<IconCheck size={14} />}
                          onClick={() => resolve(b.uid, 'accept')}
                        >
                          Принять
                        </Button>
                        <Button
                          size="compact-sm"
                          color="red"
                          variant="light"
                          loading={acting === b.uid}
                          leftSection={<IconX size={14} />}
                          onClick={() => resolve(b.uid, 'reject')}
                        >
                          Отклонить
                        </Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  )
}
