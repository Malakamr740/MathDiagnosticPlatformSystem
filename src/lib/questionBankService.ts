export interface QuestionChoice {
  id: string
  text: string
  isCorrect: boolean
  rationale?: string
}

export interface QuestionBankItem {
  id: string
  collection?: string
  domain: string
  chapter: string
  lesson: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple_choice' | 'multi_select' | 'grid_in'
  calculatorAllowed: boolean
  estimatedSeconds: number
  targetExam?: string
  prompt: string
  imageUrl?: string
  imageCaption?: string
  choices: QuestionChoice[]
  numericAnswer?: string
  numericTolerance?: string
  explanation: string
  commonMisconception?: string
  createdAt?: string
  updatedAt?: string
}

export interface QuestionCollection {
  name: string
  description?: string
  questionCount: number
  createdAt?: string
}

// Taxonomy Schema: Domain (Unit) -> Chapter -> Lesson
export interface TaxonomyLesson {
  name: string
  code?: string
  description?: string
}

export interface TaxonomyChapter {
  name: string
  code?: string
  lessons: (string | TaxonomyLesson)[]
}

export interface TaxonomyDomain {
  name: string
  unitLabel?: string // e.g. "Unit 1", "Unit 2"
  code?: string
  chapters: TaxonomyChapter[]
}

export type TaxonomyRegistry = Record<string, {
  unitLabel?: string
  code?: string
  chapters: {
    name: string
    code?: string
    lessons: string[]
  }[]
}>

const TAXONOMY_STORAGE_KEY = 'math_diag_custom_taxonomy'

// 3-Level Categorization Map: Domain(Unit) -> Chapter -> Lesson
export const CURRICULUM_TAXONOMY: TaxonomyRegistry = {
  'Algebra & Functions': {
    unitLabel: 'Unit 1: Foundations of Functions & Algebra',
    code: 'ALG',
    chapters: [
      {
        name: 'Linear Equations & Systems',
        code: 'ALG.1',
        lessons: [
          'Single-Variable Linear Equations',
          'Systems of Linear Equations (2x2 & 3x3)',
          'Linear Inequalities & Shaded Coordinate Regions',
          'Interpreting Slope and Intercepts in Applied Models',
        ],
      },
      {
        name: 'Quadratic & Polynomial Equations',
        code: 'ALG.2',
        lessons: [
          'Factoring Techniques & Root Finding',
          'Quadratic Formula & Discriminant Analysis',
          'Vertex Form & Parabola Optimization',
          'Polynomial Long Division & Remainder Theorem',
          'Higher Degree Roots & Multiplicity',
        ],
      },
      {
        name: 'Exponential & Logarithmic Functions',
        code: 'ALG.3',
        lessons: [
          'Laws of Exponents & Radical Simplification',
          'Logarithmic Properties & Change of Base',
          'Solving Exponential Equations',
          'Exponential Growth & Decay Word Problems',
        ],
      },
      {
        name: 'Rational & Radical Equations',
        code: 'ALG.4',
        lessons: [
          'Operations with Rational Expressions',
          'Extraneous Solutions in Radical Equations',
          'Partial Fractions & Domain Restrictions',
        ],
      },
    ],
  },
  'Geometry & Measurement': {
    unitLabel: 'Unit 2: Spatial, Synthetic & Analytic Geometry',
    code: 'GEO',
    chapters: [
      {
        name: 'Congruence, Similarity & Geometric Proofs',
        code: 'GEO.1',
        lessons: [
          'Triangle Congruence & Similarity Criteria (SSS, SAS, AA)',
          'Parallel Lines & Transversal Angle Theorems',
          'Properties of Polygons & Quadrilaterals',
        ],
      },
      {
        name: 'Circles & Coordinate Geometry',
        code: 'GEO.2',
        lessons: [
          'Arc Length & Sector Area Calculations',
          'Inscribed & Central Angles in Circles',
          'Standard Circle Equations in the Cartesian Plane',
          'Distance, Midpoint & Perpendicular Slope Formulas',
        ],
      },
      {
        name: 'Area, Surface Area & 3D Volume',
        code: 'GEO.3',
        lessons: [
          'Prisms, Pyramids, Cylinders & Cones',
          'Spheres & Composite Geometric Solids',
          'Cross-Sections & Solids of Revolution',
        ],
      },
    ],
  },
  'Trigonometry': {
    unitLabel: 'Unit 3: Trigonometric Formulations & Periodic Functions',
    code: 'TRIG',
    chapters: [
      {
        name: 'Right Triangle Trigonometry',
        code: 'TRIG.1',
        lessons: [
          'Trigonometric Definitions (Sine, Cosine, Tangent)',
          'Special Right Triangles (30-60-90, 45-45-90)',
          'Angles of Elevation and Depression',
        ],
      },
      {
        name: 'Unit Circle & Analytic Identities',
        code: 'TRIG.2',
        lessons: [
          'Radian Measure & Arc Length on the Unit Circle',
          'Pythagorean Trigonometric Identities',
          'Double-Angle and Half-Angle Formulas',
          'Solving Trigonometric Equations on Intervals',
        ],
      },
      {
        name: 'Laws of Sines and Cosines',
        code: 'TRIG.3',
        lessons: [
          'Law of Sines & Ambiguous Case (SSA)',
          'Law of Cosines in Oblique Triangles',
          'Heron\'s Formula & Area of Non-Right Triangles',
        ],
      },
    ],
  },
  'Calculus & Analysis': {
    unitLabel: 'Unit 4: Limits, Differentiation & Integration',
    code: 'CALC',
    chapters: [
      {
        name: 'Limits & Continuity',
        code: 'CALC.1',
        lessons: [
          'Algebraic Limit Evaluation Techniques',
          'Limits at Infinity & Vertical/Horizontal Asymptotes',
          'Continuity and Intermediate Value Theorem',
          'L\'Hôpital\'s Rule for Indeterminate Forms',
        ],
      },
      {
        name: 'Differential Calculus',
        code: 'CALC.2',
        lessons: [
          'Power, Product, & Quotient Differentiation Rules',
          'Chain Rule & Implicit Differentiation',
          'Tangents, Normals, & Rates of Change',
          'Extreme Value Theorem & Optimization',
        ],
      },
      {
        name: 'Integral Calculus & Accumulation',
        code: 'CALC.3',
        lessons: [
          'Riemann Sums & Definite Integrals',
          'Fundamental Theorem of Calculus',
          'Integration by U-Substitution',
          'Area Between Curves & Net Change',
        ],
      },
    ],
  },
  'Statistics & Probability': {
    unitLabel: 'Unit 5: Empirical Data & Probabilistic Models',
    code: 'STAT',
    chapters: [
      {
        name: 'Descriptive Statistics & Data Distributions',
        code: 'STAT.1',
        lessons: [
          'Measures of Center (Mean, Median, Mode)',
          'Standard Deviation & Spread',
          'Box Plots, IQR, & Outlier Detection',
          'Normal Distribution, Z-Scores & Empirical Rule',
        ],
      },
      {
        name: 'Probability Rules & Combinatorics',
        code: 'STAT.2',
        lessons: [
          'Basic Probability & Complement Rule',
          'Independent & Mutually Exclusive Events',
          'Conditional Probability & Two-Way Contingency Tables',
          'Permutations & Combinations in Sampling',
        ],
      },
    ],
  },
}

const STORAGE_KEY = 'math_diag_question_bank'

// Initial Seed Questions (organized into collections)
export const INITIAL_SEED_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'qb-seed-01',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Algebra & Functions',
    chapter: 'Quadratic & Polynomial Equations',
    lesson: 'Quadratic Formula & Discriminant Analysis',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 90,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ will yield exactly one real distinct root?',
    choices: [
      {
        id: 'c1',
        text: '$k = 2$',
        isCorrect: true,
        rationale: 'Discriminant $\\Delta = (-4)^2 - 4(2)(k) = 16 - 8k = 0 \\implies k = 2$.',
      },
      {
        id: 'c2',
        text: '$k = 4$',
        isCorrect: false,
        rationale: 'If $k = 4$, $\\Delta = 16 - 32 = -16 < 0$ which produces complex roots.',
      },
      {
        id: 'c3',
        text: '$k = -2$',
        isCorrect: false,
        rationale: 'Common sign error in applying $-4ac$.',
      },
      {
        id: 'c4',
        text: '$k = 0$',
        isCorrect: false,
        rationale: 'If $k = 0$, the equation $2x(x - 2) = 0$ yields two distinct roots: $0$ and $2$.',
      },
    ],
    explanation:
      'For any quadratic equation $ax^2 + bx + c = 0$ to possess exactly one repeated real solution, the discriminant must be zero:\n\n$$\\Delta = b^2 - 4ac = 0$$\n\nHere $a = 2$, $b = -4$, and $c = k$. Substituting these parameters:\n\n$$(-4)^2 - 4(2)(k) = 0$$\n$$16 - 8k = 0 \\implies 8k = 16 \\implies k = 2$$',
    commonMisconception:
      'Students frequently confuse the condition for two distinct real roots ($\\Delta > 0$) with the condition for exactly one root ($\\Delta = 0$), or miscalculate $(-4)^2$ as $-16$.',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'qb-seed-02',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Algebra & Functions',
    chapter: 'Linear Equations & Systems',
    lesson: 'Systems of Linear Equations (2x2 & 3x3)',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 105,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'In the system of equations below, $p$ is a constant. If the system has no solution, what is the value of $p$?\n\n$$\\begin{cases} 3x - 5y = 12 \\\\ px + 10y = 7 \\end{cases}$$',
    choices: [
      {
        id: 'c1',
        text: '$p = -6$',
        isCorrect: true,
        rationale: 'Parallel lines require matching slope ratios: $3/p = -5/10 = -1/2 \\implies p = -6$.',
      },
      {
        id: 'c2',
        text: '$p = 6$',
        isCorrect: false,
        rationale: 'Sign error when comparing negative y-coefficient to positive.',
      },
      {
        id: 'c3',
        text: '$p = -15$',
        isCorrect: false,
        rationale: 'Incorrect cross multiplication.',
      },
      {
        id: 'c4',
        text: '$p = 10$',
        isCorrect: false,
        rationale: 'Confusing y-coefficient with target x-coefficient.',
      },
    ],
    explanation:
      'A linear system of two equations has no solution if and only if the lines are strictly parallel (identical slopes with differing y-intercepts).\n\nThe slope of the first line is $m_1 = -\\frac{3}{-5} = \\frac{3}{5}$.\nThe slope of the second line is $m_2 = -\\frac{p}{10}$.\n\nSetting slopes equal:\n$$\\frac{3}{5} = -\\frac{p}{10} \\implies 5p = -30 \\implies p = -6$$\n\nBecause the constant terms are not proportional ($12/7 \\neq -5/10$), the lines do not coincide and there is no solution.',
    commonMisconception:
      'Students often invert the slope formula or miss the negative sign in the ratio $a_1/a_2 = b_1/b_2 \\neq c_1/c_2$.',
    createdAt: '2025-01-16T11:00:00.000Z',
  },
  {
    id: 'qb-seed-03',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Geometry & Measurement',
    chapter: 'Circles & Coordinate Geometry',
    lesson: 'Arc Length & Sector Area Calculations',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: true,
    estimatedSeconds: 75,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'A circle with center $O$ has radius $r = 6\\text{ cm}$. A central angle $\\theta = 60^\\circ$ intercepts an arc $AB$. What is the area of sector $OAB$ in terms of $\\pi$?',
    choices: [
      {
        id: 'c1',
        text: '$6\\pi\\text{ cm}^2$',
        isCorrect: true,
        rationale: 'Area = $(\\theta / 360) \\pi r^2 = (60/360) \\pi (36) = \\frac{1}{6} \\cdot 36\\pi = 6\\pi$.',
      },
      {
        id: 'c2',
        text: '$12\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Multiplied by diameter instead of squaring radius.',
      },
      {
        id: 'c3',
        text: '$2\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Calculated arc length instead of sector area.',
      },
      {
        id: 'c4',
        text: '$36\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Calculated full circle area without fractioning the central angle.',
      },
    ],
    explanation:
      'The area of a circular sector is the fraction of the total circular area swept out by its central angle:\n\n$$\\text{Sector Area} = \\frac{\\theta}{360^\\circ} \\cdot \\pi r^2$$\n\nSubstitute $\\theta = 60^\\circ$ and $r = 6$:\n\n$$\\text{Sector Area} = \\frac{60^\\circ}{360^\\circ} \\cdot \\pi (6^2) = \\frac{1}{6} \\cdot 36\\pi = 6\\pi\\text{ cm}^2$$',
    commonMisconception:
      'Confusing the arc length formula ($s = \\frac{\\theta}{360} 2\\pi r$) with the sector area formula.',
    createdAt: '2025-01-17T09:30:00.000Z',
  },
  {
    id: 'qb-seed-04',
    collection: 'Algebra Mastery Sprint',
    domain: 'Algebra & Functions',
    chapter: 'Exponential & Logarithmic Functions',
    lesson: 'Solving Exponential Equations',
    difficulty: 'easy',
    questionType: 'grid_in',
    calculatorAllowed: false,
    estimatedSeconds: 60,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'If $4^{2x + 1} = 64$, what is the value of $x$?',
    choices: [],
    numericAnswer: '1',
    numericTolerance: '0',
    explanation:
      'Express both sides with the same base:\n\n$$4^{2x + 1} = 4^3$$\n\nEquating exponents:\n$$2x + 1 = 3 \\implies 2x = 2 \\implies x = 1$$',
    commonMisconception:
      'Incorrectly converting $64$ to base $4$ as $4^4$ instead of $4^3$.',
    createdAt: '2025-01-18T14:00:00.000Z',
  },
  {
    id: 'qb-seed-05',
    collection: 'Trigonometry & Calculus Pack',
    domain: 'Trigonometry',
    chapter: 'Unit Circle & Analytic Identities',
    lesson: 'Pythagorean Trigonometric Identities',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 80,
    targetExam: 'EST 2 / SAT Subject',
    prompt:
      'Given that $\\sin(\\theta) = \\frac{3}{5}$ and $\\frac{\\pi}{2} < \\theta < \\pi$, what is the exact value of $\\cos(\\theta)$?',
    choices: [
      {
        id: 'c1',
        text: '$-\\frac{4}{5}$',
        isCorrect: true,
        rationale: 'In Quadrant II, cosine is negative: $-\\sqrt{1 - (3/5)^2} = -4/5$.',
      },
      {
        id: 'c2',
        text: '$\\frac{4}{5}$',
        isCorrect: false,
        rationale: 'Forgot that cosine is negative in Quadrant II.',
      },
      {
        id: 'c3',
        text: '$-\\frac{3}{4}$',
        isCorrect: false,
        rationale: 'Calculated tangent rather than cosine.',
      },
      {
        id: 'c4',
        text: '$\\frac{5}{3}$',
        isCorrect: false,
        rationale: 'Inverted ratio to cosecant.',
      },
    ],
    explanation:
      'Using the fundamental Pythagorean trigonometric identity:\n\n$$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$$\n$$\\left(\\frac{3}{5}\\right)^2 + \\cos^2(\\theta) = 1 \\implies \\frac{9}{25} + \\cos^2(\\theta) = 1$$\n$$\\cos^2(\\theta) = 1 - \\frac{9}{25} = \\frac{16}{25} \\implies \\cos(\\theta) = \\pm \\frac{4}{5}$$\n\nSince $\\frac{\\pi}{2} < \\theta < \\pi$ places the angle in **Quadrant II**, the x-coordinate (cosine) is negative. Therefore:\n\n$$\\cos(\\theta) = -\\frac{4}{5}$$',
    commonMisconception:
      'Failing to verify the quadrant constraint and selecting $+4/5$.',
    createdAt: '2025-01-19T16:00:00.000Z',
  },
  {
    id: 'qb-seed-06',
    collection: 'Trigonometry & Calculus Pack',
    domain: 'Calculus & Analysis',
    chapter: 'Differential Calculus',
    lesson: 'Tangents, Normals, & Rates of Change',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 120,
    targetExam: 'AP Calculus AB/BC',
    prompt:
      'Find the equation of the line tangent to the curve $f(x) = x^3 - 3x^2 + 2$ at the point where $x = 2$.',
    choices: [
      {
        id: 'c1',
        text: '$y = -2$',
        isCorrect: true,
        rationale: 'Slope $f\'(2) = 3(4) - 6(2) = 0$. Since $f(2) = -2$, tangent is horizontal: $y = -2$.',
      },
      {
        id: 'c2',
        text: '$y = 3x - 8$',
        isCorrect: false,
        rationale: 'Derivative power rule calculation error.',
      },
      {
        id: 'c3',
        text: '$y = -3x + 4$',
        isCorrect: false,
        rationale: 'Incorrect evaluation of slope.',
      },
      {
        id: 'c4',
        text: '$y = 0$',
        isCorrect: false,
        rationale: 'Confusing root of derivative with y-value on curve.',
      },
    ],
    explanation:
      'First compute the derivative function $f\'(x)$:\n\n$$f\'(x) = 3x^2 - 6x$$\n\nEvaluate at $x = 2$ to find the slope $m$ of the tangent line:\n\n$$m = f\'(2) = 3(2)^2 - 6(2) = 12 - 12 = 0$$\n\nNext evaluate $f(2)$ to identify the point of tangency $(x_0, y_0)$:\n\n$$y_0 = f(2) = 2^3 - 3(2)^2 + 2 = 8 - 12 + 2 = -2$$\n\nUsing point-slope form:\n$$y - (-2) = 0(x - 2) \\implies y + 2 = 0 \\implies y = -2$$',
    commonMisconception:
      'Overlooking that a derivative of $0$ produces a horizontal tangent line of the form $y = c$.',
    createdAt: '2025-01-20T10:00:00.000Z',
  },
]

// Service Helpers
export const questionBankService = {
  getStoredQuestions(): QuestionBankItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_QUESTIONS))
        return INITIAL_SEED_QUESTIONS
      }
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEED_QUESTIONS
    } catch (e) {
      console.error('Failed to read questions from localStorage:', e)
      return INITIAL_SEED_QUESTIONS
    }
  },

  saveQuestions(questions: QuestionBankItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
    } catch (e) {
      console.error('Failed to save questions to localStorage:', e)
    }
  },

  getQuestionById(id: string): QuestionBankItem | undefined {
    const list = this.getStoredQuestions()
    return list.find((q) => q.id === id)
  },

  addQuestion(question: QuestionBankItem): void {
    const list = this.getStoredQuestions()
    const updated = [question, ...list.filter((q) => q.id !== question.id)]
    this.saveQuestions(updated)
  },

  updateQuestion(id: string, updates: Partial<QuestionBankItem>): void {
    const list = this.getStoredQuestions()
    const updated = list.map((q) =>
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    )
    this.saveQuestions(updated)
  },

  deleteQuestion(id: string): void {
    const list = this.getStoredQuestions()
    this.saveQuestions(list.filter((q) => q.id !== id))
  },

  deleteCollection(collectionName: string): void {
    const list = this.getStoredQuestions()
    this.saveQuestions(list.filter((q) => q.collection !== collectionName))
  },

  // Dynamic Taxonomy Management (Domain (Unit) -> Chapter -> Lesson)
  getTaxonomy(): TaxonomyRegistry {
    try {
      const raw = localStorage.getItem(TAXONOMY_STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(CURRICULUM_TAXONOMY))
        return CURRICULUM_TAXONOMY
      }
      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : CURRICULUM_TAXONOMY
    } catch (e) {
      console.error('Failed to read taxonomy from localStorage:', e)
      return CURRICULUM_TAXONOMY
    }
  },

  saveTaxonomy(taxonomy: TaxonomyRegistry): void {
    try {
      localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(taxonomy))
    } catch (e) {
      console.error('Failed to save taxonomy to localStorage:', e)
    }
  },

  addDomain(domainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (tax[domainName]) return
    tax[domainName] = {
      unitLabel: unitLabel || `Unit: ${domainName}`,
      code: code || domainName.slice(0, 4).toUpperCase(),
      chapters: [],
    }
    this.saveTaxonomy(tax)
  },

  updateDomain(oldDomainName: string, newDomainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[oldDomainName]) return
    const existingData = tax[oldDomainName]
    delete tax[oldDomainName]
    tax[newDomainName] = {
      ...existingData,
      unitLabel: unitLabel ?? existingData.unitLabel,
      code: code ?? existingData.code,
    }
    this.saveTaxonomy(tax)

    // Update questions mapped to the old domain name
    if (oldDomainName !== newDomainName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === oldDomainName ? { ...q, domain: newDomainName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteDomain(domainName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    delete tax[domainName]
    this.saveTaxonomy(tax)
  },

  addChapter(domainName: string, chapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const exists = tax[domainName].chapters.some((c) => c.name === chapterName)
    if (exists) return
    tax[domainName].chapters.push({
      name: chapterName,
      code: code || `${tax[domainName].code || 'U'}.${tax[domainName].chapters.length + 1}`,
      lessons: [],
    })
    this.saveTaxonomy(tax)
  },

  updateChapter(domainName: string, oldChapterName: string, newChapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const target = tax[domainName].chapters.find((c) => c.name === oldChapterName)
    if (!target) return
    target.name = newChapterName
    if (code) target.code = code
    this.saveTaxonomy(tax)

    if (oldChapterName !== newChapterName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === oldChapterName ? { ...q, chapter: newChapterName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteChapter(domainName: string, chapterName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    tax[domainName].chapters = tax[domainName].chapters.filter((c) => c.name !== chapterName)
    this.saveTaxonomy(tax)
  },

  addLesson(domainName: string, chapterName: string, lessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    if (chapter.lessons.includes(lessonName)) return
    chapter.lessons.push(lessonName)
    this.saveTaxonomy(tax)
  },

  updateLesson(domainName: string, chapterName: string, oldLessonName: string, newLessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    const idx = chapter.lessons.indexOf(oldLessonName)
    if (idx === -1) return
    chapter.lessons[idx] = newLessonName
    this.saveTaxonomy(tax)

    if (oldLessonName !== newLessonName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === chapterName && q.lesson === oldLessonName
          ? { ...q, lesson: newLessonName }
          : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteLesson(domainName: string, chapterName: string, lessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    chapter.lessons = chapter.lessons.filter((l) => l !== lessonName)
    this.saveTaxonomy(tax)
  },

  // Returns questions filtered by domain, chapter, or lesson
  getQuestionsForTaxonomy(domain?: string, chapter?: string, lesson?: string): QuestionBankItem[] {
    const questions = this.getStoredQuestions()
    return questions.filter((q) => {
      if (domain && q.domain !== domain) return false
      if (chapter && q.chapter !== chapter) return false
      if (lesson && q.lesson !== lesson) return false
      return true
    })
  },

  getCollectionsList(): QuestionCollection[] {
    const questions = this.getStoredQuestions()
    const map = new Map<string, { count: number; description?: string; createdAt?: string }>()

    questions.forEach((q) => {
      const name = q.collection?.trim() || 'General Question Bank'
      const existing = map.get(name) || { count: 0 }
      map.set(name, {
        count: existing.count + 1,
        createdAt: q.createdAt,
      })
    })

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      questionCount: data.count,
      createdAt: data.createdAt,
    }))
  },

  /**
   * Imports a JSON object or array into the question bank as a collection.
   * Gracefully supports:
   * - { collection_name: "...", description: "...", questions: [...] }
   * - { collectionName: "...", questions: [...] }
   * - { questions: [...] }
   * - Raw array of questions: [ { ... }, { ... } ]
   */
  importQuestionCollection(
    rawJson: any,
    fallbackCollectionName?: string
  ): { success: boolean; count: number; collectionName: string; errors?: string[] } {
    const errors: string[] = []
    let targetCollection =
      fallbackCollectionName?.trim() ||
      rawJson.collection_name ||
      rawJson.collectionName ||
      rawJson.collection ||
      'Imported Collection'

    let rawQuestionsList: any[] = []

    if (Array.isArray(rawJson)) {
      rawQuestionsList = rawJson
    } else if (rawJson && typeof rawJson === 'object') {
      if (Array.isArray(rawJson.questions)) {
        rawQuestionsList = rawJson.questions
      } else if (Array.isArray(rawJson.items)) {
        rawQuestionsList = rawJson.items
      } else {
        // Single question object
        rawQuestionsList = [rawJson]
      }
    } else {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['Invalid JSON format: Expected a collection object or an array of questions.'],
      }
    }

    if (rawQuestionsList.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['No questions found in the imported file.'],
      }
    }

    const importedQuestions: QuestionBankItem[] = []
    const now = new Date().toISOString()

    rawQuestionsList.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item #${idx + 1} is not a valid question object.`)
        return
      }

      const prompt =
        item.prompt ||
        item.stem ||
        item.question ||
        item.text ||
        item.title ||
        `Imported Question #${idx + 1}`

      const domain = item.domain || 'Algebra & Functions'
      const chapter = item.chapter || item.cluster || item.unit || 'Linear Equations & Systems'
      const lesson = item.lesson || item.standard || item.competency || 'Single-Variable Linear Equations'
      const difficulty = ['easy', 'medium', 'hard'].includes(item.difficulty?.toLowerCase())
        ? (item.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard')
        : 'medium'

      const questionType = ['multiple_choice', 'multi_select', 'grid_in'].includes(item.questionType || item.type)
        ? (item.questionType || item.type)
        : 'multiple_choice'

      // Normalize choices
      let choices: QuestionChoice[] = []
      if (Array.isArray(item.choices)) {
        choices = item.choices.map((c: any, cIdx: number) => ({
          id: c.id || `c-${idx}-${cIdx}-${Date.now()}`,
          text: typeof c === 'string' ? c : c.text || c.label || `Option ${cIdx + 1}`,
          isCorrect: Boolean(c.isCorrect || c.correct),
          rationale: c.rationale || c.explanation || '',
        }))
      } else if (Array.isArray(item.options)) {
        choices = item.options.map((opt: any, cIdx: number) => {
          const isCorrect =
            item.correct === cIdx ||
            item.correctIndex === cIdx ||
            item.correctAnswer === opt ||
            (typeof opt === 'object' && Boolean(opt.isCorrect))

          return {
            id: `c-${idx}-${cIdx}-${Date.now()}`,
            text: typeof opt === 'string' ? opt : opt.text || opt.label || `Option ${cIdx + 1}`,
            isCorrect,
            rationale: typeof opt === 'object' ? opt.rationale : '',
          }
        })
      }

      // If multiple choice but no choice marked correct, default first choice
      if (questionType !== 'grid_in' && choices.length > 0 && !choices.some((c) => c.isCorrect)) {
        choices[0].isCorrect = true
      }

      const questionItem: QuestionBankItem = {
        id: item.id ? String(item.id) : `qb-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        collection: item.collection || targetCollection,
        domain,
        chapter,
        lesson,
        difficulty,
        questionType,
        calculatorAllowed: Boolean(item.calculatorAllowed ?? item.calculator),
        estimatedSeconds: Number(item.estimatedSeconds || item.timeLimit || 90),
        targetExam: item.targetExam || item.exam || 'EST 1 / SAT Math',
        prompt,
        imageUrl: item.imageUrl || item.image || item.diagram || '',
        imageCaption: item.imageCaption || item.caption || '',
        choices,
        numericAnswer: String(item.numericAnswer || item.correct_answer || item.answer || ''),
        numericTolerance: String(item.numericTolerance || '0'),
        explanation: item.explanation || item.solution || item.derivation || '',
        commonMisconception: item.commonMisconception || item.trap || item.misconception || '',
        createdAt: item.createdAt || now,
        updatedAt: now,
      }

      importedQuestions.push(questionItem)
    })

    if (importedQuestions.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: errors.length > 0 ? errors : ['Failed to extract any valid questions.'],
      }
    }

    // Merge into general question bank repository
    const existing = this.getStoredQuestions()
    // Append or replace matching IDs
    const existingIds = new Set(importedQuestions.map((q) => q.id))
    const merged = [...importedQuestions, ...existing.filter((q) => !existingIds.has(q.id))]
    this.saveQuestions(merged)

    return {
      success: true,
      count: importedQuestions.length,
      collectionName: targetCollection,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  exportCollectionAsJson(collectionName?: string): string {
    const questions = this.getStoredQuestions()
    const exportList = collectionName
      ? questions.filter((q) => (q.collection || 'General Question Bank') === collectionName)
      : questions

    const output = {
      collection_name: collectionName || 'All Math Diagnostic Question Bank',
      exported_at: new Date().toISOString(),
      version: '2.0',
      question_count: exportList.length,
      questions: exportList,
    }

    return JSON.stringify(output, null, 2)
  },

  getSampleCollectionTemplate(): object {
    return {
      collection_name: 'EST 1 Math Diagnostic - Specimen Collection',
      description: 'Curriculum-aligned questions with domains, chapters, lessons and KaTeX support',
      version: '2.0',
      questions: [
        {
          id: 'specimen-01',
          domain: 'Algebra & Functions',
          chapter: 'Quadratic & Polynomial Equations',
          lesson: 'Quadratic Formula & Discriminant Analysis',
          difficulty: 'medium',
          questionType: 'multiple_choice',
          calculatorAllowed: false,
          estimatedSeconds: 90,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ gives exactly one real distinct root?',
          imageUrl: '',
          imageCaption: '',
          choices: [
            {
              id: 'c1',
              text: '$k = 2$',
              isCorrect: true,
              rationale: 'Discriminant 16 - 8k = 0 implies k = 2.',
            },
            {
              id: 'c2',
              text: '$k = 4$',
              isCorrect: false,
              rationale: 'Yields negative discriminant and complex roots.',
            },
            {
              id: 'c3',
              text: '$k = -2$',
              isCorrect: false,
              rationale: 'Sign error on -4ac.',
            },
            {
              id: 'c4',
              text: '$k = 0$',
              isCorrect: false,
              rationale: 'Yields two distinct roots: 0 and 2.',
            },
          ],
          explanation:
            'For exactly one distinct real root, the discriminant must be zero: $\\Delta = b^2 - 4ac = 0$. Here $(-4)^2 - 4(2)(k) = 0 \\implies 16 - 8k = 0 \\implies k = 2$.',
          commonMisconception:
            'Students frequently confuse the condition for two roots ($\\Delta > 0$) with one root ($\\Delta = 0$).',
        },
        {
          id: 'specimen-02',
          domain: 'Geometry & Measurement',
          chapter: 'Circles & Coordinate Geometry',
          lesson: 'Arc Length & Sector Area Calculations',
          difficulty: 'easy',
          questionType: 'grid_in',
          calculatorAllowed: true,
          estimatedSeconds: 60,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'A circle has a radius of $10$. What is the area of a $90^\\circ$ sector divided by $\\pi$?',
          imageUrl: '',
          imageCaption: '',
          choices: [],
          numericAnswer: '25',
          numericTolerance: '0',
          explanation:
            'The area of the circle is $\\pi r^2 = 100\\pi$. A $90^\\circ$ sector is $90/360 = 1/4$ of the circle, so the area is $25\\pi$. Dividing by $\\pi$ gives $25$.',
          commonMisconception:
            'Dividing by diameter rather than squaring radius.',
        },
      ],
    }
  },
}
