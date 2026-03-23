import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const emptyQuestion = () => ({
  question: "",
  answers: ["", "", "", ""],
  correctIndex: 0,
});

// step: "title" | "description" | "question"
function CreateQuizPage() {
  const [step, setStep] = useState("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];

  const updateQuestion = (field, value) => {
    const updated = [...questions];
    updated[currentQuestionIndex][field] = value;
    setQuestions(updated);
  };

  const updateAnswer = (aIndex, value) => {
    const updated = [...questions];
    updated[currentQuestionIndex].answers[aIndex] = value;
    setQuestions(updated);
  };

  const addNextQuestion = () => {
    const newQuestions = [...questions, emptyQuestion()];
    setQuestions(newQuestions);
    setCurrentQuestionIndex(newQuestions.length - 1);
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setStep("description");
    }
  };

  const handleSave = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Pytanie ${i + 1} nie ma treści.`);
        return;
      }
      if (q.answers.some((a) => !a.trim())) {
        alert(`Pytanie ${i + 1} ma pustą odpowiedź.`);
        return;
      }
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "quizzes"), {
        title,
        description,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        questions: questions.map((q) => ({
          question: q.question,
          answers: q.answers,
          correctIndex: q.correctIndex,
        })),
      });
      alert("Quiz został zapisany!");
      navigate("/manage");
    } catch (err) {
      alert("Błąd podczas zapisywania: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- KROK 1: Tytuł ---
  if (step === "title") {
    return (
      <div className="create-quiz-page">
        <div className="wizard-card">
          <h2>Nowy quiz</h2>
          <p className="wizard-subtitle">Jak będzie się nazywał Twój quiz?</p>
          <input
            type="text"
            placeholder="Tytuł quizu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="wizard-actions">
            <button
              className="save-btn"
              onClick={() => {
                if (!title.trim()) {
                  alert("Podaj tytuł quizu.");
                  return;
                }
                setStep("description");
              }}
            >
              Dalej →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- KROK 2: Opis ---
  if (step === "description") {
    return (
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
            <button className="back-btn" onClick={() => setStep("title")}>
              ← Wstecz
            </button>
            <button
              className="save-btn"
              onClick={() => {
                setCurrentQuestionIndex(0);
                setStep("question");
              }}
            >
              Dalej →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- KROK 3+: Pytania ---
  return (
    <div className="create-quiz-page">
      <div className="wizard-card">
        <div className="question-header">
          <h2>Pytanie {currentQuestionIndex + 1}</h2>
          <span className="question-count">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        <input
          type="text"
          placeholder="Treść pytania"
          value={currentQuestion.question}
          onChange={(e) => updateQuestion("question", e.target.value)}
          autoFocus
        />

        <div className="answers-list">
          {currentQuestion.answers.map((answer, aIndex) => (
            <div key={aIndex} className="answer-row">
              <input
                type="radio"
                name="correct"
                checked={currentQuestion.correctIndex === aIndex}
                onChange={() => updateQuestion("correctIndex", aIndex)}
              />
              <input
                type="text"
                placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                value={answer}
                onChange={(e) => updateAnswer(aIndex, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="correct-hint">Zaznacz radio przy poprawnej odpowiedzi.</p>

        <div className="wizard-actions">
          <button className="back-btn" onClick={goToPrevQuestion}>
            ← Wstecz
          </button>
          <button className="add-question-btn" onClick={addNextQuestion}>
            + Nowe pytanie
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Zapisywanie..." : "Zapisz quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateQuizPage;
