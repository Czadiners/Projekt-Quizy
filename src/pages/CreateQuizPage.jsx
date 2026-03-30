import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const emptyQuestion = (type) => {
  switch (type) {
    case "single":   return { type, question: "", answers: ["", "", "", ""], correctIndex: 0 };
    case "multiple": return { type, question: "", answers: ["", "", "", ""], correctIndexes: [] };
    case "text":     return { type, question: "" };
    case "truefalse":return { type, question: "", correct: true };
    default:         return { type: "single", question: "", answers: ["", "", "", ""], correctIndex: 0 };
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

function CreateQuizPage() {
  const [step, setStep] = useState("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];

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
    setCurrentQuestionIndex(newQuestions.length - 1);
    setAddingType(false);
    setStep("question");
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setStep("description");
    }
  };

  const handleSave = async () => {
    if (questions.length === 0) { alert("Dodaj przynajmniej jedno pytanie."); return; }
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) { alert(err); return; }
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "quizzes"), {
        title, description,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        questions,
      });
      alert("Quiz został zapisany!");
      navigate("/manage");
    } catch (err) {
      alert("Błąd podczas zapisywania: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // KROK 1: Tytuł
  if (step === "title") return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>Nowy quiz</h2>
        <p className="wizard-subtitle">Jak będzie się nazywał Twój quiz?</p>
        <input type="text" placeholder="Tytuł quizu" value={title}
          onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="wizard-actions">
          <button className="save-btn" onClick={() => {
            if (!title.trim()) { alert("Podaj tytuł quizu."); return; }
            setStep("description");
          }}>Dalej →</button>
        </div>
      </div>
    </div>
  );

  // KROK 2: Opis
  if (step === "description") return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>{title}</h2>
        <p className="wizard-subtitle">Dodaj opis quizu (opcjonalnie)</p>
        <textarea placeholder="Opis quizu..." value={description}
          onChange={(e) => setDescription(e.target.value)} autoFocus />
        <div className="wizard-actions">
          <button className="back-btn" onClick={() => setStep("title")}>← Wstecz</button>
          <button className="save-btn" onClick={() => setAddingType(true)}>Dalej →</button>
        </div>
      </div>
    </div>
  );

  // WYBÓR TYPU
  if (addingType) return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <h2>Jakie pytanie chcesz dodać?</h2>
        <p className="wizard-subtitle">Wybierz rodzaj pytania</p>
        <div className="type-select-list">
          {Object.entries(typeLabels).map(([type, label]) => (
            <button key={type} className="type-select-btn" onClick={() => handleTypeSelect(type)}>
              {label}
            </button>
          ))}
        </div>
        {questions.length > 0 && (
          <div className="wizard-actions" style={{ marginTop: "20px" }}>
            <button className="back-btn" onClick={() => { setAddingType(false); setStep("question"); }}>
              ← Anuluj
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // EDYCJA PYTANIA
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

        <input type="text" placeholder="Treść pytania" value={currentQuestion.question}
          onChange={(e) => updateQuestion("question", e.target.value)} autoFocus />

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
            <p className="correct-hint">Zaznacz radio przy poprawnej odpowiedzi.</p>
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
            <p className="correct-hint">Zaznacz checkboxy przy poprawnych odpowiedziach.</p>
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
            <p className="correct-hint">Zaznacz poprawną odpowiedź.</p>
          </div>
        )}

        {currentQuestion.type === "text" && (
          <p className="correct-hint" style={{ fontSize: "14px", color: "#555" }}>
            Uczestnik wpisze własną odpowiedź. Ty przyznasz punkt ręcznie po zakończeniu quizu.
          </p>
        )}

        <div className="wizard-actions">
          <button className="back-btn" onClick={goToPrevQuestion}>← Wstecz</button>
          <button className="add-question-btn" onClick={() => setAddingType(true)}>+ Nowe pytanie</button>
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
