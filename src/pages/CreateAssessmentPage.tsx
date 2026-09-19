import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { ArrowLeft, Save } from 'lucide-react'

export const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(45)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/admin/assessments')
  }

  return (
    <AdminLayout
      title="Create New Assessment"
      subtitle="Configure diagnostic parameters and modular assessment sections"
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/assessments')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-700">Assessment Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grade 10 Comprehensive Algebra Diagnostic"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Time Limit (minutes)</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Create Assessment</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}

export default CreateAssessmentPage
