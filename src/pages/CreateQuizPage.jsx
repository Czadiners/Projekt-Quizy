import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

// --- Szablony pustych pytań według typu ---

const emptyQuestion = (type) => {
  switch (type) {
    case "single":
      return { type, question: "", answers: ["", "", "", ""], correctIndex: 0 };
    case "multiple":
      return { type, question: "", answers: ["", "", "", ""], correctIndexes: [] };
    case "text":
      return { type, question: "" };
    case "truefalse":
      return { type, question: "", correct: true };
    case "matching":
      return { type, question: "", pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
    case "order":
      return { type, question: "", items: ["", "", "", ""] };
    default:
      return { type: "single", question: "", answers: ["", "", "", ""], correctIndex: 0 };
  }
};

const typeLabels = {
  single: "Jednokrotny wybór (A/B/C/D)",
  multiple: "Wielokrotny wybór",
  text: "Własna odpowiedź (tekstowa)",
  truefalse: "Prawda / Fałsz",
  matching: "Dopasowywanie par",
  order: "Kolejność elementów",
};

// --- Walidacja pytania ---

const validateQuestion = (q, index) => {
  if (!q.question.trim()) return `Pytanie ${index + 1} nie ma treści.`;
  switch (q.type) {
    case "single":
      if (q.answers.some((a) => !a.trim())) return `Pytanie ${index + 1} ma pustą odpowiedź.`;
      break;
    case "multiple":
      if (q.answers.some((a) => !a.trim())) return `Pytanie ${index + 1} ma pustą odpowiedź.`;
      if (q.correctIndexes.length === 0) return `Pytanie ${index + 1} nie ma zaznaczonej poprawnej odpowiedzi.`;
      break;
    case "truefalse":
      break;
    case "text":
      break;
    case "matching":
      if (q.pairs.some((p) => !p.left.trim() || !p.right.trim()))
        return `Pytanie ${index + 1} ma niekompletną parę.`;
      break;
    case "order":
      if (q.items.some((i) => !i.trim())) return `Pytanie ${index + 1} ma pusty element kolejności.`;
      break;
    default:
      break;
  }
  return null;
};

// --- Główny komponent ---

function CreateQuizPage() {
  const [step, setStep] = useState("title"); // title | description | question | typeSelect
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];

  const updateQuestion = (field, value) => {
    const updated = [...questions];
    updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], [field]: value };
    setQuestions(updated);
  };

  // --- Obsługa typów ---

  const handleTypeSelect = (type) => {
    const newQuestions = [...questions, emptyQuestion(type)];
    setQuestions(newQuestions);
    setCurrentQuestionIndex(newQuestions.length - 1);
    setStep("question");
  };

  const handleAddQuestion = () => {
    setStep("typeSelect");
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setStep("description");
    }
  };

  // --- Zapis ---

  const handleSave = async () => {
    if (questions.length === 0) {
      alert("Dodaj przynajmniej jedno pytanie.");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const error = validateQuestion(questions[i], i);
      if (error) { alert(error); return; }
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "quizzes"), {
        title,
        description,
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

  // ==================== KROKI ====================

  // --- Krok 1: Tytuł ---
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
            <button className="save-btn" onClick={() => {
              if (!title.trim()) { alert("Podaj tytuł quizu."); return; }
              setStep("description");
            }}>
              Dalej →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Krok 2: Opis ---
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
            <button className="back-btn" onClick={() => setStep("title")}>← Wstecz</button>
            <button className="save-btn" onClick={() => setStep("typeSelect")}>Dalej →</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Wybór typu pytania ---
  if (step === "typeSelect") {
    return (
      <div className="create-quiz-page">
        <div className="wizard-card">
          <h2>Jakie pytanie chcesz dodać?</h2>
          <p className="wizard-subtitle">Wybierz rodzaj pytania</p>
          <div className="type-select-list">
            {Object.entries(typeLabels).map(([type, label]) => (
              <button
                key={type}
                className="type-select-btn"
                onClick={() => handleTypeSelect(type)}
              >
                {label}
              </button>
            ))}
          </div>
          {questions.length > 0 && (
            <div className="wizard-actions" style={{ marginTop: "20px" }}>
              <button className="back-btn" onClick={() => {
                setCurrentQuestionIndex(questions.length - 1);
                setStep("question");
              }}>
                ← Wstecz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Krok 3+: Edycja pytania ---
  if (step === "question" && currentQuestion) {
    return (
      <div className="create-quiz-page">
        <div className="wizard-card">
          <div className="question-header">
            <h2>Pytanie {currentQuestionIndex + 1}</h2>
            <span className="question-count">
              {currentQuestionIndex + 1} / {questions.length} &nbsp;·&nbsp;
              <span className="question-type-badge">{typeLabels[currentQuestion.type]}</span>
            </span>
          </div>

          <input
            type="text"
            placeholder="Treść pytania"
            value={currentQuestion.question}
            onChange={(e) => updateQuestion("question", e.target.value)}
            autoFocus
          />

          {/* SINGLE */}
          {currentQuestion.type === "single" && (
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
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[currentQuestionIndex].answers[aIndex] = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                </div>
              ))}
              <p className="correct-hint">Zaznacz radio przy poprawnej odpowiedzi.</p>
            </div>
          )}

          {/* MULTIPLE */}
          {currentQuestion.type === "multiple" && (
            <div className="answers-list">
              {currentQuestion.answers.map((answer, aIndex) => (
                <div key={aIndex} className="answer-row">
                  <input
                    type="checkbox"
                    checked={currentQuestion.correctIndexes.includes(aIndex)}
                    onChange={() => {
                      const prev = currentQuestion.correctIndexes;
                      const next = prev.includes(aIndex)
                        ? prev.filter((i) => i !== aIndex)
                        : [...prev, aIndex];
                      updateQuestion("correctIndexes", next);
                    }}
                  />
                  <input
                    type="text"
                    placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                    value={answer}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[currentQuestionIndex].answers[aIndex] = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                </div>
              ))}
              <p className="correct-hint">Zaznacz checkboxy przy poprawnych odpowiedziach.</p>
            </div>
          )}

          {/* TRUE / FALSE */}
          {currentQuestion.type === "truefalse" && (
            <div className="answers-list">
              <div className="answer-row">
                <input
                  type="radio"
                  name="truefalse"
                  checked={currentQuestion.correct === true}
                  onChange={() => updateQuestion("correct", true)}
                />
                <span>Prawda</span>
              </div>
              <div className="answer-row">
                <input
                  type="radio"
                  name="truefalse"
                  checked={currentQuestion.correct === false}
                  onChange={() => updateQuestion("correct", false)}
                />
                <span>Fałsz</span>
              </div>
              <p className="correct-hint">Zaznacz poprawną odpowiedź.</p>
            </div>
          )}

          {/* TEXT */}
          {currentQuestion.type === "text" && (
            <p className="correct-hint" style={{ fontSize: "14px", color: "#555" }}>
              Uczestnik wpisze własną odpowiedź. Ty przyznasz punkt ręcznie po zakończeniu quizu.
            </p>
          )}

          {/* MATCHING */}
          {currentQuestion.type === "matching" && (
            <div className="answers-list">
              {currentQuestion.pairs.map((pair, pIndex) => (
                <div key={pIndex} className="answer-row">
                  <input
                    type="text"
                    placeholder={`Lewa strona ${pIndex + 1}`}
                    value={pair.left}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[currentQuestionIndex].pairs[pIndex].left = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                  <span style={{ padding: "0 8px" }}>↔</span>
                  <input
                    type="text"
                    placeholder={`Prawa strona ${pIndex + 1}`}
                    value={pair.right}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[currentQuestionIndex].pairs[pIndex].right = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                </div>
              ))}
              <button
                className="add-question-btn"
                style={{ marginTop: "10px", fontSize: "13px", padding: "6px 12px" }}
                onClick={() => {
                  const updated = [...questions];
                  updated[currentQuestionIndex].pairs.push({ left: "", right: "" });
                  setQuestions(updated);
                }}
              >
                + Dodaj parę
              </button>
            </div>
          )}

          {/* ORDER */}
          {currentQuestion.type === "order" && (
            <div className="answers-list">
              {currentQuestion.items.map((item, iIndex) => (
                <div key={iIndex} className="answer-row">
                  <span className="order-number">{iIndex + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Element ${iIndex + 1}`}
                    value={item}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[currentQuestionIndex].items[iIndex] = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                </div>
              ))}
              <button
                className="add-question-btn"
                style={{ marginTop: "10px", fontSize: "13px", padding: "6px 12px" }}
                onClick={() => {
                  const updated = [...questions];
                  updated[currentQuestionIndex].items.push("");
                  setQuestions(updated);
                }}
              >
                + Dodaj element
              </button>
              <p className="correct-hint">Wpisz elementy w poprawnej kolejności.</p>
            </div>
          )}

          <div className="wizard-actions">
            <button className="back-btn" onClick={goToPrevQuestion}>← Wstecz</button>
            <button className="add-question-btn" onClick={handleAddQuestion}>+ Nowe pytanie</button>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default CreateQuizPage;
