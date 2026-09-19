import React from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  FileText,
  HelpCircle,
  FolderTree,
  Sliders,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const AdminDashboardPage: React.FC = () => {
  const cards = [
    {
      title: 'Post-Assessment Surveys & Action Plans',
      description: 'Manage diagnostic reflection questions and personalized growth action plans.',
      path: '/admin/survey-action-plans',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: 'New Feature',
    },
    {
      title: 'Assessment Catalog',
      description: 'Design adaptive math diagnostics, timed benchmarks, and module evaluations.',
      path: '/admin/assessments',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Question Bank',
      description: 'Manage taxonomy-aligned items, answer choices, and mathematical explanations.',
      path: '/admin/questions',
      icon: HelpCircle,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Curriculum Taxonomy',
      description: 'Explore hierarchical domains, standards, clusters, and objective trees.',
      path: '/admin/taxonomy',
      icon: FolderTree,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      title: 'Levels & Courses',
      description: 'Configure grade bands, pacing thresholds, and difficulty scoring curves.',
      path: '/admin/levels',
      icon: Sliders,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Diagnostic Reports Demo',
      description: 'Review comprehensive student analytics, domain mastery, and review cards.',
      path: '/report/demo-attempt',
      icon: TrendingUp,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ]

  return (
    <AdminLayout
      title="Diagnostic Platform Administration"
      subtitle="Overview of your diagnostic assessments, curricular taxonomy, and student action workflows"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.path}
                to={c.path}
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${c.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {c.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-blue-600">
                  <span>Open Management</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick status banner */}
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 to-indigo-50/70 p-5 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              System Ready & Fully Synchronized
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Taxonomy trees, post-assessment reflection surveys, and personalized multi-week action
              plans are actively linked. Access the new Survey & Action Plan admin tab to customize
              student diagnostic workflows.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
