import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { PlaceDetailScreen } from './screens/PlaceDetailScreen'
import { PlacesListScreen } from './screens/PlacesListScreen'
import { RegisterPlaceScreen } from './screens/RegisterPlaceScreen'
import { useRegisterPlace } from './hooks/useRegisterPlace'

function App() {
  const navigate = useNavigate()
  const registerState = useRegisterPlace({
    onSuccess: (place) => {
      navigate('/places')
    },
  })

  const handleNavigateToDuplicate = (placeId: number) => {
    navigate(`/places/${placeId}`)
  }

  const handleBackToRegister = () => {
    registerState.resetFeedback()
    navigate('/register')
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/places" replace />} />
        <Route path="/places" element={<PlacesListScreen />} />
        <Route
          path="/places/:id"
          element={<PlaceDetailScreen onBackToForm={handleBackToRegister} />}
        />
        <Route
          path="/register"
          element={
            <RegisterPlaceScreen
              registerState={registerState}
              onNavigateToDuplicate={handleNavigateToDuplicate}
            />
          }
        />
        <Route path="*" element={<Navigate to="/places" replace />} />
      </Routes>
    </div>
  )
}

export default App
