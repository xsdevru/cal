import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { api, type Schedule } from '../api'

export default function Schedules() {
  const [items, setItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .schedules()
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Stack>
      <Title order={2}>Расписания доступности</Title>
      <Text c="dimmed" size="sm">
        Когда вы доступны для встреч. Привязывается к типам встреч.
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
        <Stack>
          {items.map((s, i) => (
            <Card key={i} withBorder radius="md" padding="lg">
              <Group justify="space-between" mb="sm">
                <Group>
                  <Text fw={600}>{s.name}</Text>
                  {s.isDefault && <Badge variant="light">по умолчанию</Badge>}
                </Group>
                <Badge color="gray" variant="outline">
                  {s.timeZone}
                </Badge>
              </Group>
              <Stack gap={4}>
                {s.availability?.map((a, j) => (
                  <Group key={j} gap="xs">
                    <Text size="sm">{a.days?.join(', ')}</Text>
                    <Text size="sm" c="dimmed">
                      {a.startTime}–{a.endTime}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
