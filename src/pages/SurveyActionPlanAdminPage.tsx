import React, { useState } from 'react'
import type {
  SurveyQuestion,
  ActionPlan,
  ActionPlanMilestone,
} from '../lib/surveyService'
import { surveyService } from '../lib/surveyService'
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  RefreshCw,
  ListOrdered,
  X,
  Eye,
} from 'lucide-react'

export const SurveyActionPlanAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'plans'>('questions')
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => surveyService.getQuestions())
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(() => surveyService.getActionPlans())

  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)

  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

  // Live Student Experience Preview State
  const [isStudentPreviewOpen, setIsStudentPreviewOpen] = useState(false)
  const [previewSimulatedScore, setPreviewSimulatedScore] = useState<number>(65)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  const [previewSubmitted, setPreviewSubmitted] = useState(false)

  const handleSaveQuestion = (q: SurveyQuestion) => {
    let updated: SurveyQuestion[]
    if (questions.some((item) => item.id === q.id)) {
      updated = questions.map((item) => (item.id === q.id ? q : item))
    } else {
      updated = [...questions, { ...q, order_index: questions.length }]
    }
    setQuestions(updated)
    surveyService.saveQuestions(updated)
    setIsQuestionModalOpen(false)
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this survey question?')) return
    const updated = questions.filter((q) => q.id !== id)
    setQuestions(updated)
    surveyService.saveQuestions(updated)
  }

  const handleResetQuestions = () => {
    if (!window.confirm('Reset all survey questions to the default diagnostic template?')) return
    const def = surveyService.resetQuestions()
    setQuestions(def)
  }

  const handleSavePlan = (plan: ActionPlan) => {
    let updated: ActionPlan[]
    if (actionPlans.some((p) => p.id === plan.id)) {
      updated = actionPlans.map((p) => (p.id === plan.id ? plan : p))
    } else {
      updated = [...actionPlans, plan]
    }
    setActionPlans(updated)
    surveyService.saveActionPlans(updated)
    setIsPlanModalOpen(false)
    setEditingPlan(null)
  }

  const handleDeletePlan = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this action plan?')) return
    const updated = actionPlans.filter((p) => p.id !== id)
    setActionPlans(updated)
    surveyService.saveActionPlans(updated)
  }

  const handleResetPlans = () => {
    if (!window.confirm('Reset all action plans to the default templates?')) return
    const def = surveyService.resetActionPlans()
    setActionPlans(def)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Post-Assessment Surveys & Action Plans
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Generic & Dynamic
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Configure the follow-up survey students see after finishing an assessment and craft customized,
            multi-phase action roadmaps matched to their score and survey responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPreviewAnswers({})
              setPreviewSubmitted(false)
              setIsStudentPreviewOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Student Live Preview</span>
          </button>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'questions'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              Survey Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'plans'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Action Plans ({actionPlans.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Students answer these questions after completing their exam to determine the best Action Plan.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetQuestions}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion({
                    id: `q_${Date.now()}`,
                    prompt: '',
                    description: '',
                    type: 'single_choice',
                    required: true,
                    order_index: questions.length,
                    category: 'study_habits',
                    options: [
                      { id: `opt_${Date.now()}_1`, label: 'Option 1', value: 'opt_1' },
                      { id: `opt_${Date.now()}_2`, label: 'Option 2', value: 'opt_2' },
                    ],
                  })
                  setIsQuestionModalOpen(true)
                }}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="btn-primary inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                    {idx + 1}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{q.prompt}</h4>
                      {q.required && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                          Required
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>
                    {q.description && (
                      <p className="text-xs text-slate-500">{q.description}</p>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {q.options.map((opt) => (
                          <span
                            key={opt.id}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                          >
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(q)
                      setIsQuestionModalOpen(true)
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                    title="Edit question"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Action plans are dynamically assigned based on survey answers and diagnostic score tiers.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPlans}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPlan({
                    id: `plan_${Date.now()}`,
                    title: 'New Custom Action Plan',
                    tagline: 'Custom roadmap summary',
                    summary: 'Detailed explanation of why this plan fits the student.',
                    target_audience: 'Custom target group',
                    badge_color: 'blue',
                    min_score: 0,
                    max_score: 100,
                    milestones: [
                      {
                        title: 'Phase 1: Diagnosis & Quick Wins',
                        timeframe: 'Weeks 1-2',
                        description: 'Foundational baseline repairs.',
                        tasks: ['Analyze error log', 'Complete 30 practice problems'],
                      },
                    ],
                    weekly_routine: [
                      { day_group: 'Monday-Thursday', focus: 'Daily practice', suggested_hours: '2 Hours' },
                    ],
                    prescriptive_advice: ['Review wrong answers daily.'],
                    recommended_resources: ['Diagnostic bank', 'Desmos calculator'],
                  })
                  setIsPlanModalOpen(true)
                }}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="btn-primary inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Action Plan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
                        Score Band: {plan.min_score ?? 0}% – {plan.max_score ?? 100}%
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{plan.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(plan)
                          setIsPlanModalOpen(true)
                        }}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-600 line-clamp-2">
                    {plan.tagline}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-3">
                    {plan.summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {plan.milestones?.length || 0} Phased Milestones
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {plan.weekly_routine?.length || 0} Routine Blocks
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    Target: <span className="text-slate-600 font-medium">{plan.target_audience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {questions.some((q) => q.id === editingQuestion.id) ? 'Edit Survey Question' : 'Add Survey Question'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Question Prompt *</label>
                <input
                  type="text"
                  value={editingQuestion.prompt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  placeholder="e.g. When is your official test date?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Subtitle</label>
                <input
                  type="text"
                  value={editingQuestion.description || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                  placeholder="e.g. Helps us tailor your study roadmap."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingQuestion.category || 'study_habits'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="timeline">Timeline & Deadlines</option>
                    <option value="study_habits">Study Habits & Hours</option>
                    <option value="challenges">Obstacles & Challenges</option>
                    <option value="confidence">Target Score & Confidence</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingQuestion.required}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">Required question</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Answer Options ({editingQuestion.options?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const opts = editingQuestion.options || []
                      const newId = `opt_${Date.now()}`
                      setEditingQuestion({
                        ...editingQuestion,
                        options: [...opts, { id: newId, label: 'New Option', value: newId }],
                      })
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {editingQuestion.options?.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const updated = [...(editingQuestion.options || [])]
                          updated[idx] = { ...opt, label: e.target.value, value: opt.value || e.target.value }
                          setEditingQuestion({ ...editingQuestion, options: updated })
                        }}
                        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingQuestion.options?.filter((_, i) => i !== idx)
                          setEditingQuestion({ ...editingQuestion, options: updated })
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingQuestion.prompt.trim()}
                onClick={() => handleSaveQuestion(editingQuestion)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="btn-primary rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {actionPlans.some((p) => p.id === editingPlan.id) ? 'Edit Action Plan' : 'Create Action Plan'}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Plan Title *</label>
                <input
                  type="text"
                  value={editingPlan.title}
                  onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                  placeholder="e.g. Strategic 3-Month Score Optimizer"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catchy Tagline</label>
                <input
                  type="text"
                  value={editingPlan.tagline}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                  placeholder="Short one-line headline"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Summary Explanation</label>
                <textarea
                  rows={3}
                  value={editingPlan.summary}
                  onChange={(e) => setEditingPlan({ ...editingPlan, summary: e.target.value })}
                  placeholder="Explain why this plan matches the student's test results..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Diagnostic Score (%)</label>
                  <input
                    type="number"
                    value={editingPlan.min_score ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, min_score: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Diagnostic Score (%)</label>
                  <input
                    type="number"
                    value={editingPlan.max_score ?? 100}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_score: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={editingPlan.target_audience}
                    onChange={(e) => setEditingPlan({ ...editingPlan, target_audience: e.target.value })}
                    placeholder="e.g. Test in 2-3 months"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Roadmap Milestones ({editingPlan.milestones.length})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newMilestone: ActionPlanMilestone = {
                        title: `Phase ${editingPlan.milestones.length + 1}`,
                        timeframe: 'Weeks 1-2',
                        description: 'Milestone goals',
                        tasks: ['Task 1', 'Task 2'],
                      }
                      setEditingPlan({ ...editingPlan, milestones: [...editingPlan.milestones, newMilestone] })
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Add Milestone Phase
                  </button>
                </div>

                <div className="space-y-3">
                  {editingPlan.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...editingPlan.milestones]
                            updated[mIdx] = { ...m, title: e.target.value }
                            setEditingPlan({ ...editingPlan, milestones: updated })
                          }}
                          placeholder="Phase Title"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={m.timeframe}
                          onChange={(e) => {
                            const updated = [...editingPlan.milestones]
                            updated[mIdx] = { ...m, timeframe: e.target.value }
                            setEditingPlan({ ...editingPlan, milestones: updated })
                          }}
                          placeholder="Timeframe"
                          className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingPlan.milestones.filter((_, i) => i !== mIdx)
                            setEditingPlan({ ...editingPlan, milestones: updated })
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => {
                          const updated = [...editingPlan.milestones]
                          updated[mIdx] = { ...m, description: e.target.value }
                          setEditingPlan({ ...editingPlan, milestones: updated })
                        }}
                        placeholder="Phase Description / Focus"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingPlan.title.trim()}
                onClick={() => handleSavePlan(editingPlan)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="btn-primary rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
              >
                Save Action Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Student Experience Preview Modal */}
      {isStudentPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">
                  Student Live Experience: Post-Assessment Survey & Action Plan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Simulation Bar */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Simulate Student Exam Score:</span>
                <span className="font-bold text-blue-700">{previewSimulatedScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={previewSimulatedScore}
                onChange={(e) => {
                  setPreviewSimulatedScore(Number(e.target.value))
                  setPreviewSubmitted(false)
                }}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Support Tier (&lt;50%)</span>
                <span>Moderate Tier (50%-75%)</span>
                <span>Mastery Tier (&gt;75%)</span>
              </div>
            </div>

            {!previewSubmitted ? (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Post-Assessment Self-Reflection
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your answers help calibrate your custom study roadmap.
                  </p>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                        <p className="font-semibold text-slate-800">{q.prompt}</p>
                      </div>

                      {q.type === 'scale' && (
                        <div className="flex gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: val })}
                              className={`w-9 h-9 rounded-xl font-bold text-xs transition select-none ${
                                previewAnswers[q.id] === val
                                  ? 'bg-blue-600 text-white shadow-xs scale-105'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}

                      {(q.type === 'single_choice' || q.type === 'multiple_choice') && q.options && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.options.map((opt, oi) => {
                            const isChosen = previewAnswers[q.id] === opt.label
                            return (
                              <button
                                key={oi}
                                type="button"
                                onClick={() =>
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: opt.label })
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition select-none ${
                                  isChosen
                                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {q.type === 'text' && (
                        <textarea
                          rows={2}
                          value={previewAnswers[q.id] || ''}
                          onChange={(e) =>
                            setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                          }
                          placeholder="Type your reflection here..."
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-hidden"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewSubmitted(true)}
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
                  >
                    <span>Submit Reflection & Preview Matched Action Plan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Generated Personalized Action Roadmap
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewSubmitted(false)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    ← Back to Survey
                  </button>
                </div>

                {(() => {
                  const matched =
                    actionPlans.find(
                      (p) =>
                        previewSimulatedScore >= (p.min_score ?? 0) &&
                        previewSimulatedScore <= (p.max_score ?? 100)
                    ) || actionPlans[0]

                  if (!matched) return null

                  return (
                    <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-linear-to-b from-indigo-50/50 to-white space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {matched.target_audience || 'Target Plan'} ({matched.min_score ?? 0}% -{' '}
                          {matched.max_score ?? 100}%)
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{matched.tagline}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{matched.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {matched.summary}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Action Roadmap Milestones:
                        </span>
                        {matched.milestones.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs space-y-1"
                          >
                            <div className="font-semibold text-slate-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                  {mIdx + 1}
                                </span>
                                <span>{m.title}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {m.timeframe}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                              {m.description}
                            </p>
                            {m.tasks && m.tasks.length > 0 && (
                              <ul className="list-disc list-inside text-[11px] text-slate-600 pl-6 space-y-0.5 mt-1">
                                {m.tasks.map((task, ti) => (
                                  <li key={ti}>{task}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SurveyActionPlanAdminPage
