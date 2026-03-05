// Phase 3: Winners Academy · learn.winnersempire.io
// QuizEngine.tsx — Interactive quiz component for certification

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE';
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

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  percentage: number;
  passed: boolean;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
  timeTakenSecs?: number;
  startedAt: string;
  completedAt?: string;
}

const QuizEngine = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/academy/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load quiz');
        
        const data = await response.json();
        setQuiz(data);
        
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit * 60);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const answers = quiz.questions.map(q => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers[q.id] || '',
      isCorrect: selectedAnswers[q.id] === q.options?.[0]
    }));

    const score = answers.filter(a => a.isCorrect).reduce((acc, a) => acc + (quiz.questions.find(q => q.id === a.questionId)?.points || 0), 0);
    const maxScore = quiz.questions.reduce((acc, q) => acc + q.points, 0);
    const percentage = Math.round((score / maxScore) * 100);

    try {
      const response = await fetch(`/api/v1/academy/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          timeTakenSecs: quiz.timeLimit ? (quiz.timeLimit * 60 - timeRemaining) : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to submit quiz');

      const result = await response.json();
      setResult(result);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="skeleton" style={{ height: 200 }} />
        <div className="skeleton" style={{ height: 100, marginTop: 16 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (isSubmitted && result) {
    return (
      <div className="quiz-result">
        <div className={`result-card ${result.passed ? 'passed' : 'failed'}`}>
          <h2>{result.passed ? '🎉 Congratulations!' : '📚 Keep Learning'}</h2>
          
          <div className="score-display">
            <div className="score-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke={result.passed ? 'var(--green)' : 'var(--red)'} 
                  strokeWidth="8"
                  strokeDasharray={`${result.percentage * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span className="score-text">{result.percentage}%</span>
            </div>
            <p className="score-label">{result.passed ? 'Quiz Passed' : `Needs ${quiz.passingScore}% to pass`}</p>
          </div>

          <div className="answer-review">
            <h3>Review Your Answers</h3>
            {quiz.questions.map((q, idx) => {
              const answer = result.answers.find(a => a.questionId === q.id);
              return (
                <div key={q.id} className={`answer-item ${answer?.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span className="question-num">Q{idx + 1}</span>
                  <span className="question-text">{q.question}</span>
                  <span className="answer-status">{answer?.isCorrect ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>

          {!result.passed && (
            <div className="retry-cta">
              <p>Review the material and try again. SAGE can help you understand the concepts you missed.</p>
              <button className="btn-primary">Review with SAGE</button>
            </div>
          )}

          {result.passed && (
            <div className="success-cta">
              <p>You've passed this quiz! Your progress has been saved.</p>
              <button className="btn-primary">Continue Course</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-engine">
      <div className="quiz-header">
        <div className="quiz-title">
          <h2>{quiz.title}</h2>
          {quiz.description && <p>{quiz.description}</p>}
        </div>
        
        {timeRemaining > 0 && (
          <div className="timer">
            <span className={`timer-icon ${timeRemaining < 60 ? 'urgent' : ''}`}>
              ⏱️
            </span>
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-text">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </span>
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className="question-type">{currentQuestion.questionType.replace('_', ' ')}</span>
          <span className="question-points">{currentQuestion.points} pts</span>
        </div>
        
        <h3 className="question-text">{currentQuestion.question}</h3>

        {currentQuestion.questionType === 'MULTIPLE_CHOICE' && currentQuestion.options && (
          <div className="options-list">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`option-btn ${selectedAnswers[currentQuestion.id] === option ? 'selected' : ''}`}
                onClick={() => handleSelectAnswer(currentQuestion.id, option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        )}

        {currentQuestion.questionType === 'TRUE_FALSE' && (
          <div className="options-list true-false">
            <button
              className={`option-btn ${selectedAnswers[currentQuestion.id] === 'true' ? 'selected' : ''}`}
              onClick={() => handleSelectAnswer(currentQuestion.id, 'true')}
            >
              <span className="option-icon">✓</span>
              <span className="option-text">True</span>
            </button>
            <button
              className={`option-btn ${selectedAnswers[currentQuestion.id] === 'false' ? 'selected' : ''}`}
              onClick={() => handleSelectAnswer(currentQuestion.id, 'false')}
            >
              <span className="option-icon">✗</span>
              <span className="option-text">False</span>
            </button>
          </div>
        )}

        {currentQuestion.questionType === 'SHORT_ANSWER' && (
          <div className="short-answer">
            <textarea
              value={selectedAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
            />
          </div>
        )}
      </div>

      <div className="quiz-navigation">
        <button
          className="btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          Previous
        </button>

        <div className="question-dots">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[quiz.questions[idx].id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(idx)}
            />
          ))}
        </div>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            className="btn-primary"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next
          </button>
        ) : (
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
          >
            Submit Quiz
          </button>
        )}
      </div>

      <style>{`
        .quiz-engine {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .quiz-title h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 24px;
          color: var(--text);
          margin: 0;
        }

        .quiz-title p {
          color: var(--text-dim);
          margin-top: 4px;
        }

        .timer {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid var(--border);
        }

        .timer.urgent .timer-value {
          color: var(--red);
          animation: pulse 1s infinite;
        }

        .timer-value {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          color: var(--text);
        }

        .progress-bar {
          height: 4px;
          background: var(--surface);
          border-radius: 2px;
          margin-bottom: 8px;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--ice));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .question-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 32px;
          margin: 24px 0;
          position: relative;
        }

        .question-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .question-type {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--purple);
          background: rgba(155, 111, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .question-points {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--gold);
        }

        .question-card .question-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: var(--text);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .option-btn:hover {
          border-color: var(--gold);
          background: var(--surface);
        }

        .option-btn.selected {
          border-color: var(--gold);
          background: rgba(201, 168, 76, 0.1);
        }

        .option-letter {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: var(--gold);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          border-radius: 50%;
        }

        .option-text {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text);
        }

        .true-false {
          flex-direction: row;
        }

        .true-false .option-btn {
          flex: 1;
          justify-content: center;
        }

        .option-icon {
          font-size: 20px;
        }

        .short-answer textarea {
          width: 100%;
          padding: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          resize: vertical;
        }

        .short-answer textarea:focus {
          outline: none;
          border-color: var(--gold);
        }

        .quiz-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
        }

        .question-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--surface2);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dot.active {
          background: var(--gold);
          border-color: var(--gold);
        }

        .dot.answered {
          background: var(--green);
          border-color: var(--green);
        }

        .btn-primary, .btn-secondary, .btn-submit {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: var(--gold);
          color: var(--bg);
          border: none;
        }

        .btn-primary:hover {
          filter: brightness(1.1);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-submit {
          background: var(--green);
          color: var(--bg);
          border: none;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quiz-result {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .result-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 40px;
          text-align: center;
        }

        .result-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .result-card.passed::before {
          background: linear-gradient(90deg, var(--green), var(--gold), transparent);
        }

        .result-card.failed::before {
          background: linear-gradient(90deg, var(--red), transparent);
        }

        .result-card h2 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          margin-bottom: 24px;
        }

        .passed h2 { color: var(--green); }
        .failed h2 { color: var(--red); }

        .score-display {
          margin: 32px 0;
        }

        .score-ring {
          position: relative;
          width: 140px;
          height: 140px;
          margin: 0 auto;
        }

        .score-ring svg {
          width: 100%;
          height: 100%;
        }

        .score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Space Mono', monospace;
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }

        .score-label {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 8px;
        }

        .answer-review {
          text-align: left;
          margin-top: 32px;
        }

        .answer-review h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          margin-bottom: 16px;
          color: var(--text);
        }

        .answer-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface2);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .answer-item.correct { border-left: 3px solid var(--green); }
        .answer-item.incorrect { border-left: 3px solid var(--red); }

        .question-num {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }

        .question-text {
          flex: 1;
          font-size: 13px;
          color: var(--text);
        }

        .answer-status {
          font-size: 16px;
        }

        .correct .answer-status { color: var(--green); }
        .incorrect .answer-status { color: var(--red); }

        .retry-cta, .success-cta {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .retry-cta p, .success-cta p {
          color: var(--text-dim);
          margin-bottom: 16px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .skeleton {
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default QuizEngine;
