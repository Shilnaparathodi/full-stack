const express = require('express');
const morgan = require('morgan');
const app = express();

// Middleware to parse JSON
app.use(express.json());
const cors = require('cors')
app.use(cors())
// 🔥 Custom Morgan token to log POST body
morgan.token('body', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body);
  }
  return '';
});

// 🔥 Morgan logging configuration
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
);

// Hardcoded data
let persons = [
  { id: "1", name: "Arto Hellas", number: "040-123456" },
  { id: "2", name: "Ada Lovelace", number: "39-44-5323523" },
  { id: "3", name: "Dan Abramov", number: "12-43-234345" },
  { id: "4", name: "Mary Poppendieck", number: "39-23-6423122" }
];

// 3.1 GET all persons
app.get('/api/persons', (req, res) => {
  res.json(persons);
});

// 3.2 GET info
app.get('/info', (req, res) => {
  const now = new Date();
  res.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${now}</p>
  `);
});

// 3.3 GET single person
app.get('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  const person = persons.find(p => p.id === id);

  if (person) {
    res.json(person);
  } else {
    res.status(404).json({ error: "person not found" });
  }
});

// 3.4 DELETE person
app.delete('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  persons = persons.filter(p => p.id !== id);
  res.status(204).end();
});

// 3.5 & 3.6 POST with validation
app.post('/api/persons', (req, res) => {
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({ error: 'name or number is missing' });
  }

  const nameExists = persons.some(
    person => person.name.toLowerCase() === body.name.toLowerCase()
  );

  if (nameExists) {
    return res.status(400).json({ error: 'name must be unique' });
  }

  const person = {
    id: (Math.random() * 1000000).toFixed(0),
    name: body.name,
    number: body.number
  };

  persons = persons.concat(person);
  res.json(person);
});

// Start server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.put('/api/persons/:id', (req, res) => {
  const id = req.params.id
  const body = req.body

  const person = persons.find(p => p.id === id)

  if (!person) {
    return res.status(404).json({ error: 'person not found' })
  }

  const updatedPerson = {
    ...person,
    number: body.number
  }

  persons = persons.map(p =>
    p.id !== id ? p : updatedPerson
  )

  res.json(updatedPerson)
})