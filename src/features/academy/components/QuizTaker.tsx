// Phase 3 — Winners Academy — QuizTaker.tsx
// Embeddable quiz component for students inside CoursePage

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../../lib/api';
import { getAuthHeaders } from '../../auth/authStore';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

interface AttemptResult {
  score: number;
  passed: boolean;
  answers: Array<{ questionId: string; correct: boolean; points: number }>;
}

interface QuizTakerProps {
  courseId: string;
}

export default function QuizTaker({ courseId }: QuizTakerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    void fetchQuizzes();
  }, [courseId]);

  useEffect(() => {
    if (!started || timeLeft === null) return;
    if (timeLeft <= 0) {
      void submitQuiz();
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => (p ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [started, timeLeft]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${API_BASE}/quizzes/courses/${courseId}/quizzes`);
      if (!res.ok) throw new Error();
      const data = await res.json() as Quiz[];
      setQuizzes(data);
    } catch {
      // non-critical; quizzes may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setResult(null);
    setStarted(true);
    setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  };

  const submitQuiz = useCallback(async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${activeQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error('Failed to submit quiz');
      const data = await res.json() as AttemptResult;
      setResult(data);
      setStarted(false);
    } catch {
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }, [activeQuiz, answers]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
        Loading quizzes…
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 6, color: 'var(--text-dim)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
        No quizzes for this course yet
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .qt { display: flex; flex-direction: column; gap: 20px; }
        .qt-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
          padding: 18px; position: relative; overflow: hidden;
        }
        .qt-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
        .qt-quiz-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 5px; transition: border-color 200ms ease;
        }
        .qt-quiz-row:hover { border-color: var(--gold); }
        .qt-quiz-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
        .qt-quiz-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 3px; }
        .qt-btn {
          padding: 8px 16px; border-radius: 5px; border: none; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase;
          transition: all 200ms ease;
        }
        .qt-btn-gold { background: var(--gold); color: var(--bg); }
        .qt-btn-gold:hover { opacity: 0.88; }
        .qt-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
        .qt-q-block {
          padding: 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 5px; margin-bottom: 14px;
        }
        .qt-q-text { font-family: 'Syne', sans-serif; font-size: 15px; color: var(--text); margin-bottom: 12px; }
        .qt-option {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 5px; border: 1px solid var(--border); background: var(--surface);
          cursor: pointer; transition: all 200ms ease; margin-bottom: 7px;
        }
        .qt-option:hover { border-color: var(--gold); }
        .qt-option.selected { border-color: var(--gold); background: rgba(201,168,76,0.1); }
        .qt-option-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
        .qt-option-text { font-family: 'Syne', sans-serif; font-size: 14px; color: var(--text); }
        .qt-short-input {
          width: 100%; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 4px; color: var(--text); font-family: 'Syne', sans-serif; font-size: 14px;
        }
        .qt-short-input:focus { outline: none; border-color: var(--gold); }
        .qt-timer { font-family: 'Space Mono', monospace; font-size: 12px; padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border); }
        .qt-timer.warn { border-color: var(--red); color: var(--red); }
        .qt-result {
          text-align: center; padding: 28px 20px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; position: relative; overflow: hidden;
        }
        .qt-result::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
        .qt-score { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 600; }
        .qt-passed { color: var(--green); }
        .qt-failed { color: var(--red); }
      `}</style>

      <div className="qt">
        {!activeQuiz && !result && (
          <>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              Course Quizzes
            </div>
            {quizzes.map((q) => (
              <div key={q.id} className="qt-quiz-row">
                <div>
                  <div className="qt-quiz-title">{q.title}</div>
                  <div className="qt-quiz-meta">
                    {q.questions.length} questions · Pass: {q.passingScore}%
                    {q.timeLimit ? ` · ${q.timeLimit} min limit` : ''}
                  </div>
                </div>
                <button className="qt-btn qt-btn-gold" onClick={() => startQuiz(q)}>
                  Start
                </button>
              </div>
            ))}
          </>
        )}

        {activeQuiz && started && !result && (
          <div className="qt-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {activeQuiz.title}
              </div>
              {timeLeft !== null && (
                <div className={`qt-timer${timeLeft < 60 ? ' warn' : ''}`}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {activeQuiz.questions.map((q, i) => (
              <div key={q.id} className="qt-q-block">
                <div className="qt-q-text">
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--gold)', marginRight: 8 }}>Q{i + 1}</span>
                  {q.question}
                </div>

                {q.type === 'MULTIPLE_CHOICE' && q.options?.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`qt-option${answers[q.id] === opt ? ' selected' : ''}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  >
                    <span className="qt-option-label">{String.fromCharCode(65 + oi)}</span>
                    <span className="qt-option-text">{opt}</span>
                  </div>
                ))}

                {q.type === 'TRUE_FALSE' && (['true', 'false'] as const).map((v) => (
                  <div
                    key={v}
                    className={`qt-option${answers[q.id] === v ? ' selected' : ''}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  >
                    <span className="qt-option-text" style={{ textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}

                {q.type === 'SHORT_ANSWER' && (
                  <input
                    className="qt-short-input"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer…"
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="qt-btn qt-btn-gold"
                onClick={() => void submitQuiz()}
                disabled={submitting || Object.keys(answers).length === 0}
              >
                {submitting ? 'Submitting…' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}

        {result && activeQuiz && (
          <div className="qt-result">
            <div style={{ fontSize: 36, marginBottom: 8 }}>{result.passed ? '🏆' : '📚'}</div>
            <div className={`qt-score ${result.passed ? 'qt-passed' : 'qt-failed'}`}>
              {result.score}%
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: result.passed ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
              {result.passed ? 'Passed!' : 'Not passed'}
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>
              Passing score: {activeQuiz.passingScore}% · Your score: {result.score}%
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="qt-btn qt-btn-gold" onClick={() => { setResult(null); startQuiz(activeQuiz); }}>
                Retake
              </button>
              <button
                className="qt-btn"
                style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)' }}
                onClick={() => { setResult(null); setActiveQuiz(null); }}
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
