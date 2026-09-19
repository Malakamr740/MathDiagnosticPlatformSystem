import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DomainCard from '../components/Reports/DomainCard'
import TimeAnalysisSection from '../components/Reports/TimeAnalysisSection'
import ThreeStateDonutChart from '../components/Reports/ThreeStateDonutChart'
import {
  STRONG_DOMAIN_THRESHOLD,
  MODERATE_DOMAIN_THRESHOLD,
  TIME_SLOW_THRESHOLD_PCT,
  computeDomainPerformance,
  computeTimeAnalysis,
  computeThreeStateSummary,
} from '../lib/diagnosticAnalytics'
import type { QuestionReviewItem, ReportData } from '../components/Reports/Types'

interface RegistrationField {
  id: string
  label: string
  field_key: string
  display_order: number
}

interface AttemptRow {
  id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
  attempt_results: {
    percentage: number
    correct_count: number
    total_questions: number
    level: { name: string } | null
  } | null
  registration_responses: {
    responses: Record<string, unknown>
  } | null
}

export default function AssessmentResultsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()

  const [assessmentName, setAssessmentName] = useState('')
  const [fields, setFields] = useState<RegistrationField[]>([])
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [questions, setQuestions] = useState<QuestionReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'attempts' | 'domains' | 'timing'>('attempts')
  const [selectedStudentAttemptId, setSelectedStudentAttemptId] = useState<string | null>(null)
  const [studentReportData, setStudentReportData] = useState<ReportData | null>(null)
  const [studentReportLoading, setStudentReportLoading] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId])

  async function fetchData() {
    if (!assessmentId) return
    setLoading(true)

    const { data: assessment } = await supabase
      .from('assessments')
      .select('name, organization_id')
      .eq('id', assessmentId)
      .single()

    if (!assessment) {
      setError('Could not load this assessment.')
      setLoading(false)
      return
    }
    setAssessmentName(assessment.name)

    const { data: fieldData } = await supabase
      .from('registration_fields')
      .select('id, label, field_key, display_order')
      .eq('organization_id', assessment.organization_id)
      .order('display_order')

    setFields(fieldData ?? [])

    const { data: attemptData, error: attemptError } = await supabase
      .from('attempts')
      .select(
        `
        id, status, started_at, completed_at,
        attempt_results ( percentage, correct_count, total_questions, level:levels ( name ) ),
        registration_responses ( responses )
      `
      )
      .eq('assessment_id', assessmentId)
      .order('started_at', { ascending: false })

    if (attemptError) {
      setError(attemptError.message)
      setLoading(false)
      return
    }

    const loadedAttempts = (attemptData as unknown as AttemptRow[]) ?? []
    setAttempts(loadedAttempts)

    // Load questions associated with this assessment's modules
    const { data: moduleData } = await supabase
      .from('modules')
      .select('id')
      .eq('assessment_id', assessmentId)

    if (moduleData && moduleData.length > 0) {
      const moduleIds = moduleData.map((m) => m.id)
      const { data: mqData } = await supabase
        .from('module_questions')
        .select(`
          question_id,
          questions (
            id,
            difficulty,
            category_id,
            skill_id,
            categories:category_id ( name ),
            skills:skill_id ( name )
          )
        `)
        .in('module_id', moduleIds)

      if (mqData) {
        // Fetch all answers for these attempts to compute cohort analytics
        const attemptIds = loadedAttempts.map((a) => a.id)
        let answersData: Array<{
          attempt_id: string
          question_id: string
          is_correct: boolean | null
          status: string | null
          time_spent_seconds: number
        }> = []

        if (attemptIds.length > 0) {
          const { data: ans } = await supabase
            .from('student_answers')
            .select('attempt_id, question_id, is_correct, status, time_spent_seconds')
            .in('attempt_id', attemptIds)

          answersData = ans ?? []
        }

        // Aggregate answers per question for cohort reporting
        const qItems: QuestionReviewItem[] = []
        for (const raw of mqData as any[]) {
          const q = raw.questions
          if (!q) continue

          const relatedAnswers = answersData.filter((a) => a.question_id === q.id)
          const isCorrect =
            relatedAnswers.length > 0
              ? relatedAnswers.filter((a) => a.is_correct === true).length >=
                relatedAnswers.length / 2
              : false

          const avgTime =
            relatedAnswers.length > 0
              ? Math.round(
                  relatedAnswers.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0) /
                    relatedAnswers.length
                )
              : 0

          qItems.push({
            question_id: q.id,
            content_blocks: [],
            explanation_blocks: [],
            difficulty: q.difficulty || 'medium',
            answer_type_code: 'MCQ',
            points_possible: 1,
            points_earned: isCorrect ? 1 : 0,
            is_correct: isCorrect,
            time_spent_seconds: avgTime,
            student_answer: {},
            category_name: q.categories?.name || 'General Mathematics',
            lesson_name: null,
            skill_name: q.skills?.name || null,
            choices: [],
          })
        }
        setQuestions(qItems)
      }
    }

    setLoading(false)
  }

  // Load individual student report when selected
  async function loadStudentDomainProfile(attemptId: string) {
    setSelectedStudentAttemptId(attemptId)
    setStudentReportLoading(true)

    const { data, error } = await supabase.rpc('get_admin_attempt_report', {
      p_attempt_id: attemptId,
    })

    if (!error && data) {
      setStudentReportData(data as ReportData)
    }
    setStudentReportLoading(false)
  }

  function studentLabel(attempt: AttemptRow): string {
    const responses = attempt.registration_responses?.responses
    if (!responses || fields.length === 0) return '(No registration data)'
    return (
      fields
        .slice(0, 2)
        .map((f) => responses[f.field_key])
        .filter((v) => v !== undefined && v !== null && v !== '')
        .join(' · ') || '(Unnamed)'
    )
  }

  function statusBadge(status: AttemptRow['status']) {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-800',
      in_progress: 'bg-amber-100 text-amber-800',
      abandoned: 'bg-slate-200 text-slate-700',
    }
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  // Cohort analytics
  const cohortAnalytics = useMemo(() => {
    if (questions.length === 0) return null

    const mockReport: ReportData = {
      student_info: {
        attempt_id: 'cohort',
        assessment_name: assessmentName,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_time_seconds: 0,
        registration_responses: {},
      },
      overall: {
        total_questions: questions.length,
        correct_count: questions.filter((q) => q.is_correct).length,
        incorrect_count: questions.filter((q) => !q.is_correct).length,
        points_earned: 0,
        points_possible: questions.length,
        percentage:
          questions.length > 0
            ? Math.round(
                (questions.filter((q) => q.is_correct).length / questions.length) * 100
              )
            : 0,
        calculated_at: new Date().toISOString(),
        avg_time_per_question:
          questions.length > 0
            ? Math.round(
                questions.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0) /
                  questions.length
              )
            : 0,
        avg_time_correct: 0,
        avg_time_incorrect: 0,
        rushed_mistakes_count: 0,
        timesink_mistakes_count: 0,
        level: null,
      },
      breakdowns: [],
      questions,
      courses: [],
      org_settings: null,
    }

    const domainPerf = computeDomainPerformance(
      mockReport,
      STRONG_DOMAIN_THRESHOLD,
      MODERATE_DOMAIN_THRESHOLD
    )

    const timeAnalysis = computeTimeAnalysis(
      questions,
      mockReport.overall.avg_time_per_question,
      TIME_SLOW_THRESHOLD_PCT
    )

    const threeState = computeThreeStateSummary(questions)

    return { domainPerf, timeAnalysis, threeState }
  }, [questions, assessmentName])

  // Individual student domain analytics
  const studentAnalytics = useMemo(() => {
    if (!studentReportData) return null
    return computeDomainPerformance(
      studentReportData,
      STRONG_DOMAIN_THRESHOLD,
      MODERATE_DOMAIN_THRESHOLD
    )
  }, [studentReportData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-600">Loading assessment results...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center max-w-md shadow-xs">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <Link
            to="/admin/assessments"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Back to Assessments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to={`/admin/assessments/${assessmentId}`} className="text-xs font-medium text-primary-600 hover:underline">
              &larr; Back to Assessment Details
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {assessmentName} — Diagnostic Results
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {attempts.length} total attempt(s) recorded across the cohort
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('attempts')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'attempts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attempts ({attempts.length})
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'domains'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cohort Domains
            </button>
            <button
              onClick={() => setActiveTab('timing')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'timing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timing Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Cohort Metric Overview Cards */}
        {cohortAnalytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Attempts
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{attempts.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Strong Domains
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">
                {cohortAnalytics.domainPerf.strongDomains.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Focus Areas (Weak)
              </div>
              <div className="mt-1 text-2xl font-bold text-rose-600">
                {cohortAnalytics.domainPerf.weakDomains.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Questions Analyzed
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{questions.length}</div>
            </div>
          </div>
        )}

        {/* Tab 1: Attempts List */}
        {activeTab === 'attempts' && (
          <div className="space-y-4">
            {attempts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-600">No attempts have been recorded for this assessment yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Student Attempts</h3>
                  <span className="text-xs text-slate-500">Tap "View Profile" to inspect student domains</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Completed</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{studentLabel(attempt)}</td>
                          <td className="px-4 py-3">{statusBadge(attempt.status)}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {attempt.attempt_results
                              ? `${attempt.attempt_results.percentage}% (${attempt.attempt_results.correct_count}/${attempt.attempt_results.total_questions})`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {attempt.attempt_results?.level?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {attempt.completed_at
                              ? new Date(attempt.completed_at).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => loadStudentDomainProfile(attempt.id)}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Domain Profile
                            </button>
                            {attempt.attempt_results && (
                              <Link
                                to={`/admin/attempts/${attempt.id}`}
                                className="inline-block rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                              >
                                Full Report &rarr;
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cohort Domain Mastery Analysis */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            {cohortAnalytics ? (
              <>
                {/* Cohort Strong Domains */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Cohort Strong Domains</h3>
                      <p className="text-xs text-slate-500">
                        Domains achieving &ge; {STRONG_DOMAIN_THRESHOLD}% accuracy across all completed questions
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      {cohortAnalytics.domainPerf.strongDomains.length} Domains
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {cohortAnalytics.domainPerf.strongDomains.map((domain) => (
                      <DomainCard key={domain.domainId} domain={domain} type="strong" />
                    ))}
                    {cohortAnalytics.domainPerf.strongDomains.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2 py-4 text-center">
                        No domains reached the {STRONG_DOMAIN_THRESHOLD}% threshold yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Cohort Weak Domains */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Cohort Focus Areas (Weak)</h3>
                      <p className="text-xs text-slate-500">
                        Domains below {MODERATE_DOMAIN_THRESHOLD}% accuracy needing instructional reinforcement
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                      {cohortAnalytics.domainPerf.weakDomains.length} Domains
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {cohortAnalytics.domainPerf.weakDomains.map((domain) => (
                      <DomainCard key={domain.domainId} domain={domain} type="weak" />
                    ))}
                    {cohortAnalytics.domainPerf.weakDomains.length === 0 && (
                      <p className="text-xs text-emerald-700 col-span-2 py-4 text-center">
                        All domains are currently above the {MODERATE_DOMAIN_THRESHOLD}% benchmark!
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Insufficient data to compute domain statistics.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Timing Analysis */}
        {activeTab === 'timing' && cohortAnalytics && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <TimeAnalysisSection timeAnalysis={cohortAnalytics.timeAnalysis} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Response State Distribution</h3>
              <ThreeStateDonutChart
                correctCount={cohortAnalytics.threeState.correctCount}
                incorrectCount={cohortAnalytics.threeState.incorrectCount}
                unansweredCount={cohortAnalytics.threeState.unansweredCount}
                total={cohortAnalytics.threeState.total}
              />
            </div>
          </div>
        )}

        {/* Slide-over or Modal: Individual Student Domain Profile */}
        {selectedStudentAttemptId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Student Domain Diagnostic Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Attempt: {selectedStudentAttemptId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudentAttemptId(null)
                    setStudentReportData(null)
                  }}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              {studentReportLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading student domain breakdown…
                </div>
              ) : studentAnalytics ? (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                      <div className="text-xs font-semibold text-emerald-800 uppercase">Strong Domains</div>
                      <div className="mt-1 text-xl font-bold text-emerald-700">
                        {studentAnalytics.strongDomains.length}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center">
                      <div className="text-xs font-semibold text-rose-800 uppercase">Focus Areas (Weak)</div>
                      <div className="mt-1 text-xl font-bold text-rose-700">
                        {studentAnalytics.weakDomains.length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Strong Domains</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {studentAnalytics.strongDomains.map((d) => (
                        <DomainCard key={d.domainId} domain={d} type="strong" />
                      ))}
                      {studentAnalytics.strongDomains.length === 0 && (
                        <p className="text-xs text-slate-500 col-span-2">None identified.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Weak Domains</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {studentAnalytics.weakDomains.map((d) => (
                        <DomainCard key={d.domainId} domain={d} type="weak" />
                      ))}
                      {studentAnalytics.weakDomains.length === 0 && (
                        <p className="text-xs text-emerald-700 col-span-2">No weak domains.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                    <Link
                      to={`/admin/attempts/${selectedStudentAttemptId}`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
                    >
                      Open Complete Attempt Report &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Could not load student domain data.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
