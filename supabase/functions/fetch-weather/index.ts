import { createClient } from 'npm:@supabase/supabase-js@2'

// Cabeceras de seguridad para permitir peticiones desde el navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Manejar la petición preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')
    if (!OPENWEATHER_API_KEY) throw new Error('Falta la API Key')

    const { city } = await req.json()
    if (!city) throw new Error('Debes enviar una ciudad')

    const encodedCity = encodeURIComponent(city)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`

    const response = await fetch(url)
    
    // Si OpenWeather falla, devolvemos un error claro
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenWeather: ${errorData.message}`)
    }
    
    const data = await response.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase
      .from('weather')
      .upsert({
        city: city, 
        temperature: data.main.temp,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        icon_code: data.weather[0].icon,
      }, { onConflict: 'city' })

    if (error) throw error

    return new Response(JSON.stringify({ message: `Clima de ${city} actualizado` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})