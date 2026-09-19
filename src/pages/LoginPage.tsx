import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@mathplatform.edu')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email)
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
            ∑
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          Math Diagnostic Studio
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sign in to access admin tools, question banks, and analytics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden transition"
              >
                Access Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
