import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import {
  Plus,
  Search,
  HelpCircle,
  Edit3,
  Trash2,
  Upload,
  Download,
  FileJson,
  Layers,
  Calculator,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Sparkles,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react'
import {
  questionBankService,
  QuestionBankItem,
  QuestionCollection,
  CURRICULUM_TAXONOMY,
} from '../lib/questionBankService'

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [collections, setCollections] = useState<QuestionCollection[]>([])
  const [taxonomy, setTaxonomy] = useState<TaxonomyRegistry>(CURRICULUM_TAXONOMY)
  const [selectedCollection, setSelectedCollection] = useState<string>('all')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Expandable preview cards
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)

  // JSON Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importInputMode, setImportInputMode] = useState<'file' | 'text'>('file')
  const [jsonFileContent, setJsonFileContent] = useState<string>('')
  const [jsonFileName, setJsonFileName] = useState<string>('')
  const [parsedPreview, setParsedPreview] = useState<{
    collectionName: string
    questionCount: number
    questions: any[]
    error?: string
  } | null>(null)
  const [customCollectionOverride, setCustomCollectionOverride] = useState('')
  const [importStatusMessage, setImportStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isDraggingImportFile, setIsDraggingImportFile] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  // Load questions and collections
  const reloadData = () => {
    const list = questionBankService.getStoredQuestions()
    setQuestions(list)
    const cols = questionBankService.getCollectionsList()
    setCollections(cols)
    const tax = questionBankService.getTaxonomy()
    setTaxonomy(tax)
  }

  useEffect(() => {
    reloadData()
  }, [])

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

  // Handle JSON file selection for import
  const handleJsonFileSelected = (file: File) => {
    if (!file) return
    setJsonFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonFileContent(content)
      parseAndValidateJson(content)
    }
    reader.readAsText(file)
  }

  const parseAndValidateJson = (content: string) => {
    try {
      if (!content.trim()) {
        setParsedPreview(null)
        return
      }
      const parsed = JSON.parse(content)
      let count = 0
      let collectionName = 'Imported Collection'
      let previewItems: any[] = []

      if (Array.isArray(parsed)) {
        count = parsed.length
        previewItems = parsed.slice(0, 5)
        collectionName = 'Imported Question Pool'
      } else if (parsed && typeof parsed === 'object') {
        collectionName =
          parsed.collection_name ||
          parsed.collectionName ||
          parsed.collection ||
          'Imported Collection'

        if (Array.isArray(parsed.questions)) {
          count = parsed.questions.length
          previewItems = parsed.questions.slice(0, 5)
        } else if (Array.isArray(parsed.items)) {
          count = parsed.items.length
          previewItems = parsed.items.slice(0, 5)
        } else {
          count = 1
          previewItems = [parsed]
        }
      }

      setCustomCollectionOverride(collectionName)
      setParsedPreview({
        collectionName,
        questionCount: count,
        questions: previewItems,
      })
    } catch (e: any) {
      setParsedPreview({
        collectionName: '',
        questionCount: 0,
        questions: [],
        error: `JSON Parse Error: ${e.message}`,
      })
    }
  }

  // Execute import into general bank
  const handleExecuteImport = () => {
    if (!jsonFileContent.trim()) {
      alert('Please select or paste a valid JSON file.')
      return
    }

    try {
      const parsed = JSON.parse(jsonFileContent)
      const res = questionBankService.importQuestionCollection(
        parsed,
        customCollectionOverride.trim() || undefined
      )

      if (res.success) {
        reloadData()
        setIsImportModalOpen(false)
        setJsonFileContent('')
        setJsonFileName('')
        setParsedPreview(null)
        setCustomCollectionOverride('')
        setImportStatusMessage({
          type: 'success',
          text: `Successfully imported ${res.count} questions into collection "${res.collectionName}"! All questions are now active in the general question bank.`,
        })
        setSelectedCollection('all')
      } else {
        alert(`Import failed: ${res.errors?.join(', ') || 'Unknown error'}`)
      }
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`)
    }
  }

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const template = questionBankService.getSampleCollectionTemplate()
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'question_collection_template.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Export current collection or all questions
  const handleExportJson = () => {
    const jsonStr = questionBankService.exportCollectionAsJson(
      selectedCollection === 'all' ? undefined : selectedCollection
    )
    const fileName =
      selectedCollection === 'all'
        ? 'all_questions_bank_export.json'
        : `${selectedCollection.toLowerCase().replace(/[^a-z0-9]/g, '_')}_collection.json`

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', fileName)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Delete question handler
  const handleDeleteQuestion = (id: string, promptText: string) => {
    if (confirm(`Are you sure you want to delete this question?\n\n"${promptText.substring(0, 60)}..."`)) {
      questionBankService.deleteQuestion(id)
      reloadData()
    }
  }

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    // Collection filter
    if (selectedCollection !== 'all' && (q.collection || 'General Question Bank') !== selectedCollection) {
      return false
    }

    // Domain filter
    if (selectedDomain !== 'all' && q.domain !== selectedDomain) {
      return false
    }

    // Chapter filter
    if (selectedChapter !== 'all' && q.chapter !== selectedChapter) {
      return false
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && q.questionType !== selectedType) {
      return false
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchPrompt = q.prompt?.toLowerCase().includes(term)
      const matchDomain = q.domain?.toLowerCase().includes(term)
      const matchChapter = q.chapter?.toLowerCase().includes(term)
      const matchLesson = q.lesson?.toLowerCase().includes(term)
      const matchCollection = q.collection?.toLowerCase().includes(term)
      const matchExplanation = q.explanation?.toLowerCase().includes(term)
      if (!matchPrompt && !matchDomain && !matchChapter && !matchLesson && !matchCollection && !matchExplanation) {
        return false
      }
    }

    return true
  })

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCollection('all')
    setSelectedDomain('all')
    setSelectedChapter('all')
    setSelectedDifficulty('all')
    setSelectedType('all')
    setSearchTerm('')
  }

  const activeChaptersForFilter =
    selectedDomain !== 'all' ? (taxonomy[selectedDomain] || CURRICULUM_TAXONOMY[selectedDomain])?.chapters || [] : []

  return (
    <AdminLayout
      title="Question Bank"
      subtitle="Curriculum-aligned diagnostic question bank with collection gathering and JSON import/export"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Export questions as JSON collection"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          {/* Import JSON Collection Button */}
          <button
            type="button"
            onClick={() => {
              setIsImportModalOpen(true)
              setImportStatusMessage(null)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Import JSON Collection</span>
          </button>

          {/* New Question Button */}
          <Link
            to="/admin/questions/new"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status notification banner */}
        {importStatusMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition ${
              importStatusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              {importStatusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{importStatusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Question Bank Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Questions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{questions.length}</span>
              <span className="text-xs text-slate-400">in general bank</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Collections
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-600">{collections.length}</span>
              <span className="text-xs text-slate-400">gathered sets</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Curriculum Domains
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-indigo-600">
                {new Set(questions.map((q) => q.domain)).size}
              </span>
              <span className="text-xs text-slate-400">represented</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Calculator Allowed
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600">
                {questions.filter((q) => q.calculatorAllowed).length}
              </span>
              <span className="text-xs text-slate-400">of {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Collections Tab Filter Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-blue-600" />
              <span>Question Collections</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Showing {filteredQuestions.length} of {questions.length} total questions
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCollection('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                selectedCollection === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Questions ({questions.length})
            </button>

            {collections.map((col) => (
              <button
                key={col.name}
                type="button"
                onClick={() => setSelectedCollection(col.name)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCollection === col.name
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{col.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCollection === col.name
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {col.questionCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Multi-criteria Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search stem, equation, domain, chapter, lesson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Domain Dropdown Filter */}
            <div className="w-52">
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value)
                  setSelectedChapter('all')
                }}
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:bg-white"
              >
                <option value="all">All Domains (Units)</option>
                {Object.keys(taxonomy).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Dropdown Filter */}
            {selectedDomain !== 'all' && activeChaptersForFilter.length > 0 && (
              <div className="w-48">
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:bg-white"
                >
                  <option value="all">All Chapters</option>
                  {activeChaptersForFilter.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Difficulty Filter */}
            <div className="w-36">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:bg-white"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Format Filter */}
            <div className="w-36">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:bg-white"
              >
                <option value="all">All Formats</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="multi_select">Multi-Select</option>
                <option value="grid_in">Grid-In</option>
              </select>
            </div>

            {/* Clear filters */}
            {(selectedDomain !== 'all' ||
              selectedChapter !== 'all' ||
              selectedDifficulty !== 'all' ||
              selectedType !== 'all' ||
              searchTerm ||
              selectedCollection !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Questions Catalog List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No questions found</h4>
                <p className="text-xs text-slate-500">
                  No questions match your current search and collection criteria. You can create a new
                  question or import question collections from a JSON file.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Import JSON Collection
                </button>
              </div>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs overflow-hidden transition"
                >
                  {/* Card Header & Problem Summary */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Categorization Breadcrumbs: Domain › Chapter › Lesson */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {q.domain}
                        </span>
                        <span className="text-slate-300">›</span>
                        <span className="font-medium text-slate-600">{q.chapter}</span>
                        <span className="text-slate-300">›</span>
                        <span className="font-medium text-slate-500">{q.lesson}</span>
                      </div>

                      {/* Collection & Status Badges */}
                      <div className="flex items-center gap-2">
                        {q.collection && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Folder className="h-3 w-3 text-slate-400" />
                            <span>{q.collection}</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {q.difficulty}
                        </span>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            q.calculatorAllowed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Calculator className="h-3 w-3" />
                          <span>{q.calculatorAllowed ? 'Calc' : 'No Calc'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Problem Stem (with KaTeX formatting) */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {renderMathSafe(q.prompt)}
                    </div>

                    {/* Thumbnail if image is attached */}
                    {q.imageUrl && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 max-w-fit">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          {q.imageCaption || 'Attached geometric stimulus / diagram'}
                        </span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{q.estimatedSeconds || 90}s</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {q.questionType === 'multiple_choice'
                            ? 'Single Choice (MCQ)'
                            : q.questionType === 'multi_select'
                            ? 'Multi-Select'
                            : 'Grid-in (Free Response)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{isExpanded ? 'Hide Details' : 'Quick Preview'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <Link
                          to={`/admin/questions/${q.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                          title="Edit question"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id, q.prompt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Student Preview & Solution Drawer */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-200 p-5 space-y-4">
                      {/* Attached Diagram in full view */}
                      {q.imageUrl && (
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center max-w-sm mx-auto">
                          <img
                            src={q.imageUrl}
                            alt={q.imageCaption || 'Problem diagram'}
                            className="max-h-48 mx-auto object-contain rounded-xl"
                          />
                          {q.imageCaption && (
                            <p className="text-[11px] text-slate-500 italic mt-1">{q.imageCaption}</p>
                          )}
                        </div>
                      )}

                      {/* Choices / Answer Key */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                          {q.questionType === 'grid_in'
                            ? 'Accepted Grid-In Answer Key:'
                            : 'Answer Choices & Distractor Rationales:'}
                        </span>

                        {q.questionType === 'grid_in' ? (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">
                              Numeric Key: {q.numericAnswer || 'None'}
                            </span>
                            {q.numericTolerance && q.numericTolerance !== '0' && (
                              <span className="text-[11px] text-slate-500">
                                (Tolerance: ±{q.numericTolerance})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {q.choices.map((c, cIdx) => {
                              const letter = String.fromCharCode(65 + cIdx)
                              return (
                                <div
                                  key={c.id || cIdx}
                                  className={`p-3 rounded-xl border text-xs transition ${
                                    c.isCorrect
                                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-medium">
                                      <span
                                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                          c.isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {letter}
                                      </span>
                                      <span>{renderMathSafe(c.text)}</span>
                                    </div>

                                    {c.isCorrect && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Correct Answer
                                      </span>
                                    )}
                                  </div>

                                  {c.rationale && (
                                    <p className="mt-1 pl-7 text-[11px] text-slate-500">
                                      {c.rationale}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Explanation & Solution */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            Complete Solution & Derivation:
                          </span>
                          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {renderMathSafe(q.explanation)}
                          </div>
                        </div>
                      )}

                      {/* Common Misconception */}
                      {q.commonMisconception && (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>Student Misconception / Trap Analysis:</span>
                          </span>
                          <div className="text-amber-900/90 text-xs leading-relaxed pl-5 whitespace-pre-line">
                            {renderMathSafe(q.commonMisconception)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* JSON Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileJson className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Question Collection from JSON
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Populate your question bank from a JSON file. All questions will appear in the general bank.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Mode Tabs & Template Download Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setImportInputMode('file')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    importInputMode === 'file'
                      ? 'bg-white text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload JSON File
                </button>
                <button
                  type="button"
                  onClick={() => setImportInputMode('text')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    importInputMode === 'text'
                      ? 'bg-white text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste JSON Code
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Upload Zone or Textarea */}
            {importInputMode === 'file' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={importFileInputRef}
                  accept=".json,application/json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleJsonFileSelected(e.target.files[0])
                    }
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingImportFile(true)
                  }}
                  onDragLeave={() => setIsDraggingImportFile(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingImportFile(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleJsonFileSelected(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => importFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    isDraggingImportFile
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {jsonFileName ? jsonFileName : 'Click to select or drag & drop JSON file'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Accepts structured questions collection files (.json)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste JSON Array or Collection Object:
                </label>
                <textarea
                  rows={6}
                  value={jsonFileContent}
                  onChange={(e) => {
                    setJsonFileContent(e.target.value)
                    parseAndValidateJson(e.target.value)
                  }}
                  placeholder='{\n  "collection_name": "EST 1 Math Diagnostic",\n  "questions": [\n    {\n      "domain": "Algebra & Functions",\n      "chapter": "Quadratic & Polynomial Equations",\n      "lesson": "Quadratic Formula & Discriminant Analysis",\n      "prompt": "Solve $2x^2 - 4x = 0$...",\n      "choices": [...]\n    }\n  ]\n}'
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Validation & Detected Preview */}
            {parsedPreview && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {parsedPreview.error ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{parsedPreview.error}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Valid JSON: {parsedPreview.questionCount} question(s) detected
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Ready to import
                      </span>
                    </div>

                    {/* Collection Name override / assignment */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Collection Name to Assign:
                      </label>
                      <input
                        type="text"
                        value={customCollectionOverride}
                        onChange={(e) => setCustomCollectionOverride(e.target.value)}
                        placeholder="e.g. EST 1 Math Diagnostic 2025"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        This collection name will tag all imported questions and group them together in the bank.
                      </p>
                    </div>

                    {/* Preview snippets */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Preview Questions:
                      </span>
                      {parsedPreview.questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between"
                        >
                          <span className="truncate flex-1 pr-2 font-medium">
                            {idx + 1}. {q.prompt || q.stem || q.title || 'Question item'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold shrink-0">
                            {q.domain || 'Algebra'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!parsedPreview || Boolean(parsedPreview.error) || parsedPreview.questionCount === 0}
                onClick={handleExecuteImport}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Import {parsedPreview?.questionCount || 0} Questions into Bank</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default QuestionBankPage
