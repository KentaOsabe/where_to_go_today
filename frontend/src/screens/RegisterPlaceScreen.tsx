import type { RegisterPlaceState } from '../hooks/useRegisterPlace'
import { HeroSection } from '../components/HeroSection'
import { PlaceForm } from '../components/PlaceForm'

type RegisterPlaceScreenProps = {
  registerState: RegisterPlaceState
  onNavigateToDuplicate: (placeId: number) => void
}

export const RegisterPlaceScreen = ({
  registerState,
  onNavigateToDuplicate,
}: RegisterPlaceScreenProps) => {
  const {
    formState,
    errors,
    isSubmitting,
    submitError,
    duplicatePlaceId,
    handleChange,
    handleSubmit,
  } = registerState

  return (
    <main className="layout">
      <HeroSection />
      <PlaceForm
        formState={formState}
        errors={errors}
        isSubmitting={isSubmitting}
        submitError={submitError}
        duplicatePlaceId={duplicatePlaceId}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onNavigateToDuplicate={onNavigateToDuplicate}
      />
    </main>
  )
}
