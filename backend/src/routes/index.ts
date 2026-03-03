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
import { authenticateJWT } from '../middlewares/authenticateJWT'
import { attachOrganization } from '../middlewares/attachOrganization'
import { requireRole } from '../middlewares/requireRole'
import { requireSubscriptionActive } from '../middlewares/requireSubscriptionActive'

const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), usersRoutes)
apiRouter.use('/organizations', authenticateJWT, attachOrganization, organizationsRoutes)
apiRouter.use('/properties', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), propertiesRoutes)
apiRouter.use('/units', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), unitsRoutes)
apiRouter.use('/requests', authenticateJWT, attachOrganization, requireSubscriptionActive, requestsRoutes)
apiRouter.use('/vendors', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), vendorsRoutes)
apiRouter.use('/invites', invitesRoutes)
apiRouter.use('/notifications', authenticateJWT, attachOrganization, requireSubscriptionActive, notificationsRoutes)
apiRouter.use('/subscriptions', authenticateJWT, attachOrganization, subscriptionsRoutes)

export { apiRouter }
