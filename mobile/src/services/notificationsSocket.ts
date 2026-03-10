import { API_BASE_URL } from './api'
import { getAccessToken } from './authStorage'

type Subscriber = () => void

type SocketState = {
  socket: WebSocket | null
  subscribers: Set<Subscriber>
  reconnectTimer: ReturnType<typeof setTimeout> | null
  reconnectDelayMs: number
  isConnecting: boolean
  lastUserId: string | null
}

const state: SocketState = {
  socket: null,
  subscribers: new Set(),
  reconnectTimer: null,
  reconnectDelayMs: 2000,
  isConnecting: false,
  lastUserId: null
}

const toSocketBaseUrl = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, '')
  const withoutApi = normalized.replace(/\/api$/, '')

  if (withoutApi.startsWith('https://')) {
    return withoutApi.replace('https://', 'wss://')
  }

  if (withoutApi.startsWith('http://')) {
    return withoutApi.replace('http://', 'ws://')
  }

  return `ws://${withoutApi}`
}

const notifySubscribers = () => {
  state.subscribers.forEach((callback) => callback())
}

const clearReconnectTimer = () => {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer)
    state.reconnectTimer = null
  }
}

const scheduleReconnect = () => {
  if (state.reconnectTimer || !state.lastUserId) {
    return
  }

  const delay = state.reconnectDelayMs
  state.reconnectDelayMs = Math.min(state.reconnectDelayMs * 2, 15000)

  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null
    void connectNotificationsSocket(state.lastUserId)
  }, delay)
}

const handleMessage = (event: WebSocketMessageEvent) => {
  if (!event?.data || typeof event.data !== 'string') {
    return
  }

  try {
    const payload = JSON.parse(event.data) as { type?: string }
    if (payload.type === 'notifications:updated') {
      notifySubscribers()
    }
  } catch (error) {
    // Ignore malformed payloads.
  }
}

export const connectNotificationsSocket = async (userId: string | null | undefined) => {
  const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0 ? userId : null
  state.lastUserId = normalizedUserId

  if (!normalizedUserId) {
    return
  }

  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    return
  }

  if (state.isConnecting) {
    return
  }

  const token = await getAccessToken()
  if (!token) {
    return
  }

  state.isConnecting = true
  clearReconnectTimer()

  const socketUrl = `${toSocketBaseUrl(API_BASE_URL)}/ws/notifications?token=${encodeURIComponent(token)}`
  const socket = new WebSocket(socketUrl)

  state.socket = socket

  socket.onopen = () => {
    state.isConnecting = false
    state.reconnectDelayMs = 2000
  }

  socket.onmessage = handleMessage

  socket.onerror = () => {
    state.isConnecting = false
  }

  socket.onclose = () => {
    state.isConnecting = false
    state.socket = null
    scheduleReconnect()
  }
}

export const disconnectNotificationsSocket = () => {
  clearReconnectTimer()
  state.isConnecting = false
  state.lastUserId = null

  if (state.socket) {
    state.socket.close()
    state.socket = null
  }
}

export const subscribeNotifications = (callback: Subscriber) => {
  state.subscribers.add(callback)

  return () => {
    state.subscribers.delete(callback)
  }
}
