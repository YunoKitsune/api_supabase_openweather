import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    //Obtener la API Key desde los secretos
    const RESTCOUNTRIES_API_KEY = Deno.env.get('RESTCOUNTRIES_API_KEY');
    if (!RESTCOUNTRIES_API_KEY) throw new Error('Falta la API Key de REST Countries')

    //Variables para traer los países.
    let allCountries: any[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    // 1. Bucle para traer todos los países (paginación automática)
    while (hasMore) {
      //Construimos y hacemos la petición a REST Countries
      const url = `https://api.restcountries.com/countries/v5?limit=${limit}&offset=${offset}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${RESTCOUNTRIES_API_KEY}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      //Si la respuesta no es "ok" decimos el error
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error de REST Countries (v5): ${errorText}`)
      }
      //Si al respuesta es "ok" guardamos la respuesta.
      const apiResponse = await response.json()

      // Extraemos la lista de países de la respuesta (v5)
      const countriesBatch = apiResponse.data?.objects || []

      // Si la API devuelve una lista vacía, significa que ya no hay más países
      if (countriesBatch.length === 0) {
        hasMore = false
      } else {
        // Acumulamos los países de esta página
        allCountries = [...allCountries, ...countriesBatch]
        offset += limit
      }
    }

    if (allCountries.length === 0) {
      throw new Error('No se pudo obtener ningún país de la API.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Formatear los datos (v5)
    const formattedCountries = allCountries.map((country: any) => ({
      name: country.names?.common,
      region: country.region,
      flag_url: country.flag?.url_png,
      capital: country.capitals?.[0]?.name || 'Sin capital',
      population: country.population
    })).filter((c: any) => c.name != null)

    // 3. Guardar todo en Supabase (Upsert)
    const { error } = await supabase
      .from('countries')
      .upsert(formattedCountries, { onConflict: 'name' })

    if (error) throw error

    return new Response(JSON.stringify({ message: `¡Éxito! Se cargaron ${formattedCountries.length} países en total.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})