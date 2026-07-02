import { Button } from '@/components/ui/button'
import { useUnitStore } from '@/stores/useUnitStore'

export function UnitToggle() {
  const unit = useUnitStore((state) => state.unit)
  const toggleUnit = useUnitStore((state) => state.toggleUnit)

  const isImperial = unit === 'imperial'
  const currentLabel = isImperial ? '°F' : '°C'
  const ariaLabel = isImperial ? 'Switch to Celsius' : 'Switch to Fahrenheit'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleUnit}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {currentLabel}
    </Button>
  )
}
