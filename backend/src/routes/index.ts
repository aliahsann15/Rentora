import { Router } from 'express'
import { authRoutes } from './authRoutes'
import { invitesRoutes } from './invitesRoutes'
import { notificationsRoutes } from './notificationsRoutes'
import { organizationsRoutes } from './organizationsRoutes'
import { propertiesRoutes } from './propertiesRoutes'
import { requestsRoutes } from './requestsRoutes'
import { subscriptionsRoutes } from './subscriptionsRoutes'
import { unitsRoutes } from './unitsRoutes'
import { usersRoutes } from './usersRoutes'
import { vendorsRoutes } from './vendorsRoutes'
import { webhooksRoutes } from './webhooksRoutes'

const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', usersRoutes)
apiRouter.use('/organizations', organizationsRoutes)
apiRouter.use('/properties', propertiesRoutes)
apiRouter.use('/units', unitsRoutes)
apiRouter.use('/requests', requestsRoutes)
apiRouter.use('/vendors', vendorsRoutes)
apiRouter.use('/invites', invitesRoutes)
apiRouter.use('/notifications', notificationsRoutes)
apiRouter.use('/subscriptions', subscriptionsRoutes)
apiRouter.use('/webhooks', webhooksRoutes)

export { apiRouter }
