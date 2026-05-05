import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { splitJourney } from '#/journeys/split/journey.js'
import { PatternEffectsImplementations } from '#/journeys/effects.js'

export default createForgePackage({
  journey: splitJourney,
  functions: {
    ...PatternEffectsImplementations
  }
})