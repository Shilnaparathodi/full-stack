const mongoose = require("mongoose")
const dns = require("node:dns")
const { execSync } = require("node:child_process")

function setWorkingDnsServersIfNeeded() {
  const current = dns.getServers()
  const onlyLocalhost =
    current.length > 0 && current.every(s => s === "127.0.0.1" || s === "::1")

  if (!onlyLocalhost) return

  // Allow manual override, e.g. PowerShell:
  // $env:DNS_SERVERS="10.71.120.58,1.1.1.1"; node mongo.js ...
  const fromEnv = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(",").map(s => s.trim()).filter(Boolean)
    : []

  if (fromEnv.length > 0) {
    dns.setServers(fromEnv)
    return
  }

  // On Windows, ask the OS what DNS servers are configured and use them.
  if (process.platform === "win32") {
    try {
      const out = execSync(
        "powershell -NoProfile -Command \"(Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses) -join ','\"",
        { stdio: ["ignore", "pipe", "ignore"] }
      )
        .toString()
        .trim()

      const servers = out
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)

      if (servers.length > 0) {
        dns.setServers(servers)
        return
      }
    } catch {
      // ignore and fall back
    }
  }

  // Fallback to public resolvers.
  dns.setServers(["1.1.1.1", "8.8.8.8"])
}

setWorkingDnsServersIfNeeded()

const password = process.argv[2]

if (!password) {
  console.log("give password as argument")
  process.exit(1)
}

const encodedPassword = encodeURIComponent(password)

const url =
  `mongodb+srv://shilna:${encodedPassword}@cluster0.txd2v2l.mongodb.net/phonebook?retryWrites=true&w=majority`
mongoose.set("strictQuery", false)

mongoose.connect(url).catch(error => {
  console.log("error connecting:", error.message)
  process.exit(1)
})

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model("Person", personSchema)

const name = process.argv[3]
const number = process.argv[4]

if (!name && !number) {
  Person.find({}).then(persons => {
    console.log("phonebook:")
    persons.forEach(p => {
      console.log(`${p.name} ${p.number}`)
    })
    mongoose.connection.close()
  })
} else if (name && number) {
  const person = new Person({ name, number })

  person.save().then(() => {
    console.log(`added ${name} number ${number} to phonebook`)
    mongoose.connection.close()
  })
} else {
  console.log("usage: node mongo.js <password> [name] [number]")
  mongoose.connection.close()
}