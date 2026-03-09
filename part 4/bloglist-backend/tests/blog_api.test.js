// tests/blog_api.test.js

const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')           // Express app
const Blog = require('../models/blog')  // Mongoose Blog model

const api = supertest(app)

// Initial blogs to populate DB before each test
const initialBlogs = [
  { title: 'First Blog', author: 'Author1', url: 'http://first.com', likes: 5 },
  { title: 'Second Blog', author: 'Author2', url: 'http://second.com', likes: 3 }
]

// Clear DB and insert initial blogs before each test
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

let token // global variable for the test token

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  // create initial user
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', name: 'Superuser', passwordHash })
  const savedUser = await user.save()

  // create initial blogs
  const blogObjects = initialBlogs.map(blog => new Blog({ ...blog, user: savedUser._id }))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)

  // generate JWT token for tests
  const userForToken = { username: savedUser.username, id: savedUser._id }
  token = jwt.sign(userForToken, process.env.SECRET)
})

// ========================
// 4.8: GET /api/blogs tests
// ========================

// Test 1: GET /api/blogs returns JSON
test('blogs are returned as JSON', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

// Test 2: GET /api/blogs returns all blogs
test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(initialBlogs.length)
})

// ========================
// 4.9: Unique identifier test
// ========================

test('unique identifier property of blog posts is named id', async () => {
  const response = await api.get('/api/blogs')

  // Every blog should have 'id' defined and no '_id'
  response.body.forEach(blog => {
    expect(blog.id).toBeDefined()
    expect(blog._id).not.toBeDefined()
  })
})

// ========================
// 4.10: POST /api/blogs
// ========================

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'New Blog',
    author: 'Author3',
    url: 'http://newblog.com',
    likes: 7,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(initialBlogs.length + 1)

  const titles = response.body.map(b => b.title)
  expect(titles).toContain('New Blog')
})

// ========================
// 4.11: likes default value
// ========================

test('if likes is missing, it defaults to 0', async () => {
  const newBlog = {
    title: 'No Likes Blog',
    author: 'Author4',
    url: 'http://nolikes.com',
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  expect(response.body.likes).toBe(0)
})

// ========================
// 4.12: missing title or url
// ========================

test('blog without title is rejected with 400', async () => {
  const newBlog = {
    author: 'No Title',
    url: 'http://notitle.com',
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
})

test('blog without url is rejected with 400', async () => {
  const newBlog = {
    title: 'No URL',
    author: 'No URL Author',
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
})


// ========================
// 4.13: DELETE /api/blogs/:id
// ========================

test('Exercise 4.13: a blog can be deleted by its creator', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await api.get('/api/blogs')
  expect(blogsAtEnd.body).toHaveLength(blogsAtStart.body.length - 1)

  const titles = blogsAtEnd.body.map(b => b.title)
  expect(titles).not.toContain(blogToDelete.title)
})

test('Exercise 4.13: deleting non-existent blog returns 404', async () => {
  const invalidId = '000000000000000000000000'

  await api
    .delete(`/api/blogs/${invalidId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
})

test('Exercise 4.13: deleting blog without token returns 401', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(401)
})

test('Exercise 4.13: non-creator cannot delete blog', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  // Create new user
  const newUser = { username: 'otheruser', name: 'Other User', password: 'password' }
  await api
    .post('/api/users')
    .send(newUser)
    .expect(201)

  // Login as new user to get different token
  const newUserForToken = { username: 'otheruser', id: 'differentid' }
  const otherToken = jwt.sign(newUserForToken, process.env.SECRET)

  // Try to delete blog created by first user
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .expect(401)
})

// ========================
// 4.14: PUT /api/blogs/:id
// ========================

test('Exercise 4.14: a blog likes can be updated', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]

  const updatedBlog = {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: blogToUpdate.likes + 1,
  }

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(response.body.likes).toBe(blogToUpdate.likes + 1)
})

test('Exercise 4.14: a blog can be updated multiple times', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]

  const update1 = { ...blogToUpdate, likes: 10 }
  const response1 = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(update1)
    .expect(200)

  expect(response1.body.likes).toBe(10)

  const update2 = { ...response1.body, likes: 20 }
  const response2 = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(update2)
    .expect(200)

  expect(response2.body.likes).toBe(20)
})

test('Exercise 4.14: updating individual blog fields works', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]

  const updatedBlog = {
    title: 'Updated Title',
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: blogToUpdate.likes,
  }

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)

  expect(response.body.title).toBe('Updated Title')
  expect(response.body.author).toBe(blogToUpdate.author)
})

test('Exercise 4.14: updating non-existent blog returns 404', async () => {
  const invalidId = '000000000000000000000000'

  const updatedBlog = {
    title: 'Updated Title',
    author: 'Author',
    url: 'http://example.com',
    likes: 10,
  }

  await api
    .put(`/api/blogs/${invalidId}`)
    .send(updatedBlog)
    .expect(404)
})

// ========================
// 4.23: Authorization Tests
// ========================

test('adding a blog fails with 401 if token is not provided', async () => {
  const newBlog = {
    title: 'Blog Without Token',
    author: 'Unauthorized',
    url: 'http://notoken.com',
    likes: 5,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
})


// Close DB connection after all tests
afterAll(async () => {
  await mongoose.connection.close()
})
