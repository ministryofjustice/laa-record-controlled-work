import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { feedbackJourney } from '#/journeys/test-journey/journey.js'

export default createForgePackage({
  journey: feedbackJourney,
})