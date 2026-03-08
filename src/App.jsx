import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BackgroundMusic from './components/BackgroundMusic'
import LoadingScreen from './components/LoadingScreen'
import DuelModeLoading from './components/DuelModeLoading'
import Home from './pages/Home'
import Game from './pages/Game'
import CharacterSelect from './pages/CharacterSelect'
import Duel from './pages/Duel'

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Only show initial loading if starting at home page
    if (location.pathname === '/') {
      setIsInitialLoading(true)
    } else {
      setIsInitialLoading(false)
    }
  }, [])

  const handleLoadingComplete = () => {
    setIsInitialLoading(false)
  }

  if (isInitialLoading && location.pathname === '/') {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />
  }

  return (
    <>
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/duel-loading" element={<DuelModeLoading />} />
        <Route path="/character-select" element={<CharacterSelect />} />
        <Route path="/duel" element={<Duel />} />
      </Routes>
    </>
  )
}

export default App
