const mongoose = require('mongoose')
const dns = require('node:dns')
const { execSync } = require('node:child_process')

function setWorkingDnsServersIfNeeded() {
  const current = dns.getServers()
  const onlyLocalhost =
    current.length > 0 && current.every(s => s === '127.0.0.1' || s === '::1')

  if (!onlyLocalhost) return

  const fromEnv = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean)
    : []

  if (fromEnv.length > 0) {
    dns.setServers(fromEnv)
    return
  }

  if (process.platform === 'win32') {
    try {
      const out = execSync(
        'powershell -NoProfile -Command "(Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses) -join \',\'"',
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
        .toString()
        .trim()

      const servers = out
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      if (servers.length > 0) {
        dns.setServers(servers)
        return
      }
    } catch (e) {
      // ignore and fall back
    }
  }

  dns.setServers(['1.1.1.1', '8.8.8.8'])
}

setWorkingDnsServersIfNeeded()

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

if (!url) {
  console.log('MONGODB_URI is not defined')
  process.exit(1)
}

mongoose
  .connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
    process.exit(1)
  })

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2,3}-\d+$/.test(v) && v.length >= 8
      },
      message: props => `${props.value} is not a valid phone number`
    }
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Person', personSchema)

