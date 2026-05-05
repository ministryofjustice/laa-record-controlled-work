import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { splitJourney } from '#/journeys/split/journey.js'

export default createForgePackage({
  journey: splitJourney,
})