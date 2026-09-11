import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import LoginForm from './components/LoginForm'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <main>
      <h1>Mini ATS</h1>

      <p>Logged in as {session.user.email}</p>

      <button onClick={handleLogout}>
        Log out
      </button>
    </main>
  )
}

export default App