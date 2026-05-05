import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { clientJourney } from '#/journeys/client-details/journey.js'

export default createForgePackage({
  journey: clientJourney,
})