import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { EditPlaceScreen } from './screens/EditPlaceScreen'
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

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/places" replace />} />
        <Route path="/places" element={<PlacesListScreen />} />
        <Route path="/places/:id/edit" element={<EditPlaceScreen />} />
        <Route path="/places/:id" element={<PlaceDetailScreen />} />
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
