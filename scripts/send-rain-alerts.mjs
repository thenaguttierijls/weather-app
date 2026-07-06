import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = join(__dirname, 'rain-alerts.config.json')

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const RESEND_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'onboarding@resend.dev'

const WMO_LABEL = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm',
}

export function shouldAlert(daily, thresholds) {
  const precipMm = Number(daily?.precipitation_sum ?? 0)
  const weatherCode = Number(daily?.weather_code ?? 0)
  const meetsPrecip = precipMm >= thresholds.precipMmMin
  const meetsStorm = thresholds.thunderstormCodes.includes(weatherCode)
  return { fire: meetsPrecip || meetsStorm, meetsPrecip, meetsStorm, precipMm, weatherCode }
}

export function buildEmail(city, daily, decision) {
  const label = WMO_LABEL[decision.weatherCode] ?? 'unsettled weather'
  const highC = Math.round(Number(daily.temperature_2m_max ?? 0))
  const lowC = Math.round(Number(daily.temperature_2m_min ?? 0))
  const precipPct = Math.round(Number(daily.precipitation_probability_max ?? 0))
  const precipMm = decision.precipMm.toFixed(1)
  const subject = decision.meetsStorm
    ? `Storms expected in ${city.name} today`
    : `Rain expected in ${city.name} today`
  const text = [
    `Heads up for ${city.name}${city.country ? ', ' + city.country : ''} today:`,
    ``,
    `Conditions: ${label}`,
    `Rain total: ${precipMm} mm`,
    `Rain chance: ${precipPct}%`,
    `Temp: ${lowC}° / ${highC}° C`,
    ``,
    decision.meetsStorm ? 'Watch for storms.' : 'Grab an umbrella.',
  ].join('\n')
  return { subject, text }
}

async function fetchForecast(city) {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lng),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    timezone: city.timezone,
    forecast_days: '1',
  })
  const url = `${OPEN_METEO_URL}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const data = await res.json()
  const daily = data?.daily
  if (!daily) throw new Error('Open-Meteo response missing daily data')
  return {
    weather_code: daily.weather_code?.[0],
    temperature_2m_max: daily.temperature_2m_max?.[0],
    temperature_2m_min: daily.temperature_2m_min?.[0],
    precipitation_sum: daily.precipitation_sum?.[0],
    precipitation_probability_max: daily.precipitation_probability_max?.[0],
  }
}

async function sendEmail({ apiKey, to, subject, text }) {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status} ${body}`)
  }
  return res.json()
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  const alertEmail = process.env.ALERT_EMAIL
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  if (!alertEmail) throw new Error('ALERT_EMAIL is not set')

  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'))
  const daily = await fetchForecast(config.city)
  const decision = shouldAlert(daily, config.thresholds)

  if (!decision.fire) {
    console.log(`No alert for ${config.city.name} — no qualifying rain/storms (precip ${decision.precipMm}mm, code ${decision.weatherCode}).`)
    return
  }

  const { subject, text } = buildEmail(config.city, daily, decision)
  await sendEmail({ apiKey, to: alertEmail, subject, text })
  console.log(`Alert sent for ${config.city.name}: ${subject}`)
}

// Only run when invoked directly (not on import for tests)
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('send-rain-alerts.mjs')) {
  main().catch((err) => {
    console.error('rain-alerts failed:', err)
    process.exit(1)
  })
}
