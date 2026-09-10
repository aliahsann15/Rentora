const assert = require('node:assert/strict')
const { test, afterEach } = require('node:test')
const { User, RefreshToken } = require('../dist/models')
const { signAccessToken, signRefreshToken } = require('../dist/utils/auth')
const { authenticateJWT } = require('../dist/middlewares/authenticateJWT')
const { refresh, getMe, getMyTenantAssignment } = require('../dist/controllers/authController')

const originalFindUser = User.findById
const originalFindToken = RefreshToken.findOne
afterEach(() => {
  User.findById = originalFindUser
  RefreshToken.findOne = originalFindToken
})

const user = { _id: 'a'.repeat(24), organizationId: 'b'.repeat(24), role: 'LANDLORD', isActive: true }
const payload = { userId: user._id, organizationId: user.organizationId, role: user.role }
function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}
function request(token) { return { header: () => token ? `Bearer ${token}` : undefined } }

test('valid mobile or BFF bearer credentials still attach the active user', async () => {
  User.findById = async () => user
  const req = request(signAccessToken(payload))
  let proceeded = false
  await authenticateJWT(req, response(), () => { proceeded = true })
  assert.equal(proceeded, true)
  assert.deepEqual(req.user, payload)
})

test('missing and invalid credentials return 401 without accessing the database', async () => {
  User.findById = async () => { assert.fail('must not load user') }
  for (const token of [undefined, 'invalid']) {
    const res = response()
    await authenticateJWT(request(token), res, () => assert.fail('must not authorize'))
    assert.equal(res.statusCode, 401)
  }
})

test('inactive and deleted users are not authenticated', async () => {
  for (const record of [null, { ...user, isActive: false }]) {
    User.findById = async () => record
    const res = response()
    await authenticateJWT(request(signAccessToken(payload)), res, () => assert.fail('must not authorize'))
    assert.equal(res.statusCode, 401)
  }
})

test('database outages are not reported as invalid access credentials', async () => {
  User.findById = async () => { throw new Error('Database unavailable') }
  const res = response()
  await authenticateJWT(request(signAccessToken(payload)), res, () => assert.fail('must not authorize'))
  assert.equal(res.statusCode, 503)
  assert.equal(res.body.error, undefined)
})

test('refresh still returns access token for existing native and BFF clients', async () => {
  RefreshToken.findOne = async () => ({ expiresAt: new Date(Date.now() + 60_000) })
  User.findById = async () => user
  const res = response()
  await refresh({ body: { refreshToken: signRefreshToken(payload) } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(typeof res.body.accessToken, 'string')
})

test('revoked refresh returns 401, but a database outage returns 503', async () => {
  const req = { body: { refreshToken: signRefreshToken(payload) } }
  RefreshToken.findOne = async () => null
  const revoked = response()
  await refresh(req, revoked)
  assert.equal(revoked.statusCode, 401)
  RefreshToken.findOne = async () => { throw new Error('Database unavailable') }
  const unavailable = response()
  await refresh(req, unavailable)
  assert.equal(unavailable.statusCode, 503)
  assert.equal(unavailable.body.error, undefined)
})

test('current user endpoint preserves outage semantics after middleware verification', async () => {
  User.findById = () => ({ select: async () => { throw new Error('Database unavailable') } })
  const res = response()
  await getMe({ user: payload }, res)
  assert.equal(res.statusCode, 503)
})

test('tenant assignment database outage does not expire the session', async () => {
  User.findById = () => ({ select: async () => { throw new Error('Database unavailable') } })
  const res = response()
  await getMyTenantAssignment(request(signAccessToken(payload)), res)
  assert.equal(res.statusCode, 503)
})
