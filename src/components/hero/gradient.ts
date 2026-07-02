import { getWmoInfo } from '@/lib/wmoCodes'

interface GradientInput {
  weatherCode: number
  isDay: boolean
}

export const HERO_GRADIENT_DEFAULT =
  'bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700'

const SUNNY_DAY = 'bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600'
const SUNNY_NIGHT = 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900'
const CLOUDY = 'bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700'
const RAINY = 'bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900'
const SNOWY = 'bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500'
const STORMY = 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900'

export function getHeroGradient({ weatherCode, isDay }: GradientInput): string {
  const info = getWmoInfo(weatherCode, isDay)

  if (info.isStormy) return STORMY
  if (info.isSnowy) return SNOWY
  if (info.isRainy) return RAINY
  if (info.isSunny) return isDay ? SUNNY_DAY : SUNNY_NIGHT
  if (info.isCloudy) return CLOUDY

  return HERO_GRADIENT_DEFAULT
}
