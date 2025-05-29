'use strict'

const { test, describe, before, after, it } = require('node:test')
const assert = require('node:assert')
const { build } = require('../helper')
const FormData = require('form-data')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

describe('Category CRUD Operations', async () => {
  let app
  let adminToken
  let createdCategoryId

  const adminUser = {
    firstName: 'Admin',
    lastName: 'CatUser',
    username: `admincat_${randomUUID()}`, // Ensure unique username
    countryCode: '+1',
    phone: '1234567899',
    email: `admincat_${randomUUID()}@example.com`, // Ensure unique email
    password: 'password123',
    isAdmin: true // Attempt to set isAdmin to true
  }

  const dummyImagePath = path.join(__dirname, 'test-category-image.png')
  const dummyImageContent = 'dummy category image content'

  before(async (t) => {
    app = await build(t)

    // Create dummy image file
    fs.writeFileSync(dummyImagePath, dummyImageContent)

    // Register admin user
    const registrationForm = new FormData()
    for (const key in adminUser) {
      if (key === 'isAdmin') { // FormData expects string or blob values
        registrationForm.append(key, String(adminUser[key]))
      } else {
        registrationForm.append(key, adminUser[key])
      }
    }
    // For user registration, image is optional, so not sending it here
    // If image was required, we'd do:
    // registrationForm.append('image', fs.createReadStream(dummyImagePath))

    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/register',
      payload: registrationForm,
      headers: registrationForm.getHeaders()
    })

    // It's possible that isAdmin cannot be set directly.
    // We'll proceed assuming it works or that the backend handles it.
    // If admin-only tests fail later, this is a likely cause.
    assert.equal(regRes.statusCode, 201, `Admin registration failed: ${regRes.payload}`)
    const regPayload = JSON.parse(regRes.payload)
    assert.ok(regPayload.token, 'Registration did not return a token')


    // Login as admin user to get a fresh token that reflects isAdmin status
    // (assuming registration token might not immediately reflect isAdmin if it's a separate step)
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users/login',
      payload: {
        email: adminUser.email,
        password: adminUser.password
      }
    })

    assert.equal(loginRes.statusCode, 200, `Admin login failed: ${loginRes.payload}`)
    const loginPayload = JSON.parse(loginRes.payload)
    assert.ok(loginPayload.token, 'Login did not return a token')
    adminToken = loginPayload.token
  })

  after(() => {
    // Clean up dummy image file
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath)
    }
  })

  it('POST /api/v1/category/ - Create Category (Admin)', async (t) => {
    const form = new FormData()
    form.append('name', 'Test Category')
    form.append('image', fs.createReadStream(dummyImagePath))

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/category/',
      payload: form,
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${adminToken}`
      }
    })

    assert.equal(res.statusCode, 201, `Create category failed: ${res.payload}`)
    const payload = JSON.parse(res.payload)
    assert.ok(payload.data, 'Response data is missing for create category')
    assert.equal(payload.data.name, 'Test Category')
    assert.ok(payload.data.image, 'Category image is missing')
    assert.equal(payload.message, 'Category created successfully')
    assert.ok(payload.data._id, 'Category ID is missing')
    createdCategoryId = payload.data._id
  })

  it('GET /api/v1/category/ - Get All Categories', async (t) => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/category/'
    })

    assert.equal(res.statusCode, 200, `Get all categories failed: ${res.payload}`)
    const payload = JSON.parse(res.payload)
    assert.ok(Array.isArray(payload.data), 'Response data should be an array')
    assert.equal(payload.message, 'Categories retrieved successfully')
    // Check if the created category is in the list
    if (createdCategoryId) {
      const found = payload.data.some(cat => cat._id === createdCategoryId)
      assert.ok(found, 'Newly created category not found in the list')
    }
  })

  it('GET /api/v1/category/:id - Get Category by ID', async (t) => {
    assert.ok(createdCategoryId, 'No category ID to test with for GET by ID')
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/category/${createdCategoryId}`
    })

    assert.equal(res.statusCode, 200, `Get category by ID failed: ${res.payload}`)
    const payload = JSON.parse(res.payload)
    assert.ok(payload.data, 'Response data is missing for get category by ID')
    assert.equal(payload.data._id, createdCategoryId)
    assert.equal(payload.data.name, 'Test Category') // Name from creation step
    assert.ok(payload.data.image)
    assert.equal(payload.message, 'Category retrieved successfully')
  })

  it('PUT /api/v1/category/:id - Update Category (Admin)', async (t) => {
    assert.ok(createdCategoryId, 'No category ID to test with for PUT')
    const updatedName = 'Updated Test Category'
    const form = new FormData()
    form.append('name', updatedName)
    // Optionally, append a new image if testing image update too
    // form.append('image', fs.createReadStream(newImagePath))

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/category/${createdCategoryId}`,
      payload: form,
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${adminToken}`
      }
    })

    assert.equal(res.statusCode, 200, `Update category failed: ${res.payload}`)
    const payload = JSON.parse(res.payload)
    assert.ok(payload.data, 'Response data is missing for update category')
    assert.equal(payload.data.name, updatedName)
    assert.equal(payload.message, 'Category updated successfully')
  })

  it('DELETE /api/v1/category/:id - Delete Category (Admin)', async (t) => {
    assert.ok(createdCategoryId, 'No category ID to test with for DELETE')
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/category/${createdCategoryId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    })

    assert.equal(res.statusCode, 200, `Delete category failed: ${res.payload}`)
    const payload = JSON.parse(res.payload)
    assert.equal(payload.data._id, createdCategoryId)
    assert.equal(payload.message, 'Category deleted successfully')
  })

  it('GET /api/v1/category/:id - Verify Deletion', async (t) => {
    assert.ok(createdCategoryId, 'No category ID to test with for verifying deletion')
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/category/${createdCategoryId}`
    })
    // After deletion, the category should not be found.
    // The API might return 404 or some other status indicating not found.
    // Common practice is 404.
    assert.equal(res.statusCode, 404, `Verify deletion expected 404, but got ${res.statusCode}: ${res.payload}`)
  })
})
