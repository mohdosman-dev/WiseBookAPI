'use strict'

const { test, describe, before, after, it } = require('node:test')
const assert = require('node:assert')
const { build } = require('../helper') // Assuming helper.js provides build for Fastify app
const FormData = require('form-data')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto') // For generating unique user data

describe('User Routes', async () => {
  let app
  let adminToken
  let regularUserToken
  let adminUserId
  let regularUserId
  const testUserPassword = 'password123'
  const dummyImagePath = path.join(__dirname, 'test-user-image.png')
  const uniqueSuffix = () => randomUUID().slice(0, 8) // Helper for unique names

  before(async (t) => {
    app = await build(t) // Pass t (test context) to build if required

    // Create dummy image file
    fs.writeFileSync(dummyImagePath, 'dummy user image content')

    // 1. Register Admin User
    const adminEmail = `admin-${uniqueSuffix()}@example.com`
    const adminUsername = `admin_user_${uniqueSuffix()}`
    let formAdmin = new FormData()
    formAdmin.append('firstName', 'Admin')
    formAdmin.append('lastName', 'User')
    formAdmin.append('username', adminUsername)
    formAdmin.append('countryCode', '+1')
    formAdmin.append('phone', '1234560001')
    formAdmin.append('email', adminEmail)
    formAdmin.append('password', testUserPassword)
    formAdmin.append('isAdmin', 'true') // Send as string, common for FormData
    formAdmin.append('image', fs.createReadStream(dummyImagePath))

    const adminRegRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/register',
      payload: formAdmin,
      headers: formAdmin.getHeaders()
    })
    assert.equal(adminRegRes.statusCode, 201, `Admin registration failed: ${adminRegRes.payload}`)
    const adminRegPayload = JSON.parse(adminRegRes.payload)
    adminUserId = adminRegPayload.data._id
    assert.ok(adminUserId, 'Admin User ID not found after registration')

    // 2. Register Regular User
    const regularEmail = `user-${uniqueSuffix()}@example.com`
    const regularUsername = `regular_user_${uniqueSuffix()}`
    let formRegular = new FormData()
    formRegular.append('firstName', 'Regular')
    formRegular.append('lastName', 'User')
    formRegular.append('username', regularUsername)
    formRegular.append('countryCode', '+1')
    formRegular.append('phone', '1234560002')
    formRegular.append('email', regularEmail)
    formRegular.append('password', testUserPassword)
    // No isAdmin field for regular user
    formRegular.append('image', fs.createReadStream(dummyImagePath))

    const regularRegRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/register',
      payload: formRegular,
      headers: formRegular.getHeaders()
    })
    assert.equal(regularRegRes.statusCode, 201, `Regular user registration failed: ${regularRegRes.payload}`)
    const regularRegPayload = JSON.parse(regularRegRes.payload)
    regularUserId = regularRegPayload.data._id
    assert.ok(regularUserId, 'Regular User ID not found after registration')

    // 3. Login Admin User
    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/login',
      payload: { email: adminEmail, password: testUserPassword }
    })
    assert.equal(adminLoginRes.statusCode, 200, `Admin login failed: ${adminLoginRes.payload}`)
    adminToken = JSON.parse(adminLoginRes.payload).token
    assert.ok(adminToken, 'Admin token not found after login')

    // 4. Login Regular User
    const regularLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/login',
      payload: { email: regularEmail, password: testUserPassword }
    })
    assert.equal(regularLoginRes.statusCode, 200, `Regular user login failed: ${regularLoginRes.payload}`)
    regularUserToken = JSON.parse(regularLoginRes.payload).token
    assert.ok(regularUserToken, 'Regular user token not found after login')
  })

  after(async () => {
    // Delete the dummy image file
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath)
    }
    // Optional: Close the app if the build helper or app exposes a close method
    // if (app && typeof app.close === 'function') {
    //   await app.close()
    // }
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const newUserEmail = `new-${uniqueSuffix()}@example.com`
      const newUserUsername = `new_user_${uniqueSuffix()}`
      let formNewUser = new FormData()
      formNewUser.append('firstName', 'New')
      formNewUser.append('lastName', 'User')
      formNewUser.append('username', newUserUsername)
      formNewUser.append('countryCode', '+1')
      formNewUser.append('phone', '1234560003')
      formNewUser.append('email', newUserEmail)
      formNewUser.append('password', 'newPassword123')
      formNewUser.append('image', fs.createReadStream(dummyImagePath))

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: formNewUser,
        headers: formNewUser.getHeaders()
      })
      assert.equal(res.statusCode, 201)
      const payload = JSON.parse(res.payload)
      assert.ok(payload.token, 'Token not found upon new user registration')
      assert.ok(payload.data._id, 'User ID not found upon new user registration')
      assert.equal(payload.data.email, newUserEmail)
    })

    it('should fail registration with an existing email', async () => {
      // Use admin's email to attempt duplicate registration
      const adminCredentials = JSON.parse((await app.inject({ method: 'GET', url: `/api/v1/users/${adminUserId}`, headers: { Authorization: `Bearer ${adminToken}` }})).payload)

      let formDuplicateEmail = new FormData()
      formDuplicateEmail.append('firstName', 'Duplicate')
      formDuplicateEmail.append('lastName', 'EmailTest')
      formDuplicateEmail.append('username', `dup_email_user_${uniqueSuffix()}`)
      formDuplicateEmail.append('countryCode', '+1')
      formDuplicateEmail.append('phone', '1234560004')
      formDuplicateEmail.append('email', adminCredentials.data.email) // Existing email
      formDuplicateEmail.append('password', 'password123')
      formDuplicateEmail.append('image', fs.createReadStream(dummyImagePath))

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: formDuplicateEmail,
        headers: formDuplicateEmail.getHeaders()
      })
      assert.equal(res.statusCode, 409, `Expected 409 for existing email, got ${res.statusCode}: ${res.payload}`)
    })
  })

  describe('User Login', () => {
    it('should login an existing admin user successfully', async () => {
      const adminCredentials = JSON.parse((await app.inject({ method: 'GET', url: `/api/v1/users/${adminUserId}`, headers: { Authorization: `Bearer ${adminToken}` }})).payload)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: { email: adminCredentials.data.email, password: testUserPassword }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.ok(payload.token)
      assert.equal(payload.data.email, adminCredentials.data.email)
      assert.strictEqual(payload.data.isAdmin, true)
    })

    it('should login an existing regular user successfully', async () => {
        const regularCredentials = JSON.parse((await app.inject({ method: 'GET', url: `/api/v1/users/${regularUserId}`, headers: { Authorization: `Bearer ${adminToken}` }})).payload)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: { email: regularCredentials.data.email, password: testUserPassword }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.ok(payload.token)
      assert.equal(payload.data.email, regularCredentials.data.email)
      assert.notStrictEqual(payload.data.isAdmin, true) // Should be false or undefined
    })

    it('should fail login with incorrect password', async () => {
      const regularCredentials = JSON.parse((await app.inject({ method: 'GET', url: `/api/v1/users/${regularUserId}`, headers: { Authorization: `Bearer ${adminToken}` }})).payload)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: { email: regularCredentials.data.email, password: 'wrongPassword' }
      })
      assert.equal(res.statusCode, 401)
    })

    it('should fail login for non-existent user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: { email: `nonexistent-${uniqueSuffix()}@example.com`, password: 'anypassword' }
      })
      assert.equal(res.statusCode, 401) // Or 404 depending on implementation, 401 is common for login failures
    })
  })

  describe('Get All Users (GET /api/v1/users/)', () => {
    it('admin should get all users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/',
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.ok(Array.isArray(payload.data), 'Data should be an array')
      assert.ok(payload.data.length >= 2, 'Should have at least admin and regular user')
    })

    it('regular user should not get all users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/',
        headers: { Authorization: `Bearer ${regularUserToken}` }
      })
      assert.equal(res.statusCode, 403, `Expected 403, got ${res.statusCode}: ${res.payload}`) // Forbidden
    })
  })

  describe('Get User by ID (GET /api/v1/users/:id)', () => {
    it('admin should get another user by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${regularUserId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.equal(payload.data._id, regularUserId)
    })

    it('regular user should get their own data by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${regularUserId}`,
        headers: { Authorization: `Bearer ${regularUserToken}` }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.equal(payload.data._id, regularUserId)
    })

    it('regular user should not get another user by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${adminUserId}`,
        headers: { Authorization: `Bearer ${regularUserToken}` }
      })
      // This could be 403 (Forbidden) if the user is found but not allowed
      // or 404 if the system hides existence of other users.
      // Let's assume 403 for now as it's a specific user ID.
      assert.ok(res.statusCode === 403 || res.statusCode === 404, `Expected 403 or 404, got ${res.statusCode}: ${res.payload}`)
    })

    it('should return 404 for non-existent user ID', async () => {
      const fakeId = '605fe6787701081595203432' // A valid MongoDB ObjectId format, but likely non-existent
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${fakeId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(res.statusCode, 404, `Expected 404, got ${res.statusCode}: ${res.payload}`)
    })
  })

  describe('Get Current User (GET /api/v1/users/me)', () => {
    it('regular user should get their own data via /me', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { Authorization: `Bearer ${regularUserToken}` }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.equal(payload.data._id, regularUserId)
    })

    it('admin should get their own data via /me', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(res.statusCode, 200)
      const payload = JSON.parse(res.payload)
      assert.equal(payload.data._id, adminUserId)
    })
  })

  describe('Update User (PUT /api/v1/users/:id)', () => {
    // Note: updateUser controller is a stub, so tests expect 200 but might not see actual data changes reflected in GETs
    // unless the stub is more sophisticated.
    it('regular user should update their own information (e.g., firstName)', async () => {
      const updatedFirstName = 'RegularUpdated'
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${regularUserId}`,
        headers: { Authorization: `Bearer ${regularUserToken}` },
        payload: { firstName: updatedFirstName }
      })
      assert.equal(res.statusCode, 200, `Update failed: ${res.payload}`)
      const payload = JSON.parse(res.payload)
      // Assuming the stub returns the updated data or a success message.
      // If the stub is very basic, this might need adjustment.
      assert.equal(payload.data.firstName, updatedFirstName, "First name was not updated in the response")
    })

    it('admin should update another user\'s information', async () => {
      const updatedFirstName = 'RegularUpdatedByAdmin'
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${regularUserId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { firstName: updatedFirstName }
      })
      assert.equal(res.statusCode, 200, `Admin update failed: ${res.payload}`)
      const payload = JSON.parse(res.payload)
      assert.equal(payload.data.firstName, updatedFirstName, "First name was not updated by admin in the response")
    })

    it('regular user should not update another user\'s information', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${adminUserId}`,
        headers: { Authorization: `Bearer ${regularUserToken}` },
        payload: { firstName: 'AttemptUpdateByRegular' }
      })
      assert.equal(res.statusCode, 403, `Expected 403, got ${res.statusCode}: ${res.payload}`)
    })

    it('should not update if user ID does not exist', async () => {
      const fakeId = '605fe6787701081595203432'
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/${fakeId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { firstName: 'AttemptUpdateNonExistent' }
      })
      assert.equal(res.statusCode, 404, `Expected 404, got ${res.statusCode}: ${res.payload}`)
    })
  })

  describe('Delete User (DELETE /api/v1/users/:id)', () => {
    let userToDeleteId
    let userToDeleteEmail

    before(async () => {
      // Register a new user specifically for deletion tests
      userToDeleteEmail = `delete-${uniqueSuffix()}@example.com`
      const userToDeleteUsername = `delete_user_${uniqueSuffix()}`
      let formDeleteUser = new FormData()
      formDeleteUser.append('firstName', 'ToDelete')
      formDeleteUser.append('lastName', 'User')
      formDeleteUser.append('username', userToDeleteUsername)
      formDeleteUser.append('countryCode', '+1')
      formDeleteUser.append('phone', '1234560005')
      formDeleteUser.append('email', userToDeleteEmail)
      formDeleteUser.append('password', testUserPassword)
      formDeleteUser.append('image', fs.createReadStream(dummyImagePath))

      const regRes = await app.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: formDeleteUser,
        headers: formDeleteUser.getHeaders()
      })
      assert.equal(regRes.statusCode, 201, `User for deletion registration failed: ${regRes.payload}`)
      userToDeleteId = JSON.parse(regRes.payload).data._id
      assert.ok(userToDeleteId, 'User to delete ID not found')
    })

    it('admin should delete a user', async () => {
      assert.ok(userToDeleteId, 'UserToDeleteId not set for deletion test')
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${userToDeleteId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(deleteRes.statusCode, 200, `Admin delete failed: ${deleteRes.payload}`)

      // Verify user is deleted by trying to get them
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${userToDeleteId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(getRes.statusCode, 404, `Expected 404 after deletion, got ${getRes.statusCode}: ${getRes.payload}`)
    })

    it('regular user should not delete another user', async () => {
      // Attempt to delete admin user with regular user token
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${adminUserId}`,
        headers: { Authorization: `Bearer ${regularUserToken}` }
      })
      assert.equal(res.statusCode, 403, `Expected 403, got ${res.statusCode}: ${res.payload}`)
    })

    it('should return 404 when trying to delete non-existent user', async () => {
      const fakeId = '605fe6787701081595203432'
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${fakeId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      assert.equal(res.statusCode, 404, `Expected 404, got ${res.statusCode}: ${res.payload}`)
    })
  })
})
