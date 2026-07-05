import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCalendar, IconClock } from '@tabler/icons-react'
import { api, ApiError, type EventType, type Slot } from '../api'

export default function PublicBooking() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [etId, setEtId] = useState<string | null>(null)
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [picked, setPicked] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    api.eventTypes().then((r) => {
      setEventTypes(r.items ?? [])
      if (r.items?.[0]) setEtId(r.items[0].id)
    })
  }, [])

  const selectedEt = eventTypes.find((e) => e.id === etId)

  const loadSlots = async () => {
    if (!etId) return
    setLoadingSlots(true)
    setPicked(null)
    try {
      const r = await api.slots(etId, dateStr, dateStr)
      setSlots(Object.values(r.slots ?? {}).flat())
      setLoaded(true)
    } catch (e) {
      notifications.show({ color: 'red', message: 'Не удалось получить слоты: ' + e })
    } finally {
      setLoadingSlots(false)
    }
  }

  const book = async () => {
    if (!etId || !picked) return
    setBooking(true)
    try {
      await api.createBooking({
        start: picked.start,
        eventTypeId: etId,
        attendee: {
          name,
          email,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      notifications.show({
        color: 'green',
        title: 'Готово',
        message: `Встреча забронирована на ${new Date(picked.start).toLocaleString('ru-RU')}`,
      })
      setPicked(null)
      setName('')
      setEmail('')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        notifications.show({
          color: 'orange',
          message: 'Этот слот уже недоступен — выберите другое время.',
        })
        await loadSlots()
      } else {
        notifications.show({ color: 'red', message: 'Ошибка бронирования: ' + e })
      }
    } finally {
      setBooking(false)
    }
  }

  return (
    <Stack maw={720}>
      <Title order={2}>Страница бронирования</Title>
      <Text c="dimmed" size="sm">
        Так это видит гость по вашей ссылке: выбирает слот и бронирует встречу.
      </Text>

      <Card withBorder radius="md" padding="lg">
        <Stack>
          <Group grow align="flex-end">
            <Select
              label="Тип встречи"
              data={eventTypes.map((e) => ({
                value: e.id,
                label: `${e.title} (${e.lengthInMinutes} мин)`,
              }))}
              value={etId}
              onChange={setEtId}
              leftSection={<IconClock size={16} />}
            />
            <TextInput
              type="date"
              label="Дата"
              value={dateStr}
              onChange={(e) => setDateStr(e.currentTarget.value)}
              leftSection={<IconCalendar size={16} />}
            />
          </Group>
          <Button onClick={loadSlots} variant="light">
            Показать свободные слоты
          </Button>

          {loadingSlots ? (
            <Center h={80}>
              <Loader size="sm" />
            </Center>
          ) : slots.length > 0 ? (
            <>
              <Divider label="Свободное время" />
              <SimpleGrid cols={{ base: 3, sm: 4 }}>
                {slots.map((s, i) => (
                  <Button
                    key={i}
                    variant={picked === s ? 'filled' : 'default'}
                    onClick={() => setPicked(s)}
                  >
                    {new Date(s.start).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Button>
                ))}
              </SimpleGrid>
            </>
          ) : (
            loaded && (
              <Text c="dimmed" size="sm">
                Нет свободных слотов на эту дату.
              </Text>
            )
          )}

          {picked && (
            <>
              <Divider label="Ваши данные" />
              <Badge variant="light" color="blue" leftSection={<IconClock size={12} />}>
                {selectedEt?.title} · {new Date(picked.start).toLocaleString('ru-RU')}
              </Badge>
              <TextInput
                label="Имя"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              <Button onClick={book} loading={booking} disabled={!name || !email}>
                Забронировать
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
