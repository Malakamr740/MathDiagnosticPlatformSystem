import React from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { ArrowLeft, Plus, Folder, Clock, FileText } from 'lucide-react'

export const AssessmentDetailPage: React.FC = () => {
  const { assessmentId } = useParams()

  return (
    <AdminLayout
      title={`Assessment Configuration: ${assessmentId || 'Diagnostic'}`}
      subtitle="Organize assessment modules, section weights, and delivery rules"
      actions={
        <Link
          to="/admin/assessments"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Assessments</span>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Diagnostic Modules</h3>
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="h-4 w-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Module 1: Core Algebra Foundations</h4>
                  <p className="text-[11px] text-slate-500">12 questions • 20 minutes</p>
                </div>
              </div>
              <Link
                to={`/admin/assessments/${assessmentId}/modules/mod-1`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Manage Questions
              </Link>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="h-4 w-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Module 2: Advanced Reasoning & Geometry</h4>
                  <p className="text-[11px] text-slate-500">13 questions • 25 minutes</p>
                </div>
              </div>
              <Link
                to={`/admin/assessments/${assessmentId}/modules/mod-2`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Manage Questions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AssessmentDetailPage
