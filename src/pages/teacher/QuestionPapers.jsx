import { useState, useEffect, useRef } from 'react'
import {
  Wand2, X, ChevronRight, ChevronLeft, Sparkles, FileText,
  Printer, CheckCircle2, Trash2, Plus, Edit3, Clock, BookOpen,
  BarChart3, Layers, AlertCircle, Download,
} from 'lucide-react'
import useStore from '../../store/useStore'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

// ── Constants ────────────────────────────────────────────────────────────────

const EXAM_TYPES   = ['Unit Test 1', 'Unit Test 2', 'Mid-term', 'Annual']
const DURATIONS    = ['30 min', '1 hour', '1.5 hours', '2 hours', '3 hours']
const MARKS_OPTS   = [25, 50, 75, 100]
const DIFF_PRESETS = [
  { label: 'Easy-Heavy',  easy: 60, medium: 30, hard: 10 },
  { label: 'Balanced',    easy: 33, medium: 34, hard: 33 },
  { label: 'Hard-Heavy',  easy: 20, medium: 30, hard: 50 },
]
const AI_STEPS = [
  'Analyzing syllabus content…',
  'Identifying key topics & concepts…',
  'Distributing marks across sections…',
  'Generating questions…',
  'Formatting question paper…',
]

// ── Mock AI Paper Generator ───────────────────────────────────────────────────

function parseSyllabus(text) {
  return text
    .split('\n')
    .map(l => l.replace(/^(chapter\s*\d+[:.]\s*|topic\s*\d+[:.]\s*|\d+[).]\s*)/i, '').trim())
    .filter(Boolean)
    .slice(0, 8)
}

function mockGenerate(form, syllabus) {
  const topics = parseSyllabus(syllabus)
  const t = (i) => topics[i % Math.max(topics.length, 1)] || 'Core Concept'
  const { totalMarks } = form

  // Scale sections to totalMarks
  const mcqCount   = totalMarks <= 25 ? 5  : totalMarks <= 50 ? 10 : 15
  const shortCount = totalMarks <= 25 ? 3  : totalMarks <= 50 ? 5  : 7
  const longCount  = totalMarks <= 25 ? 1  : totalMarks <= 50 ? 2  : 3
  const mcqMark    = 1
  const shortMark  = totalMarks <= 25 ? 3  : totalMarks <= 50 ? 4  : 5
  const longMark   = totalMarks <= 25 ? 7  : totalMarks <= 50 ? 10 : 15

  const MCQ_TEMPLATES = (topic) => [
    `Which of the following best describes "${topic}"?`,
    `According to the concept of "${topic}", which statement is TRUE?`,
    `"${topic}" is primarily associated with which of the following?`,
    `What is the main purpose of "${topic}"?`,
    `Which factor does NOT affect "${topic}"?`,
  ]
  const SHORT_TEMPLATES = (topic) => [
    `Explain the concept of "${topic}" with a suitable example.`,
    `What are the key characteristics of "${topic}"? Mention any two.`,
    `Differentiate between "${topic}" and a related concept. Give one example each.`,
    `Describe the significance of "${topic}" in real-world applications.`,
  ]
  const LONG_TEMPLATES = (topic) => [
    `Discuss "${topic}" in detail. Include its definition, types, working principle, and at least two real-world applications. Draw a labeled diagram where applicable.`,
    `With the help of a well-labeled diagram, explain "${topic}" comprehensively. Also mention the factors affecting it and its practical importance.`,
  ]

  const mcqs = Array.from({ length: mcqCount }, (_, i) => ({
    id: Date.now() + i,
    text: MCQ_TEMPLATES(t(i))[i % 5],
    marks: mcqMark,
    difficulty: i < mcqCount * 0.5 ? 'easy' : 'medium',
    topic: t(i),
    type: 'mcq',
    options: [
      `It relates to the fundamental principle of ${t(i)}`,
      `It is inversely proportional to the rate of ${t(i)}`,
      `It has no significant effect on ${t(i)}`,
      `It directly governs the mechanism of ${t(i)}`,
    ],
  }))

  const shorts = Array.from({ length: shortCount }, (_, i) => ({
    id: Date.now() + mcqCount + i,
    text: SHORT_TEMPLATES(t(mcqCount + i))[i % 4],
    marks: shortMark,
    difficulty: 'medium',
    topic: t(mcqCount + i),
    type: 'short',
  }))

  const longs = Array.from({ length: longCount }, (_, i) => ({
    id: Date.now() + mcqCount + shortCount + i,
    text: LONG_TEMPLATES(t(mcqCount + shortCount + i))[i % 2],
    marks: longMark,
    difficulty: 'hard',
    topic: t(mcqCount + shortCount + i),
    type: 'long',
  }))

  return [
    {
      id: 'A',
      label: 'Section A — Objective Questions',
      type: 'MCQ',
      instructions: `Attempt all questions. Each question carries ${mcqMark} mark.`,
      questions: mcqs,
    },
    {
      id: 'B',
      label: 'Section B — Short Answer Questions',
      type: 'Short Answer',
      instructions: `Attempt any ${shortCount} questions. Each question carries ${shortMark} marks.`,
      questions: shorts,
    },
    {
      id: 'C',
      label: 'Section C — Long Answer Questions',
      type: 'Long Answer',
      instructions: `Attempt any ${longCount} question(s). Each question carries ${longMark} marks.`,
      questions: longs,
    },
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const diffColor = {
  easy:   { bg: '#e1f5ee', color: '#1d9e75' },
  medium: { bg: '#faeeda', color: '#ba7517' },
  hard:   { bg: '#fcebeb', color: '#a32d2d' },
}
const statusVariant = { draft: 'gray', generated: 'blue', finalized: 'green' }

function totalMarksOfPaper(sections) {
  return sections.reduce((sum, s) => sum + s.questions.reduce((q, qq) => q + qq.marks, 0), 0)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DiffBadge({ difficulty }) {
  const c = diffColor[difficulty] || diffColor.medium
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
      style={{ background: c.bg, color: c.color }}>{difficulty}</span>
  )
}

// ── Generate Modal ────────────────────────────────────────────────────────────

function GenerateModal({ onClose, onDone, classes, subjects }) {
  const [step, setStep]     = useState(1)           // 1 | 2 | 'ai' | 3
  const [aiStep, setAiStep] = useState(0)
  const [form, setForm]     = useState({
    className: classes[0] || 'Class X-A',
    subject:   subjects[0] || 'Mathematics',
    examType:  EXAM_TYPES[0],
    totalMarks: 50,
    duration:  '2 hours',
    diffPreset: 1,  // index into DIFF_PRESETS
  })
  const [syllabus, setSyllabus] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // AI generation simulation
  useEffect(() => {
    if (step !== 'ai') return
    let i = 0
    const id = setInterval(() => {
      i++
      setAiStep(i)
      if (i >= AI_STEPS.length) {
        clearInterval(id)
        setTimeout(() => {
          const sections = mockGenerate(form, syllabus)
          onDone({ ...form, sections })
          onClose()
        }, 600)
      }
    }, 550)
    return () => clearInterval(id)
  }, [step])

  const inputCls   = 'w-full px-3 py-2 border rounded-[7px] text-[13px] outline-none font-dmsans'
  const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-[16px] border w-full max-w-[540px] flex flex-col"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--bdr)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center"
              style={{ background: '#f0ebfe' }}>
              <Wand2 size={14} style={{ color: '#7c3aed' }} />
            </div>
            <span className="font-syne text-[15px] font-semibold">
              {step === 1 ? 'Configure Paper' : step === 2 ? 'Enter Syllabus' : step === 'ai' ? 'Generating…' : 'Done'}
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>

        {/* Step indicator */}
        {step !== 'ai' && (
          <div className="flex items-center gap-2 px-5 pt-4 flex-shrink-0">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{
                    background: step >= s ? '#7c3aed' : 'var(--bdr)',
                    color: step >= s ? '#fff' : 'var(--lgt)',
                  }}>{s}</div>
                <span className="text-[11px]" style={{ color: step >= s ? 'var(--txt)' : 'var(--lgt)' }}>
                  {s === 1 ? 'Configure' : 'Syllabus'}
                </span>
                {s < 2 && <div className="w-8 h-px" style={{ background: 'var(--bdr)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Step 1 — Configure */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Class</label>
                  <select className={inputCls} style={inputStyle} value={form.className} onChange={e => set('className', e.target.value)}>
                    {classes.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Subject</label>
                  <select className={inputCls} style={inputStyle} value={form.subject} onChange={e => set('subject', e.target.value)}>
                    {subjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Exam Type</label>
                  <select className={inputCls} style={inputStyle} value={form.examType} onChange={e => set('examType', e.target.value)}>
                    {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Duration</label>
                  <select className={inputCls} style={inputStyle} value={form.duration} onChange={e => set('duration', e.target.value)}>
                    {DURATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--mut)' }}>Total Marks</label>
                <div className="flex gap-2">
                  {MARKS_OPTS.map(m => (
                    <button key={m} onClick={() => set('totalMarks', m)}
                      className="flex-1 py-2 rounded-[7px] text-[13px] font-medium border transition-all"
                      style={{
                        background: form.totalMarks === m ? '#7c3aed' : 'var(--bg)',
                        borderColor: form.totalMarks === m ? '#7c3aed' : 'var(--bdr)',
                        color: form.totalMarks === m ? '#fff' : 'var(--txt)',
                      }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--mut)' }}>Difficulty Distribution</label>
                <div className="flex gap-2">
                  {DIFF_PRESETS.map((p, i) => (
                    <button key={p.label} onClick={() => set('diffPreset', i)}
                      className="flex-1 py-2.5 rounded-[8px] border text-[11px] transition-all"
                      style={{
                        background: form.diffPreset === i ? '#f0ebfe' : 'var(--bg)',
                        borderColor: form.diffPreset === i ? '#7c3aed' : 'var(--bdr)',
                        color: form.diffPreset === i ? '#7c3aed' : 'var(--mut)',
                        fontWeight: form.diffPreset === i ? 600 : 400,
                      }}>
                      <div>{p.label}</div>
                      <div className="mt-1 opacity-70">{p.easy}% · {p.medium}% · {p.hard}%</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 mt-2">
                  {(['easy','medium','hard']).map((d, i) => {
                    const p = DIFF_PRESETS[form.diffPreset]
                    const w = [p.easy, p.medium, p.hard][i]
                    return <div key={d} className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${w}%`, background: Object.values(diffColor)[i].color }} />
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Syllabus */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-[9px] px-3 py-2.5 flex gap-2 text-[12px]"
                style={{ background: '#f0ebfe', border: '1px solid #c4b5fd', color: '#7c3aed' }}>
                <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
                <div>Paste your syllabus or list the topics. AI will generate a complete question paper with sections, marks distribution, and difficulty tags.</div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>
                  Syllabus / Topics *
                </label>
                <textarea
                  rows={10}
                  value={syllabus}
                  onChange={e => setSyllabus(e.target.value)}
                  placeholder={`e.g.\nChapter 1: Newton's Laws of Motion\nChapter 2: Work, Energy and Power\nChapter 3: Properties of Matter\nChapter 4: Waves and Sound`}
                  className={inputCls + ' resize-none leading-relaxed'}
                  style={{ ...inputStyle, minHeight: '220px' }}
                />
                <div className="text-[10px] mt-1" style={{ color: 'var(--lgt)' }}>
                  One topic per line. Chapter headings, bullet points, or plain text all work.
                </div>
              </div>
            </div>
          )}

          {/* AI Generation Step */}
          {step === 'ai' && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              {/* Animated rings */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#c4b5fd', borderTopColor: 'transparent' }} />
                <div className="absolute inset-2 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#7c3aed', borderTopColor: 'transparent', animationDirection: 'reverse', animationDuration: '0.7s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wand2 size={20} style={{ color: '#7c3aed' }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-[15px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>AI is working…</div>
                <div className="text-[13px] h-5 transition-all duration-300" style={{ color: '#7c3aed' }}>
                  {AI_STEPS[Math.min(aiStep, AI_STEPS.length - 1)]}
                </div>
              </div>
              {/* Progress steps */}
              <div className="w-full flex flex-col gap-1.5">
                {AI_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2.5 text-[11px] transition-all duration-300"
                    style={{ color: i < aiStep ? 'var(--teal)' : i === aiStep ? 'var(--txt)' : 'var(--lgt)' }}>
                    {i < aiStep
                      ? <CheckCircle2 size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      : <div className="w-[13px] h-[13px] rounded-full border flex-shrink-0"
                          style={{ borderColor: i === aiStep ? '#7c3aed' : 'var(--bdr)',
                            background: i === aiStep ? '#f0ebfe' : 'transparent' }} />
                    }
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'ai' && (
          <div className="px-5 py-3 border-t flex justify-between gap-2 flex-shrink-0"
            style={{ borderColor: 'var(--bdr)' }}>
            <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(1)}>
              {step === 1 ? 'Cancel' : <><ChevronLeft size={13} className="mr-1" /> Back</>}
            </Button>
            {step === 1 && (
              <Button variant="primary" onClick={() => setStep(2)}
                style={{ background: '#7c3aed' }}>
                Next <ChevronRight size={13} className="ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary"
                disabled={!syllabus.trim()}
                onClick={() => setStep('ai')}
                style={{ background: syllabus.trim() ? '#7c3aed' : undefined }}>
                <Wand2 size={13} className="mr-1.5" /> Generate with AI
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Paper Detail / Edit View ──────────────────────────────────────────────────

function EditQuestionModal({ question, onSave, onClose }) {
  const [text, setText] = useState(question.text)
  const [marks, setMarks] = useState(question.marks)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-[14px] border w-full max-w-[480px]"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <span className="font-syne text-[14px] font-semibold">Edit Question</span>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Question Text</label>
            <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
              className="w-full px-3 py-2 border rounded-[7px] text-[13px] outline-none resize-none font-dmsans"
              style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Marks</label>
            <input type="number" min={1} max={20} value={marks} onChange={e => setMarks(+e.target.value)}
              className="w-24 px-3 py-2 border rounded-[7px] text-[13px] outline-none font-dmsans"
              style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onSave({ ...question, text, marks }); onClose() }}>Save</Button>
        </div>
      </div>
    </div>
  )
}

function PaperDetail({ paper, onClose, onUpdate }) {
  const [sections, setSections]   = useState(paper.sections)
  const [editingQ, setEditingQ]   = useState(null)
  const [showPrint, setShowPrint] = useState(false)
  const toast = useStore(s => s.toast)

  const totalMarks = sections.reduce((sum, s) => sum + s.questions.reduce((q, qq) => q + qq.marks, 0), 0)
  const totalQs    = sections.reduce((sum, s) => sum + s.questions.length, 0)

  const updateQuestion = (secId, updated) => {
    setSections(prev => prev.map(s =>
      s.id === secId ? { ...s, questions: s.questions.map(q => q.id === updated.id ? updated : q) } : s
    ))
  }
  const deleteQuestion = (secId, qId) => {
    setSections(prev => prev.map(s =>
      s.id === secId ? { ...s, questions: s.questions.filter(q => q.id !== qId) } : s
    ))
  }
  const finalize = () => {
    onUpdate({ ...paper, sections, status: 'finalized' })
    toast('success', 'Question paper finalized and ready to print')
    onClose()
  }
  const saveEdits = () => {
    onUpdate({ ...paper, sections })
    toast('success', 'Changes saved')
  }

  if (showPrint) return (
    <PrintPreview paper={{ ...paper, sections }} onClose={() => setShowPrint(false)} />
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      {editingQ && (
        <EditQuestionModal
          question={editingQ.q}
          onClose={() => setEditingQ(null)}
          onSave={updated => { updateQuestion(editingQ.secId, updated); setEditingQ(null) }}
        />
      )}

      <div className="rounded-[16px] border w-full max-w-[680px] flex flex-col"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--bdr)' }}>
          <div>
            <div className="font-syne text-[15px] font-semibold">{paper.subject} — {paper.examType}</div>
            <div className="text-[11px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: 'var(--mut)' }}>
              <span>{paper.className}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {paper.duration}</span>
              <span className="flex items-center gap-1"><BarChart3 size={10} /> {totalMarks} marks</span>
              <span className="flex items-center gap-1"><FileText size={10} /> {totalQs} questions</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[paper.status] || 'gray'} className="capitalize">{paper.status}</Badge>
            <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {sections.map(sec => (
            <div key={sec.id}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-syne text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>{sec.label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{sec.instructions}</div>
                </div>
                <div className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg)', color: 'var(--mut)', border: '1px solid var(--bdr)' }}>
                  {sec.questions.reduce((s, q) => s + q.marks, 0)} marks
                </div>
              </div>

              {/* Questions */}
              <div className="flex flex-col gap-2">
                {sec.questions.map((q, qi) => (
                  <div key={q.id} className="rounded-[9px] border p-3 group"
                    style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[11px] font-semibold mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--lgt)' }}>Q{qi + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] leading-snug">{q.text}</div>
                        {q.type === 'mcq' && (
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.options?.map((opt, oi) => (
                              <div key={oi} className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--mut)' }}>
                                <span className="font-medium">{String.fromCharCode(65 + oi)}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <DiffBadge difficulty={q.difficulty} />
                          <span className="text-[10px]" style={{ color: 'var(--lgt)' }}>{q.topic}</span>
                          <span className="ml-auto text-[11px] font-medium" style={{ color: 'var(--pri)' }}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setEditingQ({ secId: sec.id, q })}
                          className="p-1.5 rounded-[5px] hover:bg-white transition-colors"
                          style={{ color: 'var(--mut)' }}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => deleteQuestion(sec.id, q.id)}
                          className="p-1.5 rounded-[5px] hover:bg-white transition-colors"
                          style={{ color: 'var(--red)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t flex flex-wrap items-center gap-2 flex-shrink-0"
          style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" className="text-[12px]" onClick={onClose}>Close</Button>
          <Button variant="outline" className="text-[12px]" onClick={saveEdits}>Save Edits</Button>
          <div className="flex-1" />
          <Button variant="outline" className="text-[12px]" onClick={() => setShowPrint(true)}>
            <Printer size={12} className="mr-1.5" /> Print Preview
          </Button>
          {paper.status !== 'finalized' && (
            <Button variant="primary" className="text-[12px]" onClick={finalize}>
              <CheckCircle2 size={12} className="mr-1.5" /> Finalize Paper
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Print Preview ─────────────────────────────────────────────────────────────

function PrintPreview({ paper, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-[16px] border w-full max-w-[680px] flex flex-col"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', maxHeight: '92vh' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--bdr)', background: 'var(--bg)' }}>
          <span className="text-[13px] font-medium">Print Preview</span>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium text-white"
              style={{ background: 'var(--pri)' }}>
              <Printer size={12} /> Print
            </button>
            <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
          </div>
        </div>

        {/* Paper content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: '#eee' }}>
          <div className="bg-white rounded-[8px] shadow p-8 mx-auto" style={{ maxWidth: 600, fontFamily: 'Georgia, serif' }}>
            {/* School header */}
            <div className="text-center border-b-2 pb-4 mb-6" style={{ borderColor: '#1a3a5c' }}>
              <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#6b6960' }}>EduFlow Academy</div>
              <div className="text-[20px] font-bold" style={{ color: '#1a3a5c' }}>{paper.subject}</div>
              <div className="text-[13px] mt-1" style={{ color: '#6b6960' }}>{paper.examType} Examination · {paper.className}</div>
              <div className="flex justify-center gap-8 mt-3 text-[12px]" style={{ color: '#1c1b18' }}>
                <span>Time: {paper.duration}</span>
                <span>Max. Marks: {paper.sections.reduce((s, sec) => s + sec.questions.reduce((q, qq) => q + qq.marks, 0), 0)}</span>
              </div>
            </div>

            <div className="text-[11px] italic mb-6" style={{ color: '#6b6960' }}>
              General Instructions: Read all questions carefully. Write neatly. Marks are indicated in brackets.
            </div>

            {paper.sections.map((sec, si) => (
              <div key={sec.id} className="mb-8">
                <div className="text-[14px] font-bold mb-1" style={{ fontFamily: 'sans-serif', color: '#1a3a5c' }}>{sec.label}</div>
                <div className="text-[11px] italic mb-4" style={{ color: '#6b6960' }}>{sec.instructions}</div>
                {sec.questions.map((q, qi) => (
                  <div key={q.id} className="mb-5">
                    <div className="text-[13px] flex gap-2">
                      <span className="font-bold flex-shrink-0">{si === 0 ? qi + 1 : `${si + 1}.${qi + 1}`}.</span>
                      <div className="flex-1">
                        {q.text}
                        <span className="ml-2 text-[11px]" style={{ color: '#6b6960' }}>({q.marks} {q.marks > 1 ? 'marks' : 'mark'})</span>
                        {q.type === 'mcq' && (
                          <div className="mt-2 grid grid-cols-2 gap-y-1">
                            {q.options?.map((opt, oi) => (
                              <div key={oi} className="text-[12px]">({String.fromCharCode(97 + oi)}) {opt}</div>
                            ))}
                          </div>
                        )}
                        {q.type !== 'mcq' && (
                          <div className="mt-3 border-t" style={{ borderColor: '#ddd', paddingTop: '40px' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="text-center text-[11px] mt-8 pt-4 border-t" style={{ color: '#6b6960', borderColor: '#ddd' }}>
              — End of Question Paper —
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DEMO_CLASSES  = ['Class X-A', 'Class X-B', 'Class XI-A', 'Class XI-B', 'Class XII-A']
const DEMO_SUBJECTS = ['Mathematics', 'Physics / Science', 'English Literature', 'Hindi', 'Social Studies', 'Chemistry', 'Biology']

export default function QuestionPapers() {
  const [papers, setPapers]           = useState([])
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [tab, setTab]                 = useState('all')

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  useEffect(() => {
    setTopbarAction(() => setShowGenerate(true))
    return () => setTopbarAction(null)
  }, [])

  const handleDone = (paperData) => {
    const paper = {
      id: Date.now(),
      ...paperData,
      status: 'generated',
      createdAt: new Date(),
    }
    setPapers(prev => [paper, ...prev])
    setSelectedPaper(paper)
    toast('success', `"${paperData.subject} — ${paperData.examType}" generated successfully`)
  }

  const handleUpdate = (updated) => {
    setPapers(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedPaper(updated)
  }

  const handleDelete = (id) => {
    setPapers(prev => prev.filter(p => p.id !== id))
    toast('success', 'Question paper deleted')
  }

  const filtered = papers.filter(p => tab === 'all' || p.status === tab)
  const counts   = {
    all: papers.length,
    generated: papers.filter(p => p.status === 'generated').length,
    finalized: papers.filter(p => p.status === 'finalized').length,
  }

  return (
    <div>
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onDone={handleDone}
          classes={DEMO_CLASSES}
          subjects={DEMO_SUBJECTS}
        />
      )}
      {selectedPaper && (
        <PaperDetail
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Upcoming AI banner */}
      <div className="flex items-start gap-3 rounded-[10px] px-4 py-3 mb-4 border"
        style={{ background: '#f0ebfe', borderColor: '#c4b5fd' }}>
        <Sparkles size={16} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div className="text-[13px] font-semibold" style={{ color: '#7c3aed' }}>AI Question Paper Generator — Early Preview</div>
          <div className="text-[12px] mt-0.5" style={{ color: '#6d28d9' }}>
            Paste your syllabus and AI will generate a full question paper with sections, difficulty levels, and marks distribution. Full integration coming soon.
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: '#7c3aed', color: '#fff' }}>BETA</span>
      </div>

      <Card>
        <CardHeader title="Question Papers">
          <Button variant="primary" className="text-[11px]"
            style={{ background: '#7c3aed' }}
            onClick={() => setShowGenerate(true)}>
            <Wand2 size={12} className="mr-1.5" /> Generate with AI
          </Button>
        </CardHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b" style={{ borderColor: 'var(--bdr)' }}>
          {[['all','All'], ['generated','Generated'], ['finalized','Finalized']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-3 py-2 text-[12px] font-medium rounded-t-[6px] border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === key ? '#7c3aed' : 'transparent',
                color: tab === key ? '#7c3aed' : 'var(--mut)',
                background: 'transparent',
              }}>
              {label}
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: tab === key ? '#f0ebfe' : 'var(--bg)', color: tab === key ? '#7c3aed' : 'var(--lgt)' }}>
                {counts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center"
                style={{ background: '#f0ebfe' }}>
                <Wand2 size={24} style={{ color: '#7c3aed' }} />
              </div>
              <div className="text-[14px] font-medium" style={{ color: 'var(--txt)' }}>No question papers yet</div>
              <div className="text-[12px] text-center max-w-[280px]" style={{ color: 'var(--mut)' }}>
                Click "Generate with AI", enter your syllabus, and get a full question paper in seconds.
              </div>
              <Button variant="primary" className="mt-2 text-[12px]"
                style={{ background: '#7c3aed' }}
                onClick={() => setShowGenerate(true)}>
                <Wand2 size={12} className="mr-1.5" /> Generate your first paper
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map(p => {
                const total = p.sections.reduce((s, sec) => s + sec.questions.reduce((q, qq) => q + qq.marks, 0), 0)
                const qCount = p.sections.reduce((s, sec) => s + sec.questions.length, 0)
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 rounded-[10px] border p-3.5 cursor-pointer hover:shadow-sm transition-all group"
                    style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
                    onClick={() => setSelectedPaper(p)}>
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0"
                      style={{ background: p.status === 'finalized' ? '#e1f5ee' : '#f0ebfe' }}>
                      {p.status === 'finalized'
                        ? <CheckCircle2 size={16} style={{ color: '#1d9e75' }} />
                        : <Wand2 size={16} style={{ color: '#7c3aed' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{p.subject} — {p.examType}</div>
                      <div className="text-[11px] mt-0.5 flex flex-wrap items-center gap-2" style={{ color: 'var(--mut)' }}>
                        <span>{p.className}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {p.duration}</span>
                        <span>·</span>
                        <span>{qCount} questions · {total} marks</span>
                      </div>
                    </div>
                    <Badge variant={statusVariant[p.status]} className="capitalize flex-shrink-0">{p.status}</Badge>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                      className="p-1.5 rounded-[5px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--red)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
