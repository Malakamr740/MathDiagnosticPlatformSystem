import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  Calculator,
  Clock,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Lightbulb,
  FileCode,
  Sliders,
  Upload,
  X,
  FileText,
  FolderPlus,
} from 'lucide-react'
import {
  CURRICULUM_TAXONOMY,
  questionBankService,
  QuestionChoice,
  QuestionBankItem,
} from '../lib/questionBankService'

// Quick Math Snippets for instant insertion
const MATH_SNIPPETS = [
  { label: 'x²', latex: 'x^2' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: 'a/b', latex: '\\frac{a}{b}' },
  { label: '±', latex: '\\pm' },
  { label: '≤', latex: '\\le' },
  { label: '≥', latex: '\\ge' },
  { label: 'π', latex: '\\pi' },
  { label: 'θ', latex: '\\theta' },
  { label: 'log_b(x)', latex: '\\log_b(x)' },
  { label: '∫', latex: '\\int' },
  { label: '∑', latex: '\\sum' },
  { label: '∞', latex: '\\infty' },
  { label: 'Δ', latex: '\\Delta' },
  { label: '≠', latex: '\\neq' },
]

export const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate()
  const { questionId } = useParams()
  const isEditing = Boolean(questionId)

  // Question Categorization State (Domain (Unit) -> Chapter -> Lesson)
  const [taxonomyData, setTaxonomyData] = useState<Record<string, any>>(CURRICULUM_TAXONOMY)
  const [domain, setDomain] = useState<string>('Algebra & Functions')
  const [chapter, setChapter] = useState<string>('Quadratic & Polynomial Equations')
  const [lesson, setLesson] = useState<string>('Quadratic Formula & Discriminant Analysis')
  const [collection, setCollection] = useState<string>('General Question Bank')
  const [isCustomChapter, setIsCustomChapter] = useState(false)
  const [isCustomLesson, setIsCustomLesson] = useState(false)

  // Pedagogical & Exam Metadata
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'multi_select' | 'grid_in'>(
    'multiple_choice'
  )
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [calculatorAllowed, setCalculatorAllowed] = useState(false)
  const [estimatedSeconds, setEstimatedSeconds] = useState(90)
  const [targetExam, setTargetExam] = useState('EST 1 / SAT Math')

  // Problem Stem & Media (File upload based)
  const [prompt, setPrompt] = useState(
    'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ will yield exactly one real distinct root?'
  )
  const [imageUrl, setImageUrl] = useState('')
  const [imageFileName, setImageFileName] = useState('')
  const [imageFileSize, setImageFileSize] = useState('')
  const [imageCaption, setImageCaption] = useState('')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Answer Choices for MCQ
  const [choices, setChoices] = useState<QuestionChoice[]>([
    {
      id: 'c1',
      text: '$k = 2$',
      isCorrect: true,
      rationale: 'Discriminant $(-4)^2 - 4(2)(k) = 16 - 8k = 0 \\implies k = 2$.',
    },
    {
      id: 'c2',
      text: '$k = 4$',
      isCorrect: false,
      rationale: 'If $k = 4$, $16 - 32 = -16$ (produces complex roots).',
    },
    {
      id: 'c3',
      text: '$k = -2$',
      isCorrect: false,
      rationale: 'Sign error when applying $-4ac$.',
    },
    {
      id: 'c4',
      text: '$k = 0$',
      isCorrect: false,
      rationale: 'If $k = 0$, the equation becomes $2x^2 - 4x = 0$ with two real roots: $0$ and $2$.',
    },
  ])

  // Numeric Free Response / Grid-in Answer
  const [numericAnswer, setNumericAnswer] = useState('2')
  const [numericTolerance, setNumericTolerance] = useState('0')

  // Detailed Solution & Diagnostic Feedback
  const [explanation, setExplanation] = useState(
    'For a quadratic equation $ax^2 + bx + c = 0$ to possess exactly one distinct real root, its discriminant must be zero:\n\n$$\\Delta = b^2 - 4ac = 0$$\n\nHere, $a = 2$, $b = -4$, and $c = k$.\n\nSubstitute these values:\n$$(-4)^2 - 4(2)(k) = 0$$\n$$16 - 8k = 0$$\n$$8k = 16 \\implies k = 2$$'
  )
  const [commonMisconception, setCommonMisconception] = useState(
    'Students frequently confuse the condition for two distinct real roots ($b^2 - 4ac > 0$) with one real root ($\\Delta = 0$), or forget parentheses when squaring negative $b$: $(-4)^2 = 16$.'
  )

  // Preview interactive state
  const [previewSelectedChoice, setPreviewSelectedChoice] = useState<string | null>(null)
  const [previewMultiSelected, setPreviewMultiSelected] = useState<string[]>([])
  const [previewInputAnswer, setPreviewInputAnswer] = useState('')
  const [showExplanationInPreview, setShowExplanationInPreview] = useState(true)
  const [previewMode, setPreviewMode] = useState<'split' | 'editor' | 'preview'>('split')
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Existing collections list for dropdown
  const [existingCollections, setExistingCollections] = useState<string[]>([])

  // Load existing question if in edit mode
  useEffect(() => {
    const collectionsList = questionBankService.getCollectionsList().map((c) => c.name)
    setExistingCollections(collectionsList)
    const currentTax = questionBankService.getTaxonomy()
    setTaxonomyData(currentTax)

    if (questionId) {
      const existing = questionBankService.getQuestionById(questionId)
      if (existing) {
        setDomain(existing.domain || 'Algebra & Functions')
        setChapter(existing.chapter || 'Quadratic & Polynomial Equations')
        setLesson(existing.lesson || 'Quadratic Formula & Discriminant Analysis')
        setCollection(existing.collection || 'General Question Bank')
        setQuestionType(existing.questionType || 'multiple_choice')
        setDifficulty(existing.difficulty || 'medium')
        setCalculatorAllowed(Boolean(existing.calculatorAllowed))
        setEstimatedSeconds(existing.estimatedSeconds || 90)
        setTargetExam(existing.targetExam || 'EST 1 / SAT Math')
        setPrompt(existing.prompt || '')
        setImageUrl(existing.imageUrl || '')
        setImageCaption(existing.imageCaption || '')
        if (existing.choices && existing.choices.length > 0) {
          setChoices(existing.choices)
        }
        setNumericAnswer(existing.numericAnswer || '')
        setNumericTolerance(existing.numericTolerance || '0')
        setExplanation(existing.explanation || '')
        setCommonMisconception(existing.commonMisconception || '')
      }
    }
  }, [questionId])

  // Update chapters when domain changes
  useEffect(() => {
    if (isCustomChapter) return
    const domainData = taxonomyData[domain] || CURRICULUM_TAXONOMY[domain]
    if (domainData && domainData.chapters.length > 0) {
      const defaultChapter = domainData.chapters[0].name
      setChapter(defaultChapter)
      if (!isCustomLesson && domainData.chapters[0].lessons.length > 0) {
        setLesson(domainData.chapters[0].lessons[0])
      }
    }
  }, [domain, isCustomChapter, isCustomLesson, taxonomyData])

  // Update lessons when chapter changes
  useEffect(() => {
    if (isCustomLesson || isCustomChapter) return
    const domainData = taxonomyData[domain] || CURRICULUM_TAXONOMY[domain]
    const matched = domainData?.chapters.find((c: any) => c.name === chapter)
    if (matched && matched.lessons.length > 0) {
      setLesson(matched.lessons[0])
    }
  }, [chapter, domain, isCustomLesson, isCustomChapter, taxonomyData])

  // Quick Math Snippet Inserter
  const insertMathSnippet = (latex: string) => {
    const textarea = promptTextareaRef.current
    if (!textarea) {
      setPrompt((prev) => prev + ` $${latex}$`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = prompt
    const snippetWithDelimiters = `$${latex}$`
    const updated = currentText.substring(0, start) + snippetWithDelimiters + currentText.substring(end)
    setPrompt(updated)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + snippetWithDelimiters.length, start + snippetWithDelimiters.length)
    }, 50)
  }

  // Choices Management
  const handleAddChoice = () => {
    const nextId = `c${choices.length + 1}-${Date.now()}`
    setChoices([...choices, { id: nextId, text: '', isCorrect: false, rationale: '' }])
  }

  const handleUpdateChoiceText = (id: string, text: string) => {
    setChoices(choices.map((c) => (c.id === id ? { ...c, text } : c)))
  }

  const handleUpdateChoiceRationale = (id: string, rationale: string) => {
    setChoices(choices.map((c) => (c.id === id ? { ...c, rationale } : c)))
  }

  const handleSetCorrectChoice = (id: string) => {
    if (questionType === 'multiple_choice') {
      setChoices(choices.map((c) => ({ ...c, isCorrect: c.id === id })))
    } else {
      setChoices(choices.map((c) => (c.id === id ? { ...c, isCorrect: !c.isCorrect } : c)))
    }
  }

  const handleRemoveChoice = (id: string) => {
    if (choices.length <= 2) {
      alert('A multiple choice question must have at least 2 options.')
      return
    }
    setChoices(choices.filter((c) => c.id !== id))
  }

  // File-based Image Upload Handling
  const handleFileSelected = (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, SVG).')
      return
    }

    // Format size
    const sizeInKb = (file.size / 1024).toFixed(1)
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageUrl(dataUrl)
      setImageFileName(file.name)
      setImageFileSize(sizeStr)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFile(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImageFileName('')
    setImageFileSize('')
    setImageCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Save to Question Bank Service
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      alert('Please enter a question prompt stem.')
      return
    }

    if (questionType === 'multiple_choice' || questionType === 'multi_select') {
      const correctCount = choices.filter((c) => c.isCorrect).length
      if (correctCount === 0) {
        alert('Please mark at least one correct answer key.')
        return
      }
    } else if (questionType === 'grid_in') {
      if (!numericAnswer.trim()) {
        alert('Please specify the accepted numeric answer for this grid-in question.')
        return
      }
    }

    const questionItem: QuestionBankItem = {
      id: questionId || `qb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      collection: collection.trim() || 'General Question Bank',
      domain,
      chapter,
      lesson,
      difficulty,
      questionType,
      calculatorAllowed,
      estimatedSeconds,
      targetExam,
      prompt,
      imageUrl,
      imageCaption,
      choices: questionType === 'grid_in' ? [] : choices,
      numericAnswer: questionType === 'grid_in' ? numericAnswer : undefined,
      numericTolerance: questionType === 'grid_in' ? numericTolerance : undefined,
      explanation,
      commonMisconception,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isEditing && questionId) {
      questionBankService.updateQuestion(questionId, questionItem)
    } else {
      questionBankService.addQuestion(questionItem)
    }

    navigate('/admin/questions')
  }

  // Helper to render math text or LaTeX safely (supports both $$block$$ and $inline$)
  const renderMathSafe = (text: string) => {
    if (!text) return null

    // Split on block math ($$...$$) first
    const blockParts = text.split(/(\$\$[\s\S]+?\$\$)/g)

    return (
      <span>
        {blockParts.map((blockPart, bIdx) => {
          if (blockPart.startsWith('$$') && blockPart.endsWith('$$') && blockPart.length > 4) {
            const math = blockPart.slice(2, -2).trim()
            try {
              return (
                <span key={bIdx} className="block my-2 text-center overflow-x-auto py-1">
                  <BlockMath math={math} />
                </span>
              )
            } catch (err) {
              return (
                <code key={bIdx} className="block text-blue-700 bg-blue-50 p-1.5 rounded my-1 font-mono text-xs">
                  {blockPart}
                </code>
              )
            }
          }

          // Inside text between block math, split by inline math ($...$)
          const inlineParts = blockPart.split(/(\$[^$\n]+?\$)/g)
          return (
            <span key={bIdx}>
              {inlineParts.map((part, index) => {
                if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                  const math = part.slice(1, -1)
                  try {
                    return <InlineMath key={index} math={math} />
                  } catch (err) {
                    return (
                      <code key={index} className="text-blue-700 bg-blue-50 px-1 rounded">
                        {part}
                      </code>
                    )
                  }
                }
                return <span key={index}>{part}</span>
              })}
            </span>
          )
        })}
      </span>
    )
  }

  const currentChapters = (taxonomyData[domain] || CURRICULUM_TAXONOMY[domain])?.chapters || []
  const currentLessons = currentChapters.find((c: any) => c.name === chapter)?.lessons || []

  return (
    <AdminLayout
      title={isEditing ? 'Edit Question' : 'Question Bank: Create Question'}
      subtitle="Categorize by Domain › Chapter › Lesson, attach diagram files, and verify live student preview"
      actions={
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('editor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'editor'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Only
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('split')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'split'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'preview'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5 inline mr-1" />
              Live Preview
            </button>
          </div>

          <Link
            to="/admin/questions"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Bank</span>
          </Link>
        </div>
      }
    >
      <div
        className={`grid gap-6 ${
          previewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : previewMode === 'editor'
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : 'grid-cols-1 max-w-3xl mx-auto'
        }`}
      >
        {/* Editor Form Column */}
        {previewMode !== 'preview' && (
          <form
            onSubmit={handleSave}
            className={`space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs ${
              previewMode === 'split' ? 'lg:col-span-7' : 'w-full'
            }`}
          >
            {/* Section 1: 3-Tier Categorization: Domain -> Chapter -> Lesson */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  1. Question Categorization (Domain › Chapter › Lesson)
                </h3>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Curriculum Mapping
                </span>
              </div>

              {/* Target Collection assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Question Collection / Test Pool
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    list="existing-collections"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    placeholder="e.g. EST 1 Math Diagnostic 2025, Algebra Sprint..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <datalist id="existing-collections">
                    {existingCollections.map((c) => (
                      <option key={c} value={c} />
                    ))}
                    <option value="General Question Bank" />
                  </datalist>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assign this question to a collection or create a new collection name.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Domain Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Domain (Unit)</label>
                  <select
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value)
                      setIsCustomChapter(false)
                      setIsCustomLesson(false)
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    {Object.keys(taxonomyData).map((d) => {
                      const dInfo = taxonomyData[d]
                      return (
                        <option key={d} value={d}>
                          {dInfo?.unitLabel ? `${dInfo.unitLabel} — ${d}` : d}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Chapter Selector with Custom option */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Chapter</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomChapter(!isCustomChapter)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline"
                    >
                      {isCustomChapter ? 'Select from list' : '+ Custom chapter'}
                    </button>
                  </div>
                  {isCustomChapter ? (
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="Enter custom chapter name..."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                    />
                  ) : (
                    <select
                      value={chapter}
                      onChange={(e) => {
                        setChapter(e.target.value)
                        setIsCustomLesson(false)
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                    >
                      {currentChapters.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Lesson Selector with Custom option */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Lesson</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomLesson(!isCustomLesson)}
                    className="text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    {isCustomLesson ? 'Select from list' : '+ Custom lesson'}
                  </button>
                </div>
                {isCustomLesson ? (
                  <input
                    type="text"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="Enter custom lesson name..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  />
                ) : (
                  <select
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    {currentLessons.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    {currentLessons.length === 0 && (
                      <option value={lesson}>{lesson || 'General Lesson'}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Section 2: Format & Difficulty Parameters */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  2. Format & Exam Parameters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Question Format</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="multiple_choice">Single Choice (MCQ)</option>
                    <option value="multi_select">Multi-Select (Choose All)</option>
                    <option value="grid_in">Free Response / Grid-In</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced / Stretch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Target Exam</label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. EST 1 / SAT Math"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Calculator Usage</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalculatorAllowed(false)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                        !calculatorAllowed
                          ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No Calculator
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorAllowed(true)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                        calculatorAllowed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Permitted
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Time Estimate (sec)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="15"
                      max="300"
                      step="5"
                      value={estimatedSeconds}
                      onChange={(e) => setEstimatedSeconds(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden pl-8"
                    />
                    <Clock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Problem Stem & Math Notation */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-600" />
                  3. Problem Stem & Mathematical Notation
                </h3>
                <span className="text-[11px] text-slate-400">Enclose equations in $...$</span>
              </div>

              {/* Math Quick Inserter Toolbar */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Quick Math Symbol Inserter:
                  </span>
                  <span className="text-[10px] text-slate-400">Click symbol to insert at cursor</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MATH_SNIPPETS.map((snip) => (
                    <button
                      key={snip.label}
                      type="button"
                      onClick={() => insertMathSnippet(snip.latex)}
                      className="px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-700 transition"
                      title={`Insert $${snip.latex}$`}
                    >
                      {snip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Problem Stem Text</label>
                <textarea
                  ref={promptTextareaRef}
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter the mathematical problem stem. Use $...$ for inline equations or $$...$$ for block math."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              {/* File-Based Image Uploading */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span>Attach Diagram / Geometric Stimulus (File Upload)</span>
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!imageUrl ? (
                  /* Drag and Drop Zone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(true)
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      isDraggingFile
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Click to browse image or drag and drop here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supports PNG, JPG, JPEG, WEBP, or SVG files
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uploaded Image Preview & Caption */
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        <img
                          src={imageUrl}
                          alt="Uploaded stimulus preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {imageFileName || 'Uploaded Diagram'}
                        </p>
                        {imageFileSize && (
                          <p className="text-[11px] text-slate-400">File size: {imageFileSize}</p>
                        )}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Replace Image
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Image Caption / Figure Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={imageCaption}
                        onChange={(e) => setImageCaption(e.target.value)}
                        placeholder="e.g. Figure 1: Graph of y = f(x) in the standard coordinate plane"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Answer Choices or Free-Response Key */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  4. Answer Key & Choices
                </h3>
                {questionType !== 'grid_in' && (
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              {questionType === 'grid_in' ? (
                /* Free Response / Grid-in Section */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Exact Numeric Answer Key
                      </label>
                      <input
                        type="text"
                        value={numericAnswer}
                        onChange={(e) => setNumericAnswer(e.target.value)}
                        placeholder="e.g. 2 or 5/2 or 2.5"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tolerance Window (±)
                      </label>
                      <input
                        type="text"
                        value={numericTolerance}
                        onChange={(e) => setNumericTolerance(e.target.value)}
                        placeholder="0 for exact matching"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Students will enter their numeric value directly into an onscreen keypad. Fractions and decimals are normalized automatically.
                  </p>
                </div>
              ) : (
                /* Multiple Choice & Multi-Select Options */
                <div className="space-y-3">
                  {choices.map((c, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl border transition ${
                          c.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectChoice(c.id)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              c.isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title={c.isCorrect ? 'Correct key marked' : 'Click to set as correct answer'}
                          >
                            {c.isCorrect ? <Check className="h-4 w-4" /> : letter}
                          </button>

                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              required
                              value={c.text}
                              onChange={(e) => handleUpdateChoiceText(c.id, e.target.value)}
                              placeholder={`Option ${letter} (e.g. k = 2 or $x = \\frac{1}{2}$)`}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Remove choice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Optional Distractor Rationale */}
                        <div className="mt-2 pl-10">
                          <input
                            type="text"
                            value={c.rationale || ''}
                            onChange={(e) => handleUpdateChoiceRationale(c.id, e.target.value)}
                            placeholder={`Rationale / Distractor explanation for Option ${letter} (optional)`}
                            className="w-full text-[11px] text-slate-500 placeholder:text-slate-300 border-none bg-transparent focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 5: Solution Derivation & Misconceptions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  5. Diagnostic Derivation & Student Explanations
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Complete Step-by-Step Solution (LaTeX supported)
                </label>
                <textarea
                  rows={4}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is true, step-by-step..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Common Trap / Student Misconception Analysis (LaTeX supported)
                </label>
                <textarea
                  rows={2}
                  value={commonMisconception}
                  onChange={(e) => setCommonMisconception(e.target.value)}
                  placeholder="Explain why students commonly pick the wrong distractors (LaTeX formulas $...$ supported)..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {questionType === 'grid_in'
                  ? `Grid-in Key: ${numericAnswer || 'None set'}`
                  : `${choices.filter((c) => c.isCorrect).length} correct key(s) designated`}
              </span>
              <button
                type="submit"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isEditing ? 'Update Question' : 'Save Question to Bank'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Live Interactive Student Preview Panel */}
        {(previewMode === 'split' || previewMode === 'preview') && (
          <div
            className={`space-y-4 ${previewMode === 'split' ? 'lg:col-span-5' : 'w-full'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Live Interactive Student View
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationInPreview(!showExplanationInPreview)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                {showExplanationInPreview ? 'Hide Answer Key' : 'Reveal Answer Key'}
              </button>
            </div>

            {/* Live Rendered Card */}
            <div className="bg-white rounded-3xl border-2 border-blue-200/70 p-6 shadow-md space-y-5">
              {/* Question Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Question 1
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                    {domain}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      difficulty === 'easy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {difficulty}
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      calculatorAllowed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Calculator className="h-3 w-3" />
                    <span>{calculatorAllowed ? 'Calc Allowed' : 'No Calc'}</span>
                  </span>
                </div>
              </div>

              {/* Categorization Breadcrumb (Domain › Chapter › Lesson) */}
              <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-700">{domain}</span>
                <span className="text-slate-300">›</span>
                <span className="font-medium text-slate-600">{chapter}</span>
                <span className="text-slate-300">›</span>
                <span className="font-medium text-blue-600">{lesson}</span>
              </div>

              {/* Collection affiliation badge */}
              {collection && (
                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Collection: {collection}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {targetExam}
                  </span>
                </div>
              )}

              {/* Stimulus / Image if uploaded */}
              {imageUrl && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 space-y-1 text-center">
                  <img
                    src={imageUrl}
                    alt={imageCaption || 'Problem diagram'}
                    className="max-h-56 mx-auto object-contain rounded-xl"
                  />
                  {imageCaption && (
                    <p className="text-[11px] text-slate-500 italic pt-1">{imageCaption}</p>
                  )}
                </div>
              )}

              {/* Problem Stem */}
              <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {prompt ? (
                  renderMathSafe(prompt)
                ) : (
                  <span className="text-slate-300 italic">Enter question prompt above...</span>
                )}
              </div>

              {/* Interactive Student Answer Section */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {questionType === 'grid_in'
                    ? 'Student Numeric Input:'
                    : questionType === 'multi_select'
                    ? 'Student Options (Select all that apply):'
                    : 'Student Options (Click to test):'}
                </span>

                {questionType === 'grid_in' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={previewInputAnswer}
                      onChange={(e) => setPreviewInputAnswer(e.target.value)}
                      placeholder="Enter numeric answer (e.g. 2)..."
                      className="w-full rounded-xl border-2 border-blue-200 p-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                    {showExplanationInPreview && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Accepted Value: {numericAnswer || '2'}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {choices.map((c, i) => {
                      const letter = String.fromCharCode(65 + i)
                      const isSelected =
                        questionType === 'multiple_choice'
                          ? previewSelectedChoice === c.id
                          : previewMultiSelected.includes(c.id)

                      const handleChoiceClick = () => {
                        if (questionType === 'multiple_choice') {
                          setPreviewSelectedChoice(c.id)
                        } else {
                          if (previewMultiSelected.includes(c.id)) {
                            setPreviewMultiSelected(previewMultiSelected.filter((id) => id !== c.id))
                          } else {
                            setPreviewMultiSelected([...previewMultiSelected, c.id])
                          }
                        }
                      }

                      return (
                        <div
                          key={c.id}
                          onClick={handleChoiceClick}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 font-semibold ring-2 ring-blue-200'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>

                          <span className="flex-1 text-slate-800">
                            {c.text ? (
                              renderMathSafe(c.text)
                            ) : (
                              <span className="text-slate-300 italic">Option {letter}...</span>
                            )}
                          </span>

                          {showExplanationInPreview && c.isCorrect && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Correct Key
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Live Explanation & Misconception Breakdown */}
              {showExplanationInPreview && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {explanation && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Solution & Mathematical Derivation:</span>
                      </div>
                      <div className="text-emerald-900/90 text-xs leading-relaxed pl-5 whitespace-pre-line">
                        {renderMathSafe(explanation)}
                      </div>
                    </div>
                  )}

                  {commonMisconception && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Common Student Trap / Misconception:</span>
                      </div>
                      <div className="text-amber-900/90 text-xs leading-relaxed pl-5 whitespace-pre-line">
                        {renderMathSafe(commonMisconception)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CreateQuestionPage
