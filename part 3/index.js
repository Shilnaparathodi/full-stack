const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const path = require("path")

require("dotenv").config()

const Person = require("./models/person")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Morgan custom token (log POST body)
morgan.token("body", (req) => {
  if (req.method === "POST") {
    return JSON.stringify(req.body)
  }
  return ""
})

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
)

// 🔥 Serve frontend production build
app.use(express.static(path.join(__dirname, "dist")))

// GET all persons
app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then(persons => {
      res.json(persons)
    })
    .catch(next)
})

// GET info
app.get("/info", (req, res, next) => {
  Person.countDocuments({})
    .then(count => {
      const now = new Date()
      res.send(`
        <p>Phonebook has info for ${count} people</p>
        <p>${now}</p>
      `)
    })
    .catch(next)
})

// GET single person
app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).json({ error: "person not found" })
      }
    })
    .catch(next)
})

// DELETE person
app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(next)
})

// POST new person
app.post("/api/persons", (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).json({ error: "name or number is missing" })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(next)
})

// PUT update number
app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body

  Person.findByIdAndUpdate(
    req.params.id,
    { number: body.number },
    { new: true, runValidators: true, context: "query" }
  )
    .then(updatedPerson => {
      if (!updatedPerson) {
        return res.status(404).json({ error: "person not found" })
      }
      res.json(updatedPerson)
    })
    .catch(next)
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (error, req, res, next) => {
  if (error.name === "CastError") {
    return res.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}

// Unknown API endpoints should NOT fall through to the React catch-all
app.use("/api", unknownEndpoint)

//// Catch-all for React (Express 5 safe)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

app.use(errorHandler)

// START SERVER
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})