import cron from 'node-cron'
import { MaintenanceRequest, Notification, Organization, Vendor } from '../models'

const logJob = (jobName: string, message: string): void => {
  console.log(`[jobs:${jobName}] ${message}`)
}

const enforceSubscriptionExpiry = async (): Promise<void> => {
  const now = new Date()
  const result = await Organization.updateMany(
    {
      isActive: true,
      trialEndsAt: { $lt: now },
      subscriptionStatus: { $in: ['TRIAL', 'TRIALING'] }
    },
    {
      $set: {
        isActive: false,
        subscriptionStatus: 'EXPIRED'
      }
    }
  )

  logJob('subscription-expiry', `updated ${result.modifiedCount} organization(s)`)
}

const sendReminderNotifications = async (): Promise<void> => {
  const thresholdHours = Number(process.env.REQUEST_REMINDER_HOURS || 24)
  const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000)

  const staleRequests = await MaintenanceRequest.find({
    status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    updatedAt: { $lte: threshold }
  }).limit(200)

  if (!staleRequests.length) {
    logJob('reminder-notifications', 'no stale requests')
    return
  }

  const vendorIds = staleRequests
    .map((request) => request.vendorId?.toString())
    .filter((vendorId): vendorId is string => Boolean(vendorId))

  const vendors = await Vendor.find({ _id: { $in: vendorIds } })
  const vendorUserIdMap = new Map(vendors.map((vendor) => [vendor._id.toString(), vendor.userId.toString()]))

  let created = 0
  for (const request of staleRequests) {
    const recipients = [request.tenantId.toString()]
    if (request.vendorId) {
      const vendorUserId = vendorUserIdMap.get(request.vendorId.toString())
      if (vendorUserId) {
        recipients.push(vendorUserId)
      }
    }

    for (const userId of recipients) {
      const existing = await Notification.findOne({
        userId,
        organizationId: request.organizationId,
        type: 'REQUEST_REMINDER',
        referenceId: request._id.toString(),
        isRead: false
      })

      if (existing) {
        continue
      }

      await Notification.create({
        userId,
        organizationId: request.organizationId,
        title: 'Maintenance request reminder',
        body: `${request.title} is awaiting action.`,
        type: 'REQUEST_REMINDER',
        referenceId: request._id.toString(),
        isRead: false
      })

      created += 1
    }
  }

  logJob('reminder-notifications', `created ${created} notification(s)`)
}

const autoCloseStaleRequests = async (): Promise<void> => {
  const staleDays = Number(process.env.REQUEST_AUTO_CLOSE_DAYS || 14)
  const threshold = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000)

  const result = await MaintenanceRequest.updateMany(
    {
      status: 'IN_PROGRESS',
      updatedAt: { $lte: threshold }
    },
    {
      $set: {
        status: 'DONE',
        completedAt: new Date()
      }
    }
  )

  logJob('auto-close-stale', `closed ${result.modifiedCount} request(s)`)
}

export const startBackgroundJobs = (): void => {
  cron.schedule('0 * * * *', async () => {
    try {
      await sendReminderNotifications()
    } catch (error) {
      console.error('[jobs:reminder-notifications] failed', error)
    }
  })

  cron.schedule('0 0 * * *', async () => {
    try {
      await enforceSubscriptionExpiry()
    } catch (error) {
      console.error('[jobs:subscription-expiry] failed', error)
    }
  })

  cron.schedule('15 0 * * *', async () => {
    try {
      await autoCloseStaleRequests()
    } catch (error) {
      console.error('[jobs:auto-close-stale] failed', error)
    }
  })

  logJob('scheduler', 'background jobs started')
}
