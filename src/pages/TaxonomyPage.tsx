import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  FolderTree,
  Plus,
  BookOpen,
  Bookmark,
  Layers,
  HelpCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { questionBankService, type TaxonomyRegistry, type QuestionBankItem } from '../lib/questionBankService'

type ActiveTab = 'overview' | 'manage' | 'matrix'

export const TaxonomyPage: React.FC = () => {
  const navigate = useNavigate()
  const [taxonomy, setTaxonomy] = useState<TaxonomyRegistry>({})
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected item in the hierarchy
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)

  // Modal / Form state for Add/Edit
  const [modalMode, setModalMode] = useState<'addDomain' | 'editDomain' | 'addChapter' | 'editChapter' | 'addLesson' | 'editLesson' | null>(null)
  const [formDomainName, setFormDomainName] = useState('')
  const [formDomainUnitLabel, setFormDomainUnitLabel] = useState('')
  const [formDomainCode, setFormDomainCode] = useState('')
  const [formChapterName, setFormChapterName] = useState('')
  const [formChapterCode, setFormChapterCode] = useState('')
  const [formLessonName, setFormLessonName] = useState('')
  const [targetDomain, setTargetDomain] = useState('')
  const [targetChapter, setTargetChapter] = useState('')
  const [originalName, setOriginalName] = useState('')

  // Load from service on mount
  const refreshData = () => {
    const tax = questionBankService.getTaxonomy()
    setTaxonomy(tax)
    const qList = questionBankService.getStoredQuestions()
    setQuestions(qList)

    const domains = Object.keys(tax)
    if (domains.length > 0 && (!selectedDomain || !tax[selectedDomain])) {
      setSelectedDomain(domains[0])
      if (tax[domains[0]].chapters.length > 0) {
        setSelectedChapter(tax[domains[0]].chapters[0].name)
        if (tax[domains[0]].chapters[0].lessons.length > 0) {
          setSelectedLesson(tax[domains[0]].chapters[0].lessons[0])
        }
      }
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const domainNames = Object.keys(taxonomy)

  // Calculate statistics linking questions to taxonomy
  const taxonomyStats = useMemo(() => {
    let totalLessonsCount = 0
    let totalChaptersCount = 0
    const domainCounts: Record<string, number> = {}
    const chapterCounts: Record<string, number> = {}
    const lessonCounts: Record<string, number> = {}

    // Initialize counts
    domainNames.forEach((d) => {
      domainCounts[d] = 0
      taxonomy[d].chapters.forEach((c) => {
        totalChaptersCount++
        chapterCounts[`${d}::${c.name}`] = 0
        c.lessons.forEach((l) => {
          totalLessonsCount++
          lessonCounts[`${d}::${c.name}::${l}`] = 0
        })
      })
    })

    // Match questions
    questions.forEach((q) => {
      if (q.domain && domainCounts[q.domain] !== undefined) {
        domainCounts[q.domain]++
      }
      if (q.domain && q.chapter) {
        const cKey = `${q.domain}::${q.chapter}`
        if (chapterCounts[cKey] !== undefined) {
          chapterCounts[cKey]++
        }
      }
      if (q.domain && q.chapter && q.lesson) {
        const lKey = `${q.domain}::${q.chapter}::${q.lesson}`
        if (lessonCounts[lKey] !== undefined) {
          lessonCounts[lKey]++
        }
      }
    })

    return {
      domainsCount: domainNames.length,
      chaptersCount: totalChaptersCount,
      lessonsCount: totalLessonsCount,
      totalQuestions: questions.length,
      domainCounts,
      chapterCounts,
      lessonCounts,
    }
  }, [taxonomy, questions, domainNames])

  // Get current active chapters and lessons
  const currentChapters = selectedDomain && taxonomy[selectedDomain] ? taxonomy[selectedDomain].chapters : []
  const currentChapterObj = currentChapters.find((c) => c.name === selectedChapter)
  const currentLessons = currentChapterObj ? currentChapterObj.lessons : []

  // Linked questions for currently selected level
  const linkedQuestions = useMemo(() => {
    if (selectedLesson && selectedChapter && selectedDomain) {
      return questions.filter(
        (q) => q.domain === selectedDomain && q.chapter === selectedChapter && q.lesson === selectedLesson
      )
    }
    if (selectedChapter && selectedDomain) {
      return questions.filter((q) => q.domain === selectedDomain && q.chapter === selectedChapter)
    }
    if (selectedDomain) {
      return questions.filter((q) => q.domain === selectedDomain)
    }
    return questions
  }, [questions, selectedDomain, selectedChapter, selectedLesson])

  // Handlers for Add/Edit actions
  const handleOpenAddDomain = () => {
    setFormDomainName('')
    setFormDomainUnitLabel(`Unit ${domainNames.length + 1}: `)
    setFormDomainCode(`UNIT-${domainNames.length + 1}`)
    setModalMode('addDomain')
  }

  const handleOpenEditDomain = (domain: string) => {
    const data = taxonomy[domain]
    setOriginalName(domain)
    setFormDomainName(domain)
    setFormDomainUnitLabel(data?.unitLabel || '')
    setFormDomainCode(data?.code || '')
    setModalMode('editDomain')
  }

  const handleOpenAddChapter = (domain: string) => {
    setTargetDomain(domain)
    setFormChapterName('')
    setFormChapterCode(`${taxonomy[domain]?.code || 'CH'}.${(taxonomy[domain]?.chapters.length || 0) + 1}`)
    setModalMode('addChapter')
  }

  const handleOpenEditChapter = (domain: string, chapter: { name: string; code?: string }) => {
    setTargetDomain(domain)
    setOriginalName(chapter.name)
    setFormChapterName(chapter.name)
    setFormChapterCode(chapter.code || '')
    setModalMode('editChapter')
  }

  const handleOpenAddLesson = (domain: string, chapter: string) => {
    setTargetDomain(domain)
    setTargetChapter(chapter)
    setFormLessonName('')
    setModalMode('addLesson')
  }

  const handleOpenEditLesson = (domain: string, chapter: string, lesson: string) => {
    setTargetDomain(domain)
    setTargetChapter(chapter)
    setOriginalName(lesson)
    setFormLessonName(lesson)
    setModalMode('editLesson')
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (modalMode === 'addDomain' && formDomainName.trim()) {
      questionBankService.addDomain(formDomainName.trim(), formDomainUnitLabel.trim(), formDomainCode.trim())
      setSelectedDomain(formDomainName.trim())
    } else if (modalMode === 'editDomain' && formDomainName.trim()) {
      questionBankService.updateDomain(originalName, formDomainName.trim(), formDomainUnitLabel.trim(), formDomainCode.trim())
      if (selectedDomain === originalName) setSelectedDomain(formDomainName.trim())
    } else if (modalMode === 'addChapter' && formChapterName.trim()) {
      questionBankService.addChapter(targetDomain, formChapterName.trim(), formChapterCode.trim())
      setSelectedChapter(formChapterName.trim())
    } else if (modalMode === 'editChapter' && formChapterName.trim()) {
      questionBankService.updateChapter(targetDomain, originalName, formChapterName.trim(), formChapterCode.trim())
      if (selectedChapter === originalName) setSelectedChapter(formChapterName.trim())
    } else if (modalMode === 'addLesson' && formLessonName.trim()) {
      questionBankService.addLesson(targetDomain, targetChapter, formLessonName.trim())
      setSelectedLesson(formLessonName.trim())
    } else if (modalMode === 'editLesson' && formLessonName.trim()) {
      questionBankService.updateLesson(targetDomain, targetChapter, originalName, formLessonName.trim())
      if (selectedLesson === originalName) setSelectedLesson(formLessonName.trim())
    }

    setModalMode(null)
    refreshData()
  }

  const handleDeleteDomain = (domainName: string) => {
    if (window.confirm(`Are you sure you want to delete Domain "${domainName}"? Questions will keep their text but taxonomy grouping will be removed.`)) {
      questionBankService.deleteDomain(domainName)
      refreshData()
    }
  }

  const handleDeleteChapter = (domainName: string, chapterName: string) => {
    if (window.confirm(`Delete Chapter "${chapterName}" from ${domainName}?`)) {
      questionBankService.deleteChapter(domainName, chapterName)
      refreshData()
    }
  }

  const handleDeleteLesson = (domainName: string, chapterName: string, lessonName: string) => {
    if (window.confirm(`Delete Lesson "${lessonName}"?`)) {
      questionBankService.deleteLesson(domainName, chapterName, lessonName)
      refreshData()
    }
  }

  return (
    <AdminLayout
      title="Curriculum Taxonomy Architecture"
      subtitle="Structured 3-tier hierarchy: Domain (Unit) → Chapter → Lesson directly linked to Question Bank"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/questions/new')}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Question in Taxonomy</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddDomain}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Domain (Unit)</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Tier 1: Domains (Units)</span>
            <p className="text-xl font-bold text-blue-950 mt-0.5">{taxonomyStats.domainsCount}</p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Core curriculum areas</p>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Tier 2: Chapters</span>
            <p className="text-xl font-bold text-indigo-950 mt-0.5">{taxonomyStats.chaptersCount}</p>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Thematic clusters</p>
          </div>
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Tier 3: Lessons</span>
            <p className="text-xl font-bold text-teal-950 mt-0.5">{taxonomyStats.lessonsCount}</p>
            <p className="text-[11px] text-teal-600/80 mt-0.5">Granular competencies</p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Linked Questions</span>
            <p className="text-xl font-bold text-emerald-950 mt-0.5">{taxonomyStats.totalQuestions}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">In Active Bank</p>
          </div>
        </div>

        {/* 3-Column Visual Hierarchy Browser (Domain(Unit) -> Chapter -> Lesson) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Curriculum Hierarchy Navigator: Domain (Unit) → Chapter → Lesson
                </h3>
                <p className="text-xs text-slate-500">
                  Select a tier below to view associated lessons, manage standards, or filter linked questions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter taxonomy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[440px]">
            {/* COLUMN 1: DOMAINS (UNITS) */}
            <div className="flex flex-col bg-slate-50/30">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Domain (Unit)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddDomain}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  title="Add new Domain"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[500px]">
                {domainNames
                  .filter((d) => !searchQuery || d.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((domain) => {
                    const isSelected = selectedDomain === domain
                    const dData = taxonomy[domain]
                    const qCount = taxonomyStats.domainCounts[domain] || 0

                    return (
                      <div
                        key={domain}
                        onClick={() => {
                          setSelectedDomain(domain)
                          if (dData.chapters.length > 0) {
                            setSelectedChapter(dData.chapters[0].name)
                            if (dData.chapters[0].lessons.length > 0) {
                              setSelectedLesson(dData.chapters[0].lessons[0])
                            } else {
                              setSelectedLesson(null)
                            }
                          } else {
                            setSelectedChapter(null)
                            setSelectedLesson(null)
                          }
                        }}
                        className={`group p-3 rounded-2xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {dData?.unitLabel && (
                              <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider truncate">
                                {dData.unitLabel}
                              </span>
                            )}
                            <h4 className="font-bold text-xs text-slate-900 leading-snug mt-0.5">
                              {domain}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-600">
                                {dData.chapters.length} Chapters
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {qCount} Questions
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditDomain(domain)
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded"
                              title="Edit Domain"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDomain(domain)
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded"
                              title="Delete Domain"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <ChevronRight
                              className={`h-4 w-4 ${
                                isSelected ? 'text-blue-600' : 'text-slate-300'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* COLUMN 2: CHAPTERS */}
            <div className="flex flex-col bg-white">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Chapter
                  </span>
                </div>
                {selectedDomain && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddChapter(selectedDomain)}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    title="Add new Chapter"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[500px]">
                {!selectedDomain ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    Select a Domain on the left
                  </p>
                ) : currentChapters.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-xs text-slate-400 italic">No chapters in this domain yet.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddChapter(selectedDomain)}
                      className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      + Add the first Chapter
                    </button>
                  </div>
                ) : (
                  currentChapters
                    .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((chap) => {
                      const isSelected = selectedChapter === chap.name
                      const cKey = `${selectedDomain}::${chap.name}`
                      const qCount = taxonomyStats.chapterCounts[cKey] || 0

                      return (
                        <div
                          key={chap.name}
                          onClick={() => {
                            setSelectedChapter(chap.name)
                            if (chap.lessons.length > 0) {
                              setSelectedLesson(chap.lessons[0])
                            } else {
                              setSelectedLesson(null)
                            }
                          }}
                          className={`group p-3 rounded-2xl border transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {chap.code && (
                                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                                  {chap.code}
                                </span>
                              )}
                              <h4 className="font-bold text-xs text-slate-900 leading-snug mt-1">
                                {chap.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                <span>{chap.lessons.length} Lessons</span>
                                <span>•</span>
                                <span className="font-semibold text-indigo-700">
                                  {qCount} Questions
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEditChapter(selectedDomain, chap)
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded"
                                title="Edit Chapter"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteChapter(selectedDomain, chap.name)
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded"
                                title="Delete Chapter"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <ChevronRight
                                className={`h-4 w-4 ${
                                  isSelected ? 'text-indigo-600' : 'text-slate-300'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            {/* COLUMN 3: LESSONS */}
            <div className="flex flex-col bg-slate-50/20">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lesson (Competency)
                  </span>
                </div>
                {selectedDomain && selectedChapter && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddLesson(selectedDomain, selectedChapter)}
                    className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    title="Add new Lesson"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[500px]">
                {!selectedChapter ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    Select a Chapter in column 2
                  </p>
                ) : currentLessons.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-xs text-slate-400 italic">No lessons in this chapter yet.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddLesson(selectedDomain!, selectedChapter)}
                      className="mt-2 text-xs text-teal-600 font-semibold hover:underline"
                    >
                      + Add the first Lesson
                    </button>
                  </div>
                ) : (
                  currentLessons
                    .filter((l) => !searchQuery || l.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((lesson) => {
                      const isSelected = selectedLesson === lesson
                      const lKey = `${selectedDomain}::${selectedChapter}::${lesson}`
                      const qCount = taxonomyStats.lessonCounts[lKey] || 0

                      return (
                        <div
                          key={lesson}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`group p-3 rounded-2xl border transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                                {lesson}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                                  {qCount} Questions Linked
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEditLesson(selectedDomain!, selectedChapter, lesson)
                                }}
                                className="p-1 text-slate-400 hover:text-teal-600 hover:bg-white rounded"
                                title="Edit Lesson"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLesson(selectedDomain!, selectedChapter, lesson)
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded"
                                title="Delete Lesson"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Questions Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Questions Linked to Selected Taxonomy Node ({linkedQuestions.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active context: <strong className="text-slate-800">{selectedDomain || 'All Domains'}</strong>
                {selectedChapter && <span> → <strong className="text-slate-800">{selectedChapter}</strong></span>}
                {selectedLesson && <span> → <strong className="text-slate-800">{selectedLesson}</strong></span>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/admin/questions?domain=${encodeURIComponent(selectedDomain || '')}&chapter=${encodeURIComponent(selectedChapter || '')}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Open in Question Bank</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {linkedQuestions.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-400">
                No questions are currently mapped to this exact lesson.
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin/questions/new')}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Question for this Lesson</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {linkedQuestions.map((q) => (
                <div key={q.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-slate-900 line-clamp-2">{q.prompt}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-600">{q.collection || 'General Question Bank'}</span>
                      <span>•</span>
                      <span className="capitalize font-medium">{q.questionType.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        {q.difficulty}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/admin/questions/${q.id}/edit`}
                    className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shrink-0"
                  >
                    Edit Question
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add or Edit Domain / Chapter / Lesson */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'addDomain' && 'Add Root Domain (Unit)'}
                {modalMode === 'editDomain' && `Edit Domain: ${originalName}`}
                {modalMode === 'addChapter' && `Add Chapter to ${targetDomain}`}
                {modalMode === 'editChapter' && `Edit Chapter: ${originalName}`}
                {modalMode === 'addLesson' && `Add Lesson to ${targetChapter}`}
                {modalMode === 'editLesson' && `Edit Lesson: ${originalName}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes persist dynamically and synchronize automatically across question bank categorizations.
              </p>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Domain inputs */}
              {(modalMode === 'addDomain' || modalMode === 'editDomain') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Domain Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Algebra & Functions"
                      value={formDomainName}
                      onChange={(e) => setFormDomainName(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Label / Header (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 1: Foundations of Algebraic Modeling"
                      value={formDomainUnitLabel}
                      onChange={(e) => setFormDomainUnitLabel(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Code Identifier (e.g. ALG)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ALG"
                      value={formDomainCode}
                      onChange={(e) => setFormDomainCode(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* Chapter inputs */}
              {(modalMode === 'addChapter' || modalMode === 'editChapter') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chapter Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Linear Equations & Systems"
                      value={formChapterName}
                      onChange={(e) => setFormChapterName(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chapter Code (e.g. ALG.1)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ALG.1"
                      value={formChapterCode}
                      onChange={(e) => setFormChapterCode(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* Lesson inputs */}
              {(modalMode === 'addLesson' || modalMode === 'editLesson') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lesson / Specific Competency Name *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Quadratic Formula & Discriminant Analysis"
                    value={formLessonName}
                    onChange={(e) => setFormLessonName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default TaxonomyPage
