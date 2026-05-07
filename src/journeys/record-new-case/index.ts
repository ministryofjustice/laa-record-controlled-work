import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { newCaseJourney } from '#/journeys/record-new-case/journey.js'
import { PatternEffectsImplementations } from '#/journeys/effects.js'

export default createForgePackage({
  journey: newCaseJourney,
  functions: {
    ...PatternEffectsImplementations
  }
})