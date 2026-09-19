import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react'

export const StudentAssessmentPage: React.FC = () => {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const [studentName, setStudentName] = useState('')

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/take/attempt-${Date.now()}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            ∑
          </div>
          <h2 className="text-lg font-bold text-slate-900 pt-2">Diagnostic Mathematics Assessment</h2>
          <p className="text-xs text-slate-500">Assessment Code: {assessmentId || 'Standard'}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Time Allowed: 45 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>Format: 25 Multiple Choice Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Instant domain breakdown & post-assessment growth plan</span>
          </div>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Enter Your Full Name</label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <span>Begin Diagnostic</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default StudentAssessmentPage
