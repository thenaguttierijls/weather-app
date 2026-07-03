import { getWmoInfo } from '@/lib/wmoCodes'

interface GradientInput {
  weatherCode: number
  isDay: boolean
}

export const HERO_GRADIENT_DEFAULT =
  'bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700'

const SUNNY_DAY = 'bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600'
const SUNNY_NIGHT = 'bg-gradient-to-br from-brand-800 via-brand-900 to-slate-950'
const CLOUDY_DAY = 'bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700'
const CLOUDY_NIGHT = 'bg-gradient-to-br from-brand-800 via-brand-900 to-slate-900'
const RAINY_DAY = 'bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900'
const RAINY_NIGHT = 'bg-gradient-to-br from-slate-800 via-brand-900 to-slate-950'
const SNOWY_DAY = 'bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500'
const SNOWY_NIGHT = 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900'
const STORMY_DAY = 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900'
const STORMY_NIGHT = 'bg-gradient-to-br from-slate-900 via-brand-900 to-black'

export function getHeroGradient({ weatherCode, isDay }: GradientInput): string {
  const info = getWmoInfo(weatherCode, isDay)

  if (info.isStormy) return isDay ? STORMY_DAY : STORMY_NIGHT
  if (info.isSnowy) return isDay ? SNOWY_DAY : SNOWY_NIGHT
  if (info.isRainy) return isDay ? RAINY_DAY : RAINY_NIGHT
  if (info.isSunny) return isDay ? SUNNY_DAY : SUNNY_NIGHT
  if (info.isCloudy) return isDay ? CLOUDY_DAY : CLOUDY_NIGHT

  return HERO_GRADIENT_DEFAULT
}
