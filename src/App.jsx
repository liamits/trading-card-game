import { Routes, Route, useLocation } from 'react-router-dom'
import BackgroundMusic from './components/BackgroundMusic'
import DuelModeLoading from './components/DuelModeLoading'
import Home from './pages/Home'
import Game from './pages/Game'
import CharacterSelect from './pages/CharacterSelect'
import Duel from './pages/Duel'
import CardSearch from './pages/CardSearch'
import Admin from './pages/Admin'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const location = useLocation()

  return (
    <>
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cards" element={<CardSearch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/game" element={<Game />} />
        <Route path="/duel-loading" element={<DuelModeLoading />} />
        <Route path="/character-select" element={<CharacterSelect />} />
        <Route path="/duel" element={<Duel />} />
      </Routes>
    </>
  )
}

export default App
