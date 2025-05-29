'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const { build } = require('../helper')
const FormData = require('form-data')
const fs = require('node:fs')
const path = require('node:path')

test('successful user registration', async (t) => {
  const app = await build(t)

  // Create a dummy image file for upload
  const imagePath = path.join(__dirname, 'test-image.png')
  fs.writeFileSync(imagePath, 'dummy image content')

  const form = new FormData()
  form.append('firstName', 'Test')
  form.append('lastName', 'User')
  form.append('username', 'testuser')
  form.append('countryCode', '+1')
  form.append('phone', '1234567890')
  form.append('email', 'testuser@example.com')
  form.append('password', 'password123')
  form.append('image', fs.createReadStream(imagePath))

  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/users/register',
    payload: form,
    headers: form.getHeaders()
  })

  assert.equal(res.statusCode, 201)
  const payload = JSON.parse(res.payload)
  assert.ok(payload.message, 'User registered successfully')
  assert.ok(payload.token)
  assert.ok(payload.data)
  assert.equal(payload.data.email, 'testuser@example.com')
  assert.equal(payload.data.username, 'testuser')

  // Clean up the dummy image file
  fs.unlinkSync(imagePath)
})
