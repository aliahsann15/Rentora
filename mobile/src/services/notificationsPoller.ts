import { api } from './api'

const BASE_INTERVAL_MS = 20000
const MAX_INTERVAL_MS = 60000

type Subscriber = () => void

let subscribers = new Set<Subscriber>()
let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let isRunning = false
let intervalMs = BASE_INTERVAL_MS
let lastSignature = ''

const scheduleNext = () => {
  if (!isRunning) {
    return
  }

  if (timer) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => {
    void runPoll()
  }, intervalMs)
}

const runPoll = async () => {
  if (!isRunning) {
    return
  }

  if (inFlight) {
    scheduleNext()
    return
  }

  inFlight = true
  try {
    const response = await api.get<Array<{ _id?: string }>>('/notifications', {
      params: { isRead: false }
    })

    const data = response.data || []
    const signature = data.length > 0 ? `${data[0]?._id || ''}:${data.length}` : '0'

    if (signature !== lastSignature) {
      lastSignature = signature
      subscribers.forEach((callback) => callback())
    }

    intervalMs = BASE_INTERVAL_MS
  } catch (error: unknown) {
    const statusCode = (error as { response?: { status?: number } })?.response?.status
    if (statusCode === 429) {
      intervalMs = Math.min(MAX_INTERVAL_MS, intervalMs * 2)
    }
  } finally {
    inFlight = false
    scheduleNext()
  }
}

export const startNotificationsPoller = () => {
  if (isRunning) {
    return
  }

  isRunning = true
  intervalMs = BASE_INTERVAL_MS
  void runPoll()
}

export const stopNotificationsPoller = () => {
  isRunning = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  inFlight = false
  lastSignature = ''
}

export const subscribeNotifications = (callback: Subscriber) => {
  subscribers.add(callback)

  return () => {
    subscribers.delete(callback)
  }
}
