import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCalendar,
  IconCircleCheck,
  IconClock,
  IconVideo,
} from '@tabler/icons-react'
import { api, type PublicEventPage, type Slot } from '../api'

const pad = (n: number) => String(n).padStart(2, '0')

// Мок Prism отдаёт пустую карту слотов — синтезируем демо-слоты 09:00–17:00.
function synthSlots(dateStr: string, step: number): Slot[] {
  const out: Slot[] = []
  for (let m = 9 * 60; m + step <= 17 * 60; m += step) {
    const start = new Date(`${dateStr}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`)
    const end = new Date(start.getTime() + step * 60000)
    out.push({ start: start.toISOString(), end: end.toISOString() })
  }
  return out
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PublicPage() {
  const { username = '', slug = '' } = useParams()
  const [page, setPage] = useState<PublicEventPage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [picked, setPicked] = useState<Slot | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [done, setDone] = useState<Slot | null>(null)

  useEffect(() => {
    api
      .publicEventPage(username, slug)
      .then(setPage)
      .catch((e) => setError(String(e)))
  }, [username, slug])

  const et = page?.eventType

  const loadSlots = async () => {
    if (!et) return
    setLoadingSlots(true)
    setPicked(null)
    try {
      const r = await api.slots(et.id, dateStr, dateStr)
      let all = Object.values(r.slots ?? {}).flat()
      if (all.length === 0) {
        const raw = et.lengthInMinutes
        const step = raw > 0 && raw <= 240 ? raw : 30
        all = synthSlots(dateStr, step)
      }
      setSlots(all)
    } finally {
      setLoadingSlots(false)
    }
  }

  const book = async () => {
    if (!et || !picked) return
    setBooking(true)
    try {
      await api.createBooking({
        start: picked.start,
        eventTypeId: et.id,
        attendee: {
          name,
          email,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      setDone(picked)
    } finally {
      setBooking(false)
    }
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          Не удалось загрузить страницу: {error}
        </Alert>
      </Container>
    )
  }

  if (!page || !et) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  const location = et.locations?.[0]

  return (
    <Box bg="var(--mantine-color-gray-0)" mih="100vh" py={{ base: 'md', sm: 'xl' }}>
      <Container size={520}>
        <Stack gap="lg">
          <Group gap="sm">
            <Avatar color="blue" radius="xl">
              {initials(page.user.name)}
            </Avatar>
            <div>
              <Text fw={600}>{page.user.name}</Text>
              <Text size="xs" c="dimmed">
                @{page.user.username} · {page.user.timeZone}
              </Text>
            </div>
          </Group>

          <Card withBorder radius="lg" padding="xl" shadow="sm">
            {done ? (
              <Stack align="center" gap="sm" py="md">
                <ThemeIcon color="green" size={56} radius="xl" variant="light">
                  <IconCircleCheck size={34} />
                </ThemeIcon>
                <Title order={3}>Вы записаны!</Title>
                <Text ta="center" c="dimmed">
                  {et.title} · {new Date(done.start).toLocaleString('ru-RU')}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Подтверждение отправлено на {email}
                </Text>
                <Button
                  variant="light"
                  mt="sm"
                  onClick={() => {
                    setDone(null)
                    setPicked(null)
                    setName('')
                    setEmail('')
                  }}
                >
                  Записаться ещё раз
                </Button>
              </Stack>
            ) : (
              <Stack>
                <div>
                  <Title order={3}>{et.title}</Title>
                  <Group gap="xs" mt={6}>
                    <Badge
                      variant="light"
                      leftSection={<IconClock size={12} />}
                    >
                      {et.lengthInMinutes} мин
                    </Badge>
                    {location?.type === 'video' && (
                      <Badge
                        variant="light"
                        color="grape"
                        leftSection={<IconVideo size={12} />}
                      >
                        {location.integration}
                      </Badge>
                    )}
                  </Group>
                </div>

                {et.description && (
                  <Text size="sm" c="dimmed">
                    {et.description}
                  </Text>
                )}

                <Divider />

                <Group grow align="flex-end">
                  <TextInput
                    type="date"
                    label="Выберите день"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.currentTarget.value)}
                    leftSection={<IconCalendar size={16} />}
                  />
                  <Button onClick={loadSlots} variant="light">
                    Показать время
                  </Button>
                </Group>

                {loadingSlots ? (
                  <Center h={80}>
                    <Loader size="sm" />
                  </Center>
                ) : (
                  slots.length > 0 && (
                    <SimpleGrid cols={{ base: 3, xs: 4 }}>
                      {slots.map((s, i) => (
                        <Button
                          key={i}
                          size="sm"
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
                  )
                )}

                {picked && (
                  <>
                    <Divider label="Ваши данные" />
                    <TextInput
                      label="Имя"
                      placeholder="Как к вам обращаться"
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      required
                    />
                    <TextInput
                      label="Email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                      required
                    />
                    <Button
                      onClick={book}
                      loading={booking}
                      disabled={!name || !email}
                    >
                      Записаться на{' '}
                      {new Date(picked.start).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Button>
                  </>
                )}
              </Stack>
            )}
          </Card>

          <Text ta="center" size="xs" c="dimmed">
            Работает на{' '}
            <Anchor href="/" size="xs">
              Scheduling
            </Anchor>
          </Text>
        </Stack>
      </Container>
    </Box>
  )
}
