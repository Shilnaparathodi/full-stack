import { useState, useEffect } from 'react'
import Filter from './components/Filter'
import PersonForm from './components/PersonForm'
import Persons from './components/persons'
import Notification from './components/notification'
import personService from './services/persons'

const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [filter, setFilter] = useState('')
  const [notification, setNotification] = useState(null)
  const [notificationType, setNotificationType] = useState('success')

  useEffect(() => {
    personService
      .getAll()
      .then(response => {
        setPersons(response.data)
      })
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    const existingPerson = persons.find(
      person => person.name === newName
    )

    // 🔁 UPDATE
    if (existingPerson) {
      const confirmUpdate = window.confirm(
        `${newName} is already added. Replace old number?`
      )

      if (confirmUpdate) {
        const updatedPerson = {
          ...existingPerson,
          number: newNumber
        }

        personService
          .update(existingPerson.id, updatedPerson)
          .then(response => {
            setPersons(
              persons.map(p =>
                p.id !== existingPerson.id ? p : response.data
              )
            )

            setNotification(`Updated ${existingPerson.name}`)
            setNotificationType('success')

            setTimeout(() => {
              setNotification(null)
            }, 3000)

            setNewName('')
            setNewNumber('')
          })
          .catch(error => {
            setNotification(
              `Information of ${existingPerson.name} has already been removed from server`
            )
            setNotificationType('error')

            setTimeout(() => {
              setNotification(null)
            }, 3000)

            setPersons(
              persons.filter(p => p.id !== existingPerson.id)
            )
          })
      }

      return
    }

    // ➕ CREATE
    const newPerson = {
      name: newName,
      number: newNumber
    }

    personService
      .create(newPerson)
      .then(response => {
        setPersons(persons.concat(response.data))

        setNotification(`Added ${newPerson.name}`)
        setNotificationType('success')

        setTimeout(() => {
          setNotification(null)
        }, 3000)

        setNewName('')
        setNewNumber('')
      })
      .catch(error => {
        setNotification(error.response.data.error)
        setNotificationType('error')

        setTimeout(() => {
          setNotification(null)
        }, 3000)
      })
  }

  const handleDelete = (id) => {
    const person = persons.find(p => p.id === id)

    const confirmDelete = window.confirm(
      `Delete ${person.name}?`
    )

    if (confirmDelete) {
      personService
        .remove(id)
        .then(() => {
          setPersons(persons.filter(p => p.id !== id))

          setNotification(`Deleted ${person.name}`)
          setNotificationType('success')

          setTimeout(() => {
            setNotification(null)
          }, 3000)
        })
        .catch(error => {
          setNotification(
            `Information of ${person.name} has already been removed from server`
          )
          setNotificationType('error')

          setTimeout(() => {
            setNotification(null)
          }, 3000)

          setPersons(persons.filter(p => p.id !== id))
        })
    }
  }

  const personsToShow = persons.filter(person =>
    person.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <h2>Phonebook</h2>

      <Notification
        message={notification}
        type={notificationType}
      />

      <Filter
        filter={filter}
        handleFilterChange={(e) => setFilter(e.target.value)}
      />

      <h3>Add a new</h3>

      <PersonForm
        onSubmit={handleSubmit}
        newName={newName}
        handleNameChange={(e) => setNewName(e.target.value)}
        newNumber={newNumber}
        handleNumberChange={(e) => setNewNumber(e.target.value)}
      />

      <h3>Numbers</h3>

      <Persons
        persons={personsToShow}
        handleDelete={handleDelete}
      />
    </div>
  )
}

export default App
