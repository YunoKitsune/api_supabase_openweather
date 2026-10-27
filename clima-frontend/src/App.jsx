import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState('Ciudad de Mexico')
  const [searchInput, setSearchInput] = useState('')


  // 1. Nuevo estado para guardar la sesión del usuario
  const [session, setSession] = useState(null)

  // 2. Efecto para escuchar si el usuario inicia o cierra sesión
  useEffect(() => {
    // Obtener la sesión actual al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escuchar cambios en la autenticación (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Funciones de Login y Logout
  const handleLoginGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  const handleLoginGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const [errorMsg, setErrorMsg] = useState('')

  // Función para leer de Supabase
  const fetchWeatherFromDB = async (cityName) => {
    setLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase
      .from('weather')
      .select('*')
      .ilike('city', cityName)
      .single()
    
    if (error) {
      // Si la ciudad no está en la BD, mostramos error
      setErrorMsg(`No se encontraron datos para "${cityName}". Verifica el nombre.`)
      setWeather(null)
    } else {
      setWeather(data)
    }
    setLoading(false)
  }

  // Función que llama a tu Edge Function para actualizar/insertar la ciudad
  const updateWeather = async (cityName) => {
    setLoading(true)
    setErrorMsg('')
    // URL del Edge Function
    try {
      const functionUrl = 'https://puwhbcjfbulxklokkwlc.supabase.co/functions/v1/fetch-weather'
    
      const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ city: cityName })
        })

        // Si OpenWeather no encuentra la ciudad, la función devuelve error
        if (!response.ok) {
          throw new Error('Ciudad no encontrada')
        }
    
        // Después de actualizar, leemos de la BD
        fetchWeatherFromDB(cityName)
        } catch (error) {
          setErrorMsg(`No pudimos encontrar el clima de "${cityName}". Revisa la ortografía.`)
          setWeather(null)
          setLoading(false)
        }
      }

  useEffect(() => {
    fetchWeatherFromDB(city)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput) {
      setCity(searchInput)
      updateWeather(searchInput)
    }
  }

  return (
    <div className="dashboard">

      {/*Sección de Autenticación en la parte superior */}
      <div className="auth-section">
        {!session ? (
          <div className="login-buttons">
            <p>Inicia sesión para usar la app:</p>
            <button onClick={handleLoginGithub}>Login con GitHub</button>
            <button onClick={handleLoginGoogle} style={{ marginLeft: '10px', backgroundColor: '#db4437' }}>Login con Google</button>
          </div>
        ) : (
          <div className="user-info">
            <p>Bienvenido, {session.user.email}</p>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626' }}>Cerrar Sesión</button>
          </div>
        )}
      </div>

      <h1>Dashboard del Clima</h1>
      
      <form onSubmit={handleSearch} className="search-bar">
        <input 
          type="text" 
          placeholder="Buscar ciudad..." 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

            {/* Muestra el error si existe */}
        {errorMsg && <p style={{ color: '#ef4444', marginTop: '10px' }}>{errorMsg}</p>}

            {loading ? (
        <p className="loading">Cargando clima...</p>
      ) : weather ? (
        <div className="weather-card">
          <h2>{weather.city}</h2>
          <img 
            src={`https://openweathermap.org/img/wn/${weather.icon_code}@2x.png`} 
            alt="Icono del clima" 
          />
          <p className="temp">{weather.temperature} °C</p>
          <p className="desc">{weather.description}</p>
          <div className="details">
            <p>Humedad: {weather.humidity}%</p>
            <p>Viento: {weather.wind_speed} m/s</p>
          </div>
        </div>
      ) : (
        !errorMsg && <p>No se encontraron datos para esta ciudad.</p>
      )}
    </div>
  )
}

export default App