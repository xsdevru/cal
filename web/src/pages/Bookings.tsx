import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Center,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { api, type Booking } from '../api'

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

  useEffect(() => {
    api
      .bookings()
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

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
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  )
}
