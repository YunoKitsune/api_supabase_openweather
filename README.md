# Dashboard del Clima - Práctica 1

## Link del despliegue del proyecto:
## https://api-supabase-openweather.onrender.com/

Este proyecto es una aplicación web tipo *dashboard* que consume datos meteorológicos. Fue desarrollado como parte de la práctica de consumo de APIs y persistencia de datos.

## Arquitectura del Proyecto (Requisitos de la práctica)
Para cumplir con los requisitos de la asignación, el flujo de datos **no** es directo del navegador a OpenWeather. La arquitectura implementada es la siguiente:

1. **Proceso de Carga (Supabase Edge Function):** Una función alojada en Supabase recibe el nombre de una ciudad, consulta la API pública de OpenWeather, procesa los datos y los guarda en la base de datos de Supabase.
2. **Base de Datos (Supabase PostgreSQL):** Almacena el clima actual de las ciudades buscadas, evitando la redundancia mediante la actualización de registros (`upsert`).
3. **Consumo de Datos (Frontend en React):** La interfaz web consulta **exclusivamente** la base de datos de Supabase para mostrar la información. No realiza peticiones directas a OpenWeather.
4. **Autenticación (OAuth):** Implementación de inicio de sesión social utilizando Google y GitHub a través de Supabase Auth.

## Tecnologías Utilizadas
* **Frontend:** React, Vite, CSS puro.
* **Backend / Base de Datos:** Supabase (PostgreSQL, Edge Functions con Deno, Auth).
* **API Externa:** OpenWeather API.
* **Despliegue:** Render (Static Site).

## Características
- [x] Búsqueda de ciudades en tiempo real.
- [x] Visualización en tarjetas (temperatura, humedad, viento, icono).
- [x] Indicador de carga y manejo de errores (ciudad no encontrada).
- [x] Diseño responsivo y adaptado a modo oscuro.
- [x] Autenticación de usuarios con Google y GitHub.

## Instalación y Ejecución Local

Si deseas correr este proyecto en tu propia computadora:

1. Clona este repositorio:
   ```bash
    git clone https://github.com/YunoKitsune/api_supabase_openweather.git
   ```

2. Entra a la carpeta del frontend e instala las dependencias:
  ```bash
    cd clima-frontend
    npm install
  ```

3. Configura las variables de entorno. Crea un archivo .env.local en la carpeta clima-frontend con el siguiente contenido:
   ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_publishable_key_de_supabase
   ```

4. Inicia el servidor de desarrollo:
  ```bash
    npm run dev
  ```

5. Abre http://localhost:5173 en tu navegador.

## Notas sobre la configuración en Supabase

* La carpeta **supabase/functions/fetch-weather** contiene el código de TypeScript (Deno) de la Edge Function que se comunica con OpenWeather.

* Para que la función funcione, se requiere configurar el secreto **OPENWEATHER_API_KEY** en el panel de Supabase.

* La tabla **weather** cuenta con políticas de seguridad (RLS) que permiten la lectura pública y escritura por parte de la Edge Function.
