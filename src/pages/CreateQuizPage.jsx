import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const emptyQuestion = (type) => {
  switch (type) {
    case "single":    return { type, question: "", answers: ["", "", "", ""], correctIndex: 0, points: 1 };
    case "multiple":  return { type, question: "", answers: ["", "", "", ""], correctIndexes: [], points: 1 };
    case "text":      return { type, question: "", points: 0 };
    case "truefalse": return { type, question: "", correct: true, points: 1 };
    default:          return { type: "single", question: "", answers: ["", "", "", ""], correctIndex: 0, points: 1 };
  }
};

const typeLabels = {
  single:    "Jednokrotny wybór (A/B/C/D)",
  multiple:  "Wielokrotny wybór",
  text:      "Własna odpowiedź (tekstowa)",
  truefalse: "Prawda / Fałsz",
};

const validateQuestion = (q, index) => {
  if (!q.question.trim()) return `Pytanie ${index + 1} nie ma treści.`;
  if (q.type === "single" && q.answers.some((a) => !a.trim()))
    return `Pytanie ${index + 1} ma pustą odpowiedź.`;
  if (q.type === "multiple") {
    if (q.answers.some((a) => !a.trim())) return `Pytanie ${index + 1} ma pustą odpowiedź.`;
    if (q.correctIndexes.length === 0) return `Pytanie ${index + 1} nie ma zaznaczonej poprawnej odpowiedzi.`;
  }
  return null;
};

function PointsInput({ value, onChange, disabled }) {
  return (
    <div className="points-row">
      <label className="points-label">Punkty za pytanie:</label>
      {disabled ? (
        <span className="points-manual-info">przyznawane ręcznie</span>
      ) : (
        <input
          type="number" min="1" max="100"
          className="points-input"
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        />
      )}
    </div>
  );
}

function CreateQuizPage() {
  const [step, setStep]                           = useState("title");
  const [addingType, setAddingType]               = useState(false);
  const [title, setTitle]                         = useState("");
  const [description, setDescription]             = useState("");
  const [questions, setQuestions]                 = useState([]);
  const [currentQuestionIndex, setCurrentIndex]   = useState(0);
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState("");
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion  = currentQuestionIndex === questions.length - 1;

  const updateQuestion = (field, value) => {
    const updated = [...questions];
    updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (aIndex, value) => {
    const updated = [...questions];
    updated[currentQuestionIndex].answers[aIndex] = value;
    setQuestions(updated);
  };

  const handleTypeSelect = (type) => {
    const newQuestions = [...questions, emptyQuestion(type)];
    setQuestions(newQuestions);
    setCurrentIndex(newQuestions.length - 1);
    setAddingType(false);
    setStep("question");
    setError("");
  };
// nawigacja pomiedzy pytaniami 
  const goBack = () => {
    setError("");
    if (currentQuestionIndex > 0) {
      setCurrentIndex(currentQuestionIndex - 1);
    } else {
      setStep("description");
    }
  };

  const goNext = () => {
    setError("");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentIndex(currentQuestionIndex + 1);
    }
  };

  const totalPoints = questions
    .filter(q => q.type !== "text")
    .reduce((sum, q) => sum + (q.points || 1), 0);

  const handleSave = async () => {
    if (questions.length === 0) { setError("Dodaj przynajmniej jedno pytanie."); return; }
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) { setError(err); return; }
    }
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "quizzes"), {
        title, description,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        questions,
      });
      navigate("/manage");
    } catch (err) {
      setError("Błąd podczas zapisywania: " + err.message);
    } finally {
      setSaving(false);
    }
  };

// wybor typu pytania przy dodawaniu nowego itd
  if (addingType) return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>Rodzaj pytania</h2>
        <p className="wizard-subtitle">Wybierz typ pytania, które chcesz dodać</p>
        <div className="type-select-list">
          {Object.entries(typeLabels).map(([type, label]) => (
            <button key={type} className="type-select-btn" onClick={() => handleTypeSelect(type)}>
              {label}
            </button>
          ))}
        </div>
        <div className="wizard-actions" style={{ marginTop: "20px" }}>
          <button className="back-btn" onClick={() => {
            setAddingType(false);
            if (questions.length === 0) setStep("description");
          }}>
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );

  // nazywanie quizu
  if (step === "title") return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>Nowy quiz</h2>
        <p className="wizard-subtitle">Jak będzie się nazywał Twój quiz?</p>
        <input
          type="text" placeholder="Tytuł quizu" value={title}
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) { setError(""); setStep("description"); }
          }}
          autoFocus
        />
        {error && <p className="form-error">{error}</p>}
        <div className="wizard-actions">
          <button className="save-btn" onClick={() => {
            if (!title.trim()) { setError("Podaj tytuł quizu."); return; }
            setError(""); setStep("description");
          }}>
            Dalej
          </button>
        </div>
      </div>
    </div>
  );

  // opis quizu (jest opcjonalny)
  if (step === "description") return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>{title}</h2>
        <p className="wizard-subtitle">Dodaj opis quizu (opcjonalnie)</p>
        <textarea
          placeholder="Opis quizu..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
        />
        <div className="wizard-actions">
          <button className="back-btn" onClick={() => setStep("title")}>Wstecz</button>
          <button className="save-btn" onClick={() => setAddingType(true)}>Dalej</button>
        </div>
      </div>
    </div>
  );

// pytania
  if (step === "question" && currentQuestion) return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <div className="question-header">
          <div>
            <h2>Pytanie {currentQuestionIndex + 1}</h2>
            <span className="question-type-badge">{typeLabels[currentQuestion.type]}</span>
          </div>
          <span className="question-count">{currentQuestionIndex + 1} / {questions.length}</span>
        </div>

        <input
          type="text" placeholder="Treść pytania" value={currentQuestion.question}
          onChange={(e) => { updateQuestion("question", e.target.value); setError(""); }}
          autoFocus
        />

        {currentQuestion.type === "single" && (
          <div className="answers-list">
            {currentQuestion.answers.map((answer, aIndex) => (
              <div key={aIndex} className="answer-row">
                <input type="radio" name="correct" checked={currentQuestion.correctIndex === aIndex}
                  onChange={() => updateQuestion("correctIndex", aIndex)} />
                <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                  value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
              </div>
            ))}
            <p className="correct-hint">Zaznacz poprawną odpowiedź.</p>
          </div>
        )}

        {currentQuestion.type === "multiple" && (
          <div className="answers-list">
            {currentQuestion.answers.map((answer, aIndex) => (
              <div key={aIndex} className="answer-row">
                <input type="checkbox" checked={currentQuestion.correctIndexes.includes(aIndex)}
                  onChange={() => {
                    const prev = currentQuestion.correctIndexes;
                    const next = prev.includes(aIndex) ? prev.filter(i => i !== aIndex) : [...prev, aIndex];
                    updateQuestion("correctIndexes", next);
                  }} />
                <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                  value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
              </div>
            ))}
            <p className="correct-hint">Zaznacz wszystkie poprawne odpowiedzi.</p>
          </div>
        )}

        {currentQuestion.type === "truefalse" && (
          <div className="answers-list">
            <div className="answer-row">
              <input type="radio" name="truefalse" checked={currentQuestion.correct === true}
                onChange={() => updateQuestion("correct", true)} />
              <span>Prawda</span>
            </div>
            <div className="answer-row">
              <input type="radio" name="truefalse" checked={currentQuestion.correct === false}
                onChange={() => updateQuestion("correct", false)} />
              <span>Fałsz</span>
            </div>
          </div>
        )}

        {currentQuestion.type === "text" && (
          <p className="correct-hint" style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Uczestnik wpisze własną odpowiedź tekstową. Ty przyznasz punkty ręcznie po zakończeniu quizu.
          </p>
        )}

        <PointsInput
          value={currentQuestion.points}
          onChange={(val) => updateQuestion("points", val)}
          disabled={currentQuestion.type === "text"}
        />

        {totalPoints > 0 && (
          <p className="points-total">
            Łączna pula punktów (automatycznych): <strong>{totalPoints} pkt</strong>
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="wizard-actions">
          {/* cofanie się(zawsze się pokazuje) */}
          <button className="back-btn" onClick={goBack}>
            Wstecz
          </button>

          {/* przechodzenie do nastepnego (tylko gdy jest kolejne pytanie) */}
          {!isLastQuestion && (
            <button className="add-question-btn" onClick={goNext}>
              Następne
            </button>
          )}

          {/* dodawanie pytania */}
          {isLastQuestion && (
            <button className="add-question-btn" onClick={() => setAddingType(true)}>
              Dodaj pytanie
            </button>
          )}

          {/* zapisywanie quizu*/}
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz quiz"}
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

export default CreateQuizPage;
