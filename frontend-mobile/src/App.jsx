import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage    from './pages/LoginPage'
import TaskListPage from './pages/TaskListPage'
import ReviewPage   from './pages/ReviewPage'

function AppInner() {
  const { auth, login, logout } = useAuth()
  const [review, setReview] = useState(null) // { sc, task } | null

  if (!auth) {
    return <LoginPage onLogin={login} />
  }

  if (review) {
    return (
      <ReviewPage
        sc={review.sc}
        task={review.task}
        onBack={() => setReview(null)}
        onDone={() => setReview(null)}
      />
    )
  }

  return (
    <TaskListPage
      onReview={(sc, task) => setReview({ sc, task })}
      onLogout={logout}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
