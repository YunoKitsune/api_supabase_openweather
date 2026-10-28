import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  // --- Estados del Catálogo ---
  const [countries, setCountries] = useState([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- Estados de Autenticación ---
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Autenticación
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // --- Lógica de Autenticación ---
  const handleLoginGithub = async () => await supabase.auth.signInWithOAuth(
    { provider: 'github',
      options: { redirectTo: window.location.origin }
     }
  )
  const handleLoginGoogle = async () => await supabase.auth.signInWithOAuth(
    { provider: 'google',
      options: { redirectTo: window.location.origin } 
     }
  )
  const handleLogout = async () => await supabase.auth.signOut()

  // --- Lógica del Catálogo ---
  const fetchCountries = async () => {
    setLoading(true)
    let query = supabase.from('countries').select('*').order('name')

    if (search) query = query.ilike('name', `%${search}%`)
    if (region) query = query.eq('region', region)

    const { data, error } = await query
    if (error) console.error(error)
    else setCountries(data)
    setLoading(false)
  }

  // Se ejecuta cada vez que cambia la búsqueda o el filtro
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCountries()
    }, 300) // Pequeño retraso para no saturar Supabase mientras se escribe
    return () => clearTimeout(delayDebounceFn)
  }, [search, region])

  return (
    <div className="app-container">
      
      {/* SECCIÓN DE LOGIN */}
      <div className="auth-section">
        {!session ? (
          <div className="login-buttons">
            <p>Inicia sesión con Github o Google:</p>
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

      <h1>Explorador de Países</h1>

      {/* CONTROLES DE BÚSQUEDA */}
      <div className="controls">
        <input 
          type="text" 
          placeholder="Buscar país..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Todos los continentes</option>
          <option value="Americas">América</option>
          <option value="Europe">Europa</option>
          <option value="Asia">Asia</option>
          <option value="Africa">África</option>
          <option value="Oceania">Oceanía</option>
        </select>
      </div>

      {/* GRID DE TARJETAS */}
      {loading ? <p className="loading">Cargando catálogo...</p> : (
        <div className="grid">
          {countries.length > 0 ? countries.map(country => (
            <div 
              key={country.name} 
              className="card" 
              onClick={() => setSelectedCountry(country)}
            >
              {country.flag_url ? (
                <img src={country.flag_url} alt={`Bandera de ${country.name}`} />
              ) : (
                <div className="no-flag">Aún sin bandera</div>
              )}
              <h3>{country.name}</h3>
              <p>Continente: {country.region}</p>
            </div>
          )) : <p>No se encontraron países con esos filtros.</p>}
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {selectedCountry && (
        <div className="modal-overlay" onClick={() => setSelectedCountry(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedCountry.flag_url} alt="Bandera" />
            <h2>{selectedCountry.name}</h2>
            <div className="modal-details">
              <p><strong>Capital:</strong> {selectedCountry.capital}</p>
              <p><strong>Región:</strong> {selectedCountry.region}</p>
              <p><strong>Población:</strong> {selectedCountry.population.toLocaleString()}</p>
            </div>
            <button onClick={() => setSelectedCountry(null)}>Cerrar</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App