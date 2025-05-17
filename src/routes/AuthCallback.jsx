// src/routes/AuthCallback.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { handleRedirect } from '../oauth-handler'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    // once location.search is populated, exchange the code
    handleRedirect()
      .then((success) => {
        if (success) {
          // push into your SPA root (remember: HashRouter will keep the #/)
          navigate('/', { replace: true })
        } else {
          // you can render an error if token exchange failed
          console.error('OAuth token exchange failed')
        }
      })
  }, [navigate, search])

  // while we’re waiting for the POST to /token…
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Completing login…</h1>
      <p>If you're not redirected, that's unfortunate. Check the console for errors and reach out to Scotho if ya need me.</p>
    </div>
  )
}
