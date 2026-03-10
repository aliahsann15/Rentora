import { Server } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken } from '../utils/auth'

type ClientInfo = {
  socket: WebSocket
  userId: string
  organizationId: string | null
}

type NotificationUpdatePayload = {
  userIds: string[]
  organizationId: string
  type: string
  referenceId?: string
}

let wss: WebSocketServer | null = null
const clients = new Set<ClientInfo>()
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

const cleanupSocket = (client: ClientInfo) => {
  clients.delete(client)
}

const scheduleHeartbeat = () => {
  if (heartbeatTimer) {
    return
  }

  heartbeatTimer = setInterval(() => {
    clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.ping()
        return
      }

      cleanupSocket(client)
    })
  }, 30000)
}

export const initNotificationsGateway = (server: Server) => {
  if (wss) {
    return
  }

  wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || ''
    if (!url.startsWith('/ws/notifications')) {
      socket.destroy()
      return
    }

    wss?.handleUpgrade(request, socket, head, (ws) => {
      wss?.emit('connection', ws, request)
    })
  })

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url || '', 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      socket.close(1008, 'Missing token')
      return
    }

    let payload: { userId?: string; organizationId?: string }

    try {
      payload = verifyToken(token)
    } catch (error) {
      socket.close(1008, 'Invalid token')
      return
    }

    if (!payload.userId) {
      socket.close(1008, 'Invalid token payload')
      return
    }

    const client: ClientInfo = {
      socket,
      userId: payload.userId,
      organizationId: payload.organizationId || null
    }

    clients.add(client)
    scheduleHeartbeat()

    socket.on('close', () => {
      cleanupSocket(client)
    })
  })
}

export const broadcastNotificationUpdate = (payload: NotificationUpdatePayload) => {
  if (!wss) {
    return
  }

  const message = JSON.stringify({
    type: 'notifications:updated',
    organizationId: payload.organizationId,
    userIds: payload.userIds,
    referenceId: payload.referenceId,
    notificationType: payload.type
  })

  clients.forEach((client) => {
    if (!client.organizationId || client.organizationId !== payload.organizationId) {
      return
    }

    if (!payload.userIds.includes(client.userId)) {
      return
    }

    if (client.socket.readyState !== WebSocket.OPEN) {
      cleanupSocket(client)
      return
    }

    client.socket.send(message)
  })
}
