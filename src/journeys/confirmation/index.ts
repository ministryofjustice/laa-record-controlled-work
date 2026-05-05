import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { confirmationJourney } from '#/journeys/confirmation/journey.js'

export default createForgePackage({
  journey: confirmationJourney,
})