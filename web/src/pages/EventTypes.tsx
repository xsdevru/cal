import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Code,
  Group,
  Loader,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconClock, IconPlus } from '@tabler/icons-react'
import { api, type EventType } from '../api'

export default function EventTypes() {
  const [items, setItems] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [minutes, setMinutes] = useState<number | string>(30)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .eventTypes()
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async () => {
    setSaving(true)
    try {
      await api.createEventType({ title, slug, lengthInMinutes: Number(minutes) })
      notifications.show({ color: 'green', message: 'Тип встречи создан' })
      close()
      setTitle('')
      setSlug('')
      setMinutes(30)
      load()
    } catch (e) {
      notifications.show({ color: 'red', message: 'Ошибка: ' + e })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Типы встреч</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Создать
        </Button>
      </Group>
      <Text c="dimmed" size="sm">
        То, чем вы делитесь по ссылке. Гость открывает{' '}
        <Code>/{'{username}'}/{'{slug}'}</Code> и бронирует встречу.
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
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {items.map((et, i) => (
            <Card key={i} withBorder radius="md" padding="lg">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>{et.title}</Text>
                {et.hidden && (
                  <Badge color="gray" variant="light">
                    скрыт
                  </Badge>
                )}
              </Group>
              <Group gap={6} mb="sm">
                <IconClock size={14} />
                <Text size="sm" c="dimmed">
                  {et.lengthInMinutes} мин
                </Text>
              </Group>
              {et.description && (
                <Text size="sm" mb="sm">
                  {et.description}
                </Text>
              )}
              <Code>/{'{username}'}/{et.slug}</Code>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title="Новый тип встречи" centered>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Созвон 30 минут"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Slug (для ссылки)"
            placeholder="30min"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            required
          />
          <NumberInput
            label="Длительность, мин"
            value={minutes}
            onChange={setMinutes}
            min={5}
            step={5}
          />
          <Button onClick={submit} loading={saving}>
            Создать
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
