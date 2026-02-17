import Country from './Country'

const Countries = ({ countries, selectedCountry, onShow }) => {

  if (countries.length > 10) {
    return <p>Too many matches, specify another filter</p>
  }

  if (selectedCountry) {
    return <Country country={selectedCountry} />
  }

  if (countries.length > 1) {
    return (
      <div>
        {countries.map(country => (
          <p key={country.cca3}>
            {country.name.common}
            <button onClick={() => onShow(country)}>
              show
            </button>
          </p>
        ))}
      </div>
    )
  }

  if (countries.length === 1) {
    return <Country country={countries[0]} />
  }

  return null
}

export default Countries
