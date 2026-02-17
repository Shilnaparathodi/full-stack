import { useState, useEffect } from 'react'
import axios from 'axios'

const Country = ({ country }) => {

  const [weather, setWeather] = useState(null)

  const api_key = import.meta.env.VITE_WEATHER_KEY
  const capital = country.capital[0]

  useEffect(() => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${capital}&appid=${api_key}&units=metric`

    axios
      .get(url)
      .then(response => {
        setWeather(response.data)
      })
      .catch(error => {
        console.log("Weather API error:", error)
      })

  }, [capital, api_key])

  return (
    <div>
      <h1>{country.name.common}</h1>

      <p>Capital: {capital}</p>
      <p>Area: {country.area}</p>

      <h2>Languages</h2>
      <ul>
        {Object.values(country.languages).map((language, index) => (
          <li key={index}>{language}</li>
        ))}
      </ul>

      <img
        src={country.flags.png}
        alt="flag"
        width="200"
      />

      {weather && (
        <div>
          <h2>Weather in {capital}</h2>
          <p>Temperature: {weather.main.temp} °C</p>
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt="weather icon"
          />
          <p>Wind: {weather.wind.speed} m/s</p>
        </div>
      )}

    </div>
  )
}

export default Country
