import React from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { ArrowLeft, Plus } from 'lucide-react'

export const ModuleQuestionsPage: React.FC = () => {
  const { assessmentId, moduleId } = useParams()

  return (
    <AdminLayout
      title={`Module Management: ${moduleId}`}
      subtitle={`Configure question assignments for assessment ${assessmentId}`}
      actions={
        <Link
          to={`/admin/assessments/${assessmentId}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Assessment</span>
        </Link>
      }
    >
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-500">
          Module question pool configuration. Questions can be assigned from the curriculum question bank.
        </p>
      </div>
    </AdminLayout>
  )
}

export default ModuleQuestionsPage
