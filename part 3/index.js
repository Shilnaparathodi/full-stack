const express = require('express');
const app = express();
app.use(express.json()); // parse JSON body

let persons = [
  { id: "1", name: "Arto Hellas", number: "040-123456" },
  { id: "2", name: "Ada Lovelace", number: "39-44-5323523" },
  { id: "3", name: "Dan Abramov", number: "12-43-234345" },
  { id: "4", name: "Mary Poppendieck", number: "39-23-6423122" }
];

// Step 3.1: GET all persons
app.get('/api/persons', (req, res) => {
  res.json(persons);
});

// Step 3.2: GET info page
app.get('/info', (req, res) => {
  const now = new Date();
  res.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${now}</p>
  `);
});

// Step 3.3: GET person by ID
app.get('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  const person = persons.find(p => p.id === id);
  if (person) {
    res.json(person);
  } else {
    res.status(404).end();
  }
});

// Step 3.4: DELETE person by ID
app.delete('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  persons = persons.filter(p => p.id !== id);
  res.status(204).end();
});

// Step 3.5 + 3.6: POST new person with validation
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
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
