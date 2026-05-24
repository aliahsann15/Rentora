const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const {
  ActivityLog,
  FcmToken,
  Invite,
  MaintenanceRequest,
  Notification,
  Organization,
  Property,
  RefreshToken,
  Unit,
  User,
  Vendor
} = require('../dist/models')

const mongoUri = process.env.MONGO_URI

if (!mongoUri) {
  throw new Error('MONGO_URI is required')
}

const demo = {
  organizationName: 'Rentora Demo Property Group',
  landlord: {
    name: 'Avery Brooks',
    email: 'landlord.demo@rentora.com',
    password: 'Landlord123!',
    phone: '+1 415-555-0101',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Avery%20Brooks'
  },
  tenant: {
    name: 'Jordan Lee',
    email: 'tenant@rentora.com',
    password: 'Tenant123!',
    phone: '+1 415-555-0102',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Jordan%20Lee'
  },
  vendor: {
    name: 'Morgan Patel',
    email: 'vendor@rentora.com',
    password: 'Vendor123!',
    phone: '+1 415-555-0103',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Morgan%20Patel',
    services: ['Plumbing', 'Electrical', 'Appliance Repair']
  },
  property: {
    name: 'Maple Court Apartments',
    address: {
      line1: '2400 Maple Court',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      zip: '78701'
    }
  },
  units: [
    {
      unitNumber: '2B',
      status: 'OCCUPIED',
      rentAmount: 2100,
      leaseStart: '2026-01-01T00:00:00.000Z',
      leaseEnd: '2026-12-31T23:59:59.000Z'
    },
    {
      unitNumber: '2A',
      status: 'VACANT',
      rentAmount: 1980,
      leaseStart: '2026-02-01T00:00:00.000Z',
      leaseEnd: '2026-12-31T23:59:59.000Z'
    }
  ],
  requests: [
    {
      title: 'Kitchen sink leak',
      description:
        'The kitchen sink has been dripping steadily under the cabinet and the tenant can hear water running after every use.',
      status: 'DONE',
      urgency: 'HIGH',
      images: [
        'https://picsum.photos/seed/rentora-kitchen-leak-1/1200/800',
        'https://picsum.photos/seed/rentora-kitchen-leak-2/1200/800'
      ]
    },
    {
      title: 'Bedroom AC not cooling',
      description:
        'The bedroom unit is running but the room temperature is not dropping below 80 degrees.',
      status: 'IN_PROGRESS',
      urgency: 'MEDIUM',
      images: ['https://picsum.photos/seed/rentora-ac-1/1200/800']
    },
    {
      title: 'Hallway light flicker',
      description:
        'The hallway light outside the tenant unit flickers intermittently and may need a bulb or ballast replacement.',
      status: 'ASSIGNED',
      urgency: 'LOW',
      images: ['https://picsum.photos/seed/rentora-light-1/1200/800']
    }
  ]
}

const connectDatabase = async () => {
  await mongoose.connect(mongoUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
    autoIndex: true
  })
}

const safeDeleteMany = async (model, filter) => {
  await model.deleteMany(filter)
}

const cleanupDemoData = async () => {
  const demoUsers = await User.find({
    email: { $in: [demo.landlord.email, demo.tenant.email, demo.vendor.email] }
  }).select('_id organizationId')

  const organizationByName = await Organization.findOne({ name: demo.organizationName }).select('_id')

  const organizationIds = [
    ...new Set(
      [
        ...demoUsers.map((user) => user.organizationId && user.organizationId.toString()).filter(Boolean),
        organizationByName ? organizationByName._id.toString() : undefined
      ].filter(Boolean)
    )
  ]

  const userIds = demoUsers.map((user) => user._id.toString())

  if (organizationIds.length > 0) {
    await Promise.all([
      safeDeleteMany(MaintenanceRequest, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Unit, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Property, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Vendor, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Invite, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Notification, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(ActivityLog, { organizationId: { $in: organizationIds } }),
      safeDeleteMany(Organization, { _id: { $in: organizationIds } })
    ])
  }

  if (userIds.length > 0) {
    await Promise.all([
      safeDeleteMany(RefreshToken, { userId: { $in: userIds } }),
      safeDeleteMany(FcmToken, { userId: { $in: userIds } }),
      safeDeleteMany(Notification, { userId: { $in: userIds } }),
      safeDeleteMany(User, { _id: { $in: userIds } })
    ])
  }
}

const createSeedData = async () => {
  const [landlordPasswordHash, tenantPasswordHash, vendorPasswordHash] = await Promise.all([
    bcrypt.hash(demo.landlord.password, 12),
    bcrypt.hash(demo.tenant.password, 12),
    bcrypt.hash(demo.vendor.password, 12)
  ])

  const landlord = await User.create({
    name: demo.landlord.name,
    email: demo.landlord.email,
    passwordHash: landlordPasswordHash,
    role: 'LANDLORD',
    phone: demo.landlord.phone,
    avatar: demo.landlord.avatar,
    pushTokens: [],
    isActive: true
  })

  const organization = await Organization.create({
    name: demo.organizationName,
    companyAddress: '2400 Maple Court, Austin, TX 78701',
    ownerId: landlord._id,
    subscriptionStatus: 'TRIALING',
    planType: 'TRIAL',
    unitLimit: 20,
    trialEndsAt: new Date('2026-06-07T23:59:59.000Z'),
    isActive: true
  })

  landlord.organizationId = organization._id
  await landlord.save()

  const tenant = await User.create({
    name: demo.tenant.name,
    email: demo.tenant.email,
    passwordHash: tenantPasswordHash,
    role: 'TENANT',
    organizationId: organization._id,
    phone: demo.tenant.phone,
    avatar: demo.tenant.avatar,
    pushTokens: [],
    isActive: true
  })

  const vendorUser = await User.create({
    name: demo.vendor.name,
    email: demo.vendor.email,
    passwordHash: vendorPasswordHash,
    role: 'VENDOR',
    organizationId: organization._id,
    phone: demo.vendor.phone,
    avatar: demo.vendor.avatar,
    pushTokens: [],
    isActive: true
  })

  const property = await Property.create({
    organizationId: organization._id,
    name: demo.property.name,
    address: demo.property.address,
    totalUnits: demo.units.length
  })

  const occupiedLeaseStart = new Date(demo.units[0].leaseStart)
  const occupiedLeaseEnd = new Date(demo.units[0].leaseEnd)
  const vacantLeaseStart = new Date(demo.units[1].leaseStart)
  const vacantLeaseEnd = new Date(demo.units[1].leaseEnd)

  const [occupiedUnit, vacantUnit] = await Unit.create([
    {
      organizationId: organization._id,
      propertyId: property._id,
      unitNumber: demo.units[0].unitNumber,
      tenantId: tenant._id,
      rentAmount: demo.units[0].rentAmount,
      leaseStart: occupiedLeaseStart,
      leaseEnd: occupiedLeaseEnd,
      status: 'OCCUPIED'
    },
    {
      organizationId: organization._id,
      propertyId: property._id,
      unitNumber: demo.units[1].unitNumber,
      rentAmount: demo.units[1].rentAmount,
      leaseStart: vacantLeaseStart,
      leaseEnd: vacantLeaseEnd,
      status: 'VACANT'
    }
  ])

  const vendor = await Vendor.create({
    userId: vendorUser._id,
    organizationId: organization._id,
    services: demo.vendor.services,
    rating: 4.9,
    totalJobs: demo.requests.length,
    notes: 'Primary demo vendor for plumbing, electrical, and general maintenance workflows.',
    isActive: true
  })

  const requestSeedRows = demo.requests.map((request, index) => ({
    organizationId: organization._id,
    propertyId: property._id,
    unitId: occupiedUnit._id,
    tenantId: tenant._id,
    vendorId: vendor._id,
    title: request.title,
    description: request.description,
    images: request.images,
    status: request.status,
    urgency: request.urgency,
    assignedAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 6),
    completedAt: request.status === 'DONE' ? new Date() : undefined
  }))

  const requests = await MaintenanceRequest.create(requestSeedRows)

  return {
    organization,
    landlord,
    tenant,
    vendorUser,
    vendor,
    property,
    occupiedUnit,
    vacantUnit,
    requests
  }
}

const main = async () => {
  await connectDatabase()
  await cleanupDemoData()

  const seedResult = await createSeedData()

  console.log('Demo seed complete')
  console.log(
    JSON.stringify(
      {
        organizationId: seedResult.organization._id.toString(),
        landlord: {
          id: seedResult.landlord._id.toString(),
          email: demo.landlord.email,
          password: demo.landlord.password
        },
        tenant: {
          id: seedResult.tenant._id.toString(),
          email: demo.tenant.email,
          password: demo.tenant.password
        },
        vendor: {
          userId: seedResult.vendorUser._id.toString(),
          vendorId: seedResult.vendor._id.toString(),
          email: demo.vendor.email,
          password: demo.vendor.password
        },
        propertyId: seedResult.property._id.toString(),
        occupiedUnitId: seedResult.occupiedUnit._id.toString(),
        vacantUnitId: seedResult.vacantUnit._id.toString(),
        requestIds: seedResult.requests.map((request) => request._id.toString())
      },
      null,
      2
    )
  )
}

main()
  .then(() => mongoose.connection.close())
  .catch(async (error) => {
    console.error('Demo seed failed', error)
    await mongoose.connection.close()
    process.exitCode = 1
  })