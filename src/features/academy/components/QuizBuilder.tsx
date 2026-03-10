// Phase 3 — Winners Academy — QuizBuilder.tsx
// Instructor tool: create/edit quizzes and questions for a course

import { useState, useEffect } from 'react';
import { API_BASE } from '../../../lib/api';
import { getAuthHeaders } from '../../auth/authStore';

interface QuizQuestion {
  id?: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

interface QuizBuilderProps {
  courseId: string;
}

const BLANK_QUESTION: QuizQuestion = {
  question: '',
  type: 'MULTIPLE_CHOICE',
  options: ['', '', '', ''],
  correctAnswer: '',
  points: 1,
  explanation: '',
};

export default function QuizBuilder({ courseId }: QuizBuilderProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizPassScore, setNewQuizPassScore] = useState(70);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    void fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/quizzes/courses/${courseId}/quizzes`);
      if (!res.ok) throw new Error('Failed to load quizzes');
      const data = await res.json() as Quiz[];
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          courseId,
          title: newQuizTitle.trim(),
          passingScore: newQuizPassScore,
        }),
      });
      if (!res.ok) throw new Error('Failed to create quiz');
      const quiz = await res.json() as Quiz;
      setQuizzes((prev) => [...prev, { ...quiz, questions: [] }]);
      setActiveQuiz({ ...quiz, questions: [] });
      setShowNewQuiz(false);
      setNewQuizTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!activeQuiz || !editingQuestion) return;
    if (!editingQuestion.question.trim() || !editingQuestion.correctAnswer.trim()) {
      setError('Question text and correct answer are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${activeQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          question: editingQuestion.question,
          type: editingQuestion.type,
          options: editingQuestion.type === 'MULTIPLE_CHOICE' ? editingQuestion.options?.filter(Boolean) : undefined,
          correctAnswer: editingQuestion.correctAnswer,
          points: editingQuestion.points,
          explanation: editingQuestion.explanation || undefined,
          order: editingIndex !== null ? editingIndex + 1 : (activeQuiz.questions.length + 1),
        }),
      });
      if (!res.ok) throw new Error('Failed to save question');
      const saved = await res.json() as QuizQuestion;
      const updated = [...activeQuiz.questions];
      if (editingIndex !== null) {
        updated[editingIndex] = saved;
      } else {
        updated.push(saved);
      }
      const updatedQuiz = { ...activeQuiz, questions: updated };
      setActiveQuiz(updatedQuiz);
      setQuizzes((prev) => prev.map((q) => q.id === activeQuiz.id ? updatedQuiz : q));
      setEditingQuestion(null);
      setEditingIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    try {
      await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (activeQuiz?.id === quizId) setActiveQuiz(null);
    } catch {
      setError('Failed to delete quiz');
    }
  };

  const s: React.CSSProperties = {};
  void s;

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
        Loading quizzes…
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .qb { display: flex; flex-direction: column; gap: 20px; }
        .qb-header { display: flex; justify-content: space-between; align-items: center; }
        .qb-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); }
        .qb-btn {
          padding: 8px 14px; border-radius: 5px; border: none; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
          transition: all 200ms ease;
        }
        .qb-btn-gold { background: var(--gold); color: var(--bg); }
        .qb-btn-gold:hover { opacity: 0.88; }
        .qb-btn-outline { background: transparent; border: 1px solid var(--border) !important; color: var(--text-dim); }
        .qb-btn-outline:hover { border-color: var(--gold) !important; color: var(--gold); }
        .qb-btn-red { background: transparent; border: 1px solid var(--red) !important; color: var(--red); }
        .qb-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
          padding: 16px; position: relative; overflow: hidden;
        }
        .qb-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
        .qb-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .qb-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .qb-input, .qb-select, .qb-textarea {
          font-family: 'Syne', sans-serif; font-size: 14px; padding: 10px 12px;
          background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);
        }
        .qb-input:focus, .qb-select:focus, .qb-textarea:focus { outline: none; border-color: var(--gold); }
        .qb-textarea { min-height: 70px; resize: vertical; }
        .qb-option-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
        .qb-option-lbl { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); width: 20px; flex-shrink: 0; }
        .qb-err { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); padding: 8px 12px; border-radius: 4px; border: 1px solid var(--red); background: rgba(224,90,78,0.08); }
        .qb-q-row {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
          padding: 12px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 5px; margin-bottom: 8px;
        }
        .qb-q-text { font-family: 'Syne', sans-serif; font-size: 14px; color: var(--text); flex: 1; }
        .qb-q-pts { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--gold); flex-shrink: 0; }
        .qb-quiz-tab {
          padding: 10px 16px; border-radius: 5px; border: 1px solid var(--border);
          background: var(--surface2); cursor: pointer; font-family: 'Space Mono', monospace;
          font-size: 11px; color: var(--text-dim); transition: all 200ms ease; text-align: left;
        }
        .qb-quiz-tab.active { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
        .qb-quiz-tab:hover { border-color: var(--gold); }
      `}</style>

      <div className="qb">
        <div className="qb-header">
          <div className="qb-title">Quiz Builder</div>
          <button className="qb-btn qb-btn-gold" onClick={() => setShowNewQuiz(true)}>+ New Quiz</button>
        </div>

        {error && <div className="qb-err">⚠ {error}</div>}

        {showNewQuiz && (
          <div className="qb-card">
            <div className="qb-field">
              <label className="qb-label">Quiz Title</label>
              <input
                className="qb-input"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                placeholder="e.g., Module 1 Assessment"
                autoFocus
              />
            </div>
            <div className="qb-field">
              <label className="qb-label">Passing Score (%)</label>
              <input
                type="number"
                className="qb-input"
                value={newQuizPassScore}
                onChange={(e) => setNewQuizPassScore(Number(e.target.value))}
                min={50}
                max={100}
                style={{ width: 100 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="qb-btn qb-btn-gold" onClick={() => void createQuiz()} disabled={saving || !newQuizTitle.trim()}>
                {saving ? 'Creating…' : 'Create Quiz'}
              </button>
              <button className="qb-btn qb-btn-outline" onClick={() => { setShowNewQuiz(false); setNewQuizTitle(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {quizzes.length === 0 && !showNewQuiz && (
          <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 6, color: 'var(--text-dim)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
            No quizzes yet — click + New Quiz to add one
          </div>
        )}

        {quizzes.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quizzes.map((q) => (
              <button
                key={q.id}
                className={`qb-quiz-tab${activeQuiz?.id === q.id ? ' active' : ''}`}
                onClick={() => setActiveQuiz(q)}
              >
                {q.title} ({q.questions.length} questions)
              </button>
            ))}
          </div>
        )}

        {activeQuiz && (
          <div className="qb-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {activeQuiz.title}
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-dim)', marginLeft: 10 }}>
                  Pass: {activeQuiz.passingScore}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="qb-btn qb-btn-gold" onClick={() => { setEditingQuestion({ ...BLANK_QUESTION }); setEditingIndex(null); }}>
                  + Question
                </button>
                <button className="qb-btn qb-btn-red" style={{ border: '1px solid' }} onClick={() => void deleteQuiz(activeQuiz.id)}>
                  Delete
                </button>
              </div>
            </div>

            {activeQuiz.questions.length === 0 && !editingQuestion && (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)', padding: '16px 0' }}>
                No questions yet — click + Question to add one
              </div>
            )}

            {activeQuiz.questions.map((q, i) => (
              <div key={q.id ?? i} className="qb-q-row">
                <div>
                  <div className="qb-q-text">Q{i + 1}. {q.question}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                    {q.type.replace('_', ' ')} · Answer: {q.correctAnswer}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="qb-q-pts">{q.points}pt{q.points !== 1 ? 's' : ''}</span>
                  <button className="qb-btn qb-btn-outline" style={{ border: '1px solid' }} onClick={() => { setEditingQuestion({ ...q }); setEditingIndex(i); }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}

            {editingQuestion && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <div className="qb-field">
                  <label className="qb-label">Question Text</label>
                  <textarea
                    className="qb-textarea"
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    placeholder="Enter the question…"
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="qb-field" style={{ marginBottom: 0 }}>
                    <label className="qb-label">Type</label>
                    <select
                      className="qb-select"
                      value={editingQuestion.type}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        type: e.target.value as QuizQuestion['type'],
                        options: e.target.value === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : undefined,
                        correctAnswer: '',
                      })}
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>
                  <div className="qb-field" style={{ marginBottom: 0 }}>
                    <label className="qb-label">Points</label>
                    <input
                      type="number"
                      className="qb-input"
                      value={editingQuestion.points}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                      min={1} max={10}
                    />
                  </div>
                </div>

                {editingQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="qb-field">
                    <label className="qb-label">Options</label>
                    {(editingQuestion.options ?? ['', '', '', '']).map((opt, oi) => (
                      <div key={oi} className="qb-option-row">
                        <span className="qb-option-lbl">{String.fromCharCode(65 + oi)}.</span>
                        <input
                          className="qb-input"
                          style={{ flex: 1 }}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options ?? ['', '', '', ''])];
                            newOpts[oi] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        />
                      </div>
                    ))}
                    <div className="qb-field" style={{ marginTop: 8 }}>
                      <label className="qb-label">Correct Answer (type exactly as above)</label>
                      <input
                        className="qb-input"
                        value={editingQuestion.correctAnswer}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                        placeholder="Must match one of the options above"
                      />
                    </div>
                  </div>
                )}

                {editingQuestion.type === 'TRUE_FALSE' && (
                  <div className="qb-field">
                    <label className="qb-label">Correct Answer</label>
                    <select
                      className="qb-select"
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                    >
                      <option value="">Select…</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}

                {editingQuestion.type === 'SHORT_ANSWER' && (
                  <div className="qb-field">
                    <label className="qb-label">Expected Answer (key phrase)</label>
                    <input
                      className="qb-input"
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                      placeholder="Key word or phrase that must appear in the answer"
                    />
                  </div>
                )}

                <div className="qb-field">
                  <label className="qb-label">Explanation (optional)</label>
                  <textarea
                    className="qb-textarea"
                    style={{ minHeight: 50 }}
                    value={editingQuestion.explanation ?? ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    placeholder="Explain why this is the correct answer…"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="qb-btn qb-btn-gold" onClick={() => void saveQuestion()} disabled={saving}>
                    {saving ? 'Saving…' : editingIndex !== null ? 'Update Question' : 'Add Question'}
                  </button>
                  <button className="qb-btn qb-btn-outline" style={{ border: '1px solid' }} onClick={() => { setEditingQuestion(null); setEditingIndex(null); setError(null); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
