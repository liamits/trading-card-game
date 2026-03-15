import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')

    if (!token) {
      navigate('/login')
      setStatus('redirect')
      return
    }

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('unauthorized')
        setStatus('ok')
      })
      .catch(() => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        navigate('/login')
        setStatus('redirect')
      })
  }, [])

  if (status === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8b949e',
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        gap: '12px'
      }}>
        <div style={{
          width: '20px', height: '20px',
          border: '2px solid rgba(138,180,248,0.2)',
          borderTopColor: '#8ab4f8',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        Đang xác thực...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'redirect') return null

  return children
}
