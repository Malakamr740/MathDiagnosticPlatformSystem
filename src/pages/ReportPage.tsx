import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { TaxonomyTree } from '../components/Reports/TaxonomyTree'
import QuestionReviewCard from '../components/Reports/QuestionReviewCard'
import DomainCard from '../components/Reports/DomainCard'
import TimeAnalysisSection from '../components/Reports/TimeAnalysisSection'
import ThreeStateDonutChart from '../components/Reports/ThreeStateDonutChart'
import { exportElementToPDF } from '../lib/pdfExport'
import {
  STRONG_DOMAIN_THRESHOLD,
  MODERATE_DOMAIN_THRESHOLD,
  TIME_SLOW_THRESHOLD_PCT,
  computeDomainPerformance,
  computeTimeAnalysis,
  computeThreeStateSummary,
} from '../lib/diagnosticAnalytics'
import type { CourseItem, QuestionReviewItem, ReportData, TaxonomyType } from '../components/Reports/Types'

// Configurable thresholds for domain mastery classification
export const CONFIG_STRONG_THRESHOLD = STRONG_DOMAIN_THRESHOLD // 75%
export const CONFIG_MODERATE_THRESHOLD = MODERATE_DOMAIN_THRESHOLD // 50%
export const CONFIG_TIME_SLOW_THRESHOLD = TIME_SLOW_THRESHOLD_PCT // 25%

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export default function ReportPage() {
  const { attemptId } = useParams()
  const [searchParams] = useSearchParams()
  const resumeToken = searchParams.get('token')

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ type: TaxonomyType; label: string } | null>(null)

  // PDF & Email delivery states
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{
    state: 'idle' | 'sending' | 'success' | 'error'
    message?: string
  }>({ state: 'idle' })

  const questionsRef = useRef<HTMLDivElement>(null)
  const reportContainerRef = useRef<HTMLDivElement>(null)
  const hasAutoProcessedRef = useRef(false)

  useEffect(() => {
    async function load() {
      if (!attemptId || !resumeToken) {
        setErrorMessage('This diagnostic link is missing required authentication tokens.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_attempt_report', {
        p_attempt_id: attemptId,
        p_resume_token: resumeToken,
      })

      if (error || !data) {
        setErrorMessage(
          error?.message?.includes('not yet available')
            ? 'Your diagnostic assessment results are currently compiling. Please refresh in a moment.'
            : 'Diagnostic report not found or expired.'
        )
        setLoading(false)
        return
      }

      setReport(data as ReportData)
      setLoading(false)
    }

    load()
  }, [attemptId, resumeToken])

  // Analytics computations
  const analytics = useMemo(() => {
    if (!report) return null

    const domainPerf = computeDomainPerformance(
      report,
      CONFIG_STRONG_THRESHOLD,
      CONFIG_MODERATE_THRESHOLD
    )

    const timeAnalysis = computeTimeAnalysis(
      report.questions,
      report.overall.avg_time_per_question,
      CONFIG_TIME_SLOW_THRESHOLD
    )

    const threeState = computeThreeStateSummary(report.questions)

    const studentInfo = report.student_info
    const reg = studentInfo.registration_responses || {}
    const studentName =
      (reg.full_name as string) ||
      (reg.name as string) ||
      (reg.student_name as string) ||
      'Student'

    const studentEmail =
      (reg.email as string) ||
      (reg.student_email as string) ||
      (reg.parent_email as string) ||
      null

    return {
      domainPerf,
      timeAnalysis,
      threeState,
      studentName,
      studentEmail,
      completedLabel: studentInfo.completed_at
        ? new Date(studentInfo.completed_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Today',
      durationLabel: formatTime(studentInfo.total_time_seconds),
      avgTime: report.overall.avg_time_per_question,
      conceptualErrors: Math.max(
        0,
        report.overall.incorrect_count -
          report.overall.rushed_mistakes_count -
          report.overall.timesink_mistakes_count
      ),
    }
  }, [report])

  // Auto-download as PDF and trigger email delivery once report is ready
  useEffect(() => {
    if (!report || !analytics || hasAutoProcessedRef.current) return

    // Small delay to ensure all KaTeX equations and fonts render completely before capture
    const timer = setTimeout(() => {
      if (hasAutoProcessedRef.current) return
      hasAutoProcessedRef.current = true
      handleExportAndEmail(false)
    }, 1200)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, analytics])

  async function handleExportAndEmail(isUserInitiated = true) {
    if (!reportContainerRef.current || !analytics || !report) return

    setPdfGenerating(true)
    const sanitizedStudentName = analytics.studentName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const sanitizedExamName = report.student_info.assessment_name.replace(/[^a-zA-Z0-9_-]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Report_${sanitizedStudentName}_${sanitizedExamName}_${dateStr}.pdf`

    try {
      // Generate PDF (and auto-download to disk)
      const exportResult = await exportElementToPDF({
        element: reportContainerRef.current,
        filename,
        autoDownload: true,
      })

      // If student or parent email is provided, dispatch email via Supabase edge function
      if (analytics.studentEmail) {
        setEmailStatus({
          state: 'sending',
          message: `Sending diagnostic PDF report to ${analytics.studentEmail}...`,
        })

        try {
          const { error: fnError } = await supabase.functions.invoke('send-report-email', {
            body: {
              attemptId: report.student_info.attempt_id,
              recipientEmail: analytics.studentEmail,
              pdfBase64: exportResult.base64,
              studentName: analytics.studentName,
              assessmentName: report.student_info.assessment_name,
              scorePercentage: report.overall.percentage,
            },
          })

          if (fnError) {
            console.warn('Email dispatch notice:', fnError)
            setEmailStatus({
              state: 'error',
              message: `PDF saved locally. (Email delivery to ${analytics.studentEmail} could not be completed).`,
            })
          } else {
            setEmailStatus({
              state: 'success',
              message: `Report successfully downloaded and emailed to ${analytics.studentEmail}`,
            })
          }
        } catch (emailErr) {
          console.warn('Edge function invoke error:', emailErr)
          setEmailStatus({
            state: 'error',
            message: `PDF saved locally. (Email delivery could not be completed).`,
          })
        }
      } else if (isUserInitiated) {
        setEmailStatus({
          state: 'success',
          message: 'Diagnostic PDF report generated and downloaded.',
        })
      }
    } catch (err) {
      console.error('PDF export error:', err)
      if (isUserInitiated) {
        window.print()
      }
    } finally {
      setPdfGenerating(false)
    }
  }

  const visibleQuestions = useMemo(() => {
    if (!report) return []
    if (!filter) return report.questions
    return report.questions.filter((q: QuestionReviewItem) => {
      switch (filter.type) {
        case 'category':
          return q.category_name === filter.label
        case 'lesson':
          return q.lesson_name === filter.label
        case 'skill':
          return q.skill_name === filter.label
        case 'difficulty':
          return q.difficulty === filter.label.toLowerCase()
        default:
          return true
      }
    })
  }, [report, filter])

  function handleSelectTaxonomy(type: TaxonomyType, label: string) {
    setFilter((prev) => (prev && prev.type === type && prev.label === label ? null : { type, label }))
    questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-600 border-t-transparent" />
          <p className="text-sm font-medium">Generating comprehensive diagnostic report…</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !report || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Diagnostic report unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Return to Assessments
          </Link>
        </div>
      </div>
    )
  }

  const { student_info, overall, breakdowns, questions, courses, org_settings } = report
  const { domainPerf, timeAnalysis, threeState, studentName, completedLabel, durationLabel, avgTime } =
    analytics

  return (
    <div className="print-page min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky Header Toolbar (no-print) */}
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {org_settings?.org_name || 'Diagnostic Performance Assessment'}
            </div>
            <div className="text-xs text-slate-500">
              Student Diagnostic Evaluation · {student_info.assessment_name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportAndEmail(true)}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Print
            </button>
          </div>
        </div>

        {/* Email delivery & notification bar */}
        {emailStatus.state !== 'idle' && (
          <div
            className={`px-4 py-2 text-xs font-medium border-t ${
              emailStatus.state === 'sending'
                ? 'bg-blue-50 text-blue-800 border-blue-100'
                : emailStatus.state === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-100'
            }`}
          >
            <div className="mx-auto max-w-5xl flex items-center justify-between">
              <span>{emailStatus.message}</span>
              <button
                onClick={() => setEmailStatus({ state: 'idle' })}
                className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Printable Content Container */}
      <div ref={reportContainerRef} className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-6 sm:p-8 text-white shadow-floating">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wider text-white/80">
              Student Diagnostic Evaluation
            </div>
            {overall.level?.name && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                Tier: {overall.level.name}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">{studentName}</h1>
          <p className="mt-1 text-sm sm:text-base text-white/85">
            {student_info.assessment_name} · Completed {completedLabel}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroMetric label="Overall Score" value={`${overall.percentage}%`} />
            <HeroMetric label="Classification" value={overall.level?.name || 'Assessed'} />
            <HeroMetric label="Total Duration" value={durationLabel} />
            <HeroMetric label="Questions Assessed" value={`${questions.length}`} />
          </div>
        </section>

        {/* Three-State Question Classification Donut & Breakdown */}
        <section>
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Scoring & Response Status</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Breakdown of questions answered correctly, incorrectly, or left unanswered
            </p>
          </div>
          <ThreeStateDonutChart
            correctCount={threeState.correctCount}
            incorrectCount={threeState.incorrectCount}
            unansweredCount={threeState.unansweredCount}
            total={threeState.total}
          />
        </section>

        {/* Strong Domains Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  ✓
                </span>
                <h2 className="text-lg font-semibold text-slate-900">Strong Domains</h2>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Taxonomy areas demonstrating high mastery (accuracy &ge; {CONFIG_STRONG_THRESHOLD}%)
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {domainPerf.strongDomains.length}{' '}
              {domainPerf.strongDomains.length === 1 ? 'Domain' : 'Domains'}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {domainPerf.strongDomains.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No domains currently exceed the {CONFIG_STRONG_THRESHOLD}% strong threshold. Targeted
                practice will help build your first mastery domain.
              </div>
            ) : (
              domainPerf.strongDomains.map((domain) => (
                <DomainCard key={domain.domainId} domain={domain} type="strong" />
              ))
            )}
          </div>
        </section>

        {/* Weak Domains Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  !
                </span>
                <h2 className="text-lg font-semibold text-slate-900">Weak Domains (Focus Areas)</h2>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Taxonomy areas needing prioritized reinforcement (accuracy &lt; {CONFIG_MODERATE_THRESHOLD}%)
              </p>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
              {domainPerf.weakDomains.length}{' '}
              {domainPerf.weakDomains.length === 1 ? 'Focus Area' : 'Focus Areas'}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {domainPerf.weakDomains.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-6 text-center text-sm text-emerald-800">
                Excellent baseline! No domains scored below the {CONFIG_MODERATE_THRESHOLD}% threshold.
              </div>
            ) : (
              domainPerf.weakDomains.map((domain) => (
                <DomainCard key={domain.domainId} domain={domain} type="weak" />
              ))
            )}
          </div>
        </section>

        {/* Time Analysis Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TimeAnalysisSection timeAnalysis={timeAnalysis} />
        </section>

        {/* Taxonomy Hierarchy Tree */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Taxonomy & Curriculum Breakdown"
            subtitle="Explore your curriculum hierarchy — tap any category or skill to filter corresponding questions"
          />
          <div className="mt-4">
            <TaxonomyTree breakdowns={breakdowns} onSelect={handleSelectTaxonomy} activeFilter={filter} />
          </div>
        </section>

        {/* Diagnostic Behavior & Mistake Types */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Error Pattern Diagnosis"
            subtitle="Distinguishing conceptual gaps from pacing and careless errors"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <ErrorChip
              label="Conceptual Gaps"
              count={analytics.conceptualErrors}
              tone="bg-rose-100 text-rose-700"
            />
            <ErrorChip
              label="Rushed Mistakes (<25s)"
              count={overall.rushed_mistakes_count}
              tone="bg-amber-100 text-amber-700"
            />
            <ErrorChip
              label="Timesink Mistakes (>100s)"
              count={overall.timesink_mistakes_count}
              tone="bg-sky-100 text-sky-700"
            />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Of {overall.incorrect_count} incorrect answers, {analytics.conceptualErrors} reflect
            conceptual difficulty, {overall.rushed_mistakes_count} were rushed carelessly, and{' '}
            {overall.timesink_mistakes_count} were lost to overthinking past 100 seconds.
          </p>
        </section>

        {/* Question-by-Question Detailed Review */}
        <section
          ref={questionsRef}
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              title="Question Review & Solutions"
              subtitle={
                filter
                  ? `Filtered by ${filter.type}: ${filter.label}`
                  : 'Detailed step-by-step diagnostic solutions for each question'
              }
            />
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="no-print rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {visibleQuestions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No questions match this filter criteria.
              </p>
            ) : (
              visibleQuestions.map((q: QuestionReviewItem) => (
                <QuestionReviewCard
                  key={q.question_id}
                  question={q}
                  index={questions.indexOf(q)}
                  avgTime={avgTime}
                  highlight={!!filter}
                />
              ))
            )}
          </div>
        </section>

        {/* Actionable Recommendations & Courses */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Prescriptive Study Recommendations"
            subtitle="Tailored next steps based on your diagnostic results"
          />
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            {overall.level?.recommendation ||
              'Continue with the structured curriculum pathway, focusing primarily on the identified weak domains.'}
          </p>
          {courses.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {courses.map((c: CourseItem) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <p className="mt-1 text-sm text-slate-600">
                    {c.description || 'Recommended remediation and practice course.'}
                  </p>
                  {c.registration_url && (
                    <a
                      href={c.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:underline"
                    >
                      Enroll in Course &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
      <div className="text-xs font-medium uppercase tracking-wide text-white/70">{label}</div>
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

function ErrorChip({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${tone}`}>
      {label}: {count}
    </span>
  )
}
