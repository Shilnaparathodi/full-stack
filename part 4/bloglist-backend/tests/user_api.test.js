// tests/user_api.test.js

const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  // Create initial user for testing
  const passwordHash = await bcrypt.hash('password123', 10)
  const user = new User({
    username: 'testuser',
    name: 'Test User',
    passwordHash
  })
  await user.save()
})

// ========================
// 4.15: User Creation
// ========================

describe('User creation (4.15)', () => {
  test('users can be created successfully', async () => {
    const newUser = {
      username: 'newuser',
      name: 'New User',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.username).toBe('newuser')
    expect(response.body.name).toBe('New User')
    expect(response.body.passwordHash).toBeUndefined()
    expect(response.body.id).toBeDefined()
  })

  test('users are returned as JSON', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(Array.isArray(response.body)).toBe(true)
  })

  test('all users are returned', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0].username).toBe('testuser')
  })
})

// ========================
// 4.16: User Validation
// ========================

describe('User validation (4.16)', () => {
  test('username must be provided', async () => {
    const newUser = {
      name: 'No Username',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBeDefined()
  })

  test('password must be provided', async () => {
    const newUser = {
      username: 'newuser',
      name: 'No Password'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBeDefined()
  })

  test('username must be at least 3 characters long', async () => {
    const newUser = {
      username: 'ab',
      name: 'Short Username',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain('at least 3 characters')
  })

  test('password must be at least 3 characters long', async () => {
    const newUser = {
      username: 'validuser',
      name: 'Valid Name',
      password: 'ab'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain('at least 3 characters')
  })

  test('username must be unique', async () => {
    const newUser = {
      username: 'testuser', // This username already exists
      name: 'Duplicate Username',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain('unique')
  })

  test('multiple validation errors can be returned', async () => {
    const invalidUsers = [
      { username: 'a', password: 'ab' }, // both too short
      { username: 'ab', password: 'password123' }, // username too short
      { username: 'validuser', password: 'p' }, // password too short
    ]

    for (const user of invalidUsers) {
      const response = await api
        .post('/api/users')
        .send(user)
        .expect(400)

      expect(response.body.error).toBeDefined()
    }
  })
})

// ========================
// User info in responses
// ========================

describe('User info in responses', () => {
  test('password hash is not returned in user responses', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)

    response.body.forEach(user => {
      expect(user.passwordHash).toBeUndefined()
    })
  })

  test('created user response does not contain password hash', async () => {
    const newUser = {
      username: 'hashtest',
      name: 'Hash Test',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)

    expect(response.body.passwordHash).toBeUndefined()
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
