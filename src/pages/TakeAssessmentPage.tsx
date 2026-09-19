import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StudentPostAssessmentSurveyModal from '../components/StudentPostAssessmentSurveyModal'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export const TakeAssessmentPage: React.FC = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)

  const sampleQuestions = [
    {
      stem: 'If f(x) = 2x^2 - 3x + 5, what is the value of f(3)?',
      options: ['14', '20', '26', '32'],
      correct: 0,
    },
    {
      stem: 'Solve for x: \\log_2(x + 4) = 3',
      options: ['2', '4', '8', '12'],
      correct: 1,
    },
  ]

  const handleNext = () => {
    if (currentIdx < sampleQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedAnswer(null)
    } else {
      setIsSurveyOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500">
            Question {currentIdx + 1} of {sampleQuestions.length}
          </span>
          <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Time Remaining: 38:45
          </span>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
            {sampleQuestions[currentIdx].stem}
          </h3>
        </div>

        <div className="space-y-2.5">
          {sampleQuestions[currentIdx].options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedAnswer(i)}
              className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition ${
                selectedAnswer === i
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="inline-block w-6 font-bold text-slate-400">
                {String.fromCharCode(65 + i)}.
              </span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            disabled={selectedAnswer === null}
            onClick={handleNext}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
          >
            <span>{currentIdx < sampleQuestions.length - 1 ? 'Next Question' : 'Complete Assessment'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <StudentPostAssessmentSurveyModal
        attemptId={attemptId || 'sample-attempt'}
        isOpen={isSurveyOpen}
        onComplete={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
        onSkip={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
      />
    </div>
  )
}

export default TakeAssessmentPage
