import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { Plus, FileText, ChevronRight, Clock, Users } from 'lucide-react'

export const AssessmentsPage: React.FC = () => {
  const [assessments] = useState([
    {
      id: 'diagnostic-algebra-1',
      title: 'High School Algebra I Benchmark Diagnostic',
      level: 'Grade 9-10',
      questionsCount: 25,
      timeLimitMinutes: 45,
      attemptsCount: 142,
    },
    {
      id: 'pre-calculus-readiness',
      title: 'Pre-Calculus & Functions Readiness Evaluation',
      level: 'Grade 11-12',
      questionsCount: 30,
      timeLimitMinutes: 60,
      attemptsCount: 89,
    },
    {
      id: 'geometry-mid-year',
      title: 'Geometric Proofs and Congruence Diagnostic',
      level: 'Grade 10',
      questionsCount: 20,
      timeLimitMinutes: 40,
      attemptsCount: 56,
    },
  ])

  return (
    <AdminLayout
      title="Assessments"
      subtitle="Manage diagnostic assessments, time limits, and delivery modes"
      actions={
        <Link
          to="/admin/assessments/new"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Assessment</span>
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((a) => (
          <div
            key={a.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {a.level}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.timeLimitMinutes} mins
                </span>
              </div>
              <h3 className="mt-2.5 text-sm font-semibold text-slate-900">{a.title}</h3>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {a.questionsCount} items
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {a.attemptsCount} completed
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to={`/admin/assessments/${a.id}/results`}
                  className="text-xs text-slate-500 hover:text-blue-600 transition"
                >
                  View Analytics
                </Link>
                <Link
                  to={`/assessment/${a.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                  title="Experience this diagnostic test from the student viewpoint"
                >
                  <span>Student Live Preview</span>
                </Link>
              </div>
              <Link
                to={`/admin/assessments/${a.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Configure <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

export default AssessmentsPage
