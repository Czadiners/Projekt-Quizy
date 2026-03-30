import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const typeLabels = {
  single:    "Jednokrotny wybór",
  multiple:  "Wielokrotny wybór",
  text:      "Własna odpowiedź",
  truefalse: "Prawda / Fałsz",
};

const emptyQuestion = (type) => {
  switch (type) {
    case "single":    return { type, question: "", answers: ["", "", "", ""], correctIndex: 0, points: 1 };
    case "multiple":  return { type, question: "", answers: ["", "", "", ""], correctIndexes: [], points: 1 };
    case "text":      return { type, question: "", points: 0 };
    case "truefalse": return { type, question: "", correct: true, points: 1 };
    default:          return { type: "single", question: "", answers: ["", "", "", ""], correctIndex: 0, points: 1 };
  }
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
          type="number"
          min="1"
          max="100"
          className="points-input"
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        />
      )}
    </div>
  );
}

function QuestionEditor({ question, index, questions, setQuestions }) {
  const update = (field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (aIndex, value) => {
    const updated = [...questions];
    updated[index].answers[aIndex] = value;
    setQuestions(updated);
  };

  return (
    <div className="editor-question-body">
      <input type="text" placeholder="Treść pytania" value={question.question}
        onChange={(e) => update("question", e.target.value)} autoFocus />

      {question.type === "single" && (
        <div className="answers-list">
          {question.answers.map((answer, aIndex) => (
            <div key={aIndex} className="answer-row">
              <input type="radio" name={`correct-${index}`} checked={question.correctIndex === aIndex}
                onChange={() => update("correctIndex", aIndex)} />
              <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
            </div>
          ))}
          <p className="correct-hint">Zaznacz radio przy poprawnej odpowiedzi.</p>
        </div>
      )}

      {question.type === "multiple" && (
        <div className="answers-list">
          {question.answers.map((answer, aIndex) => (
            <div key={aIndex} className="answer-row">
              <input type="checkbox" checked={question.correctIndexes.includes(aIndex)}
                onChange={() => {
                  const prev = question.correctIndexes;
                  const next = prev.includes(aIndex) ? prev.filter(i => i !== aIndex) : [...prev, aIndex];
                  update("correctIndexes", next);
                }} />
              <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
            </div>
          ))}
          <p className="correct-hint">Zaznacz checkboxy przy poprawnych odpowiedziach.</p>
        </div>
      )}

      {question.type === "truefalse" && (
        <div className="answers-list">
          <div className="answer-row">
            <input type="radio" name={`tf-${index}`} checked={question.correct === true}
              onChange={() => update("correct", true)} />
            <span>Prawda</span>
          </div>
          <div className="answer-row">
            <input type="radio" name={`tf-${index}`} checked={question.correct === false}
              onChange={() => update("correct", false)} />
            <span>Fałsz</span>
          </div>
          <p className="correct-hint">Zaznacz poprawną odpowiedź.</p>
        </div>
      )}

      {question.type === "text" && (
        <p className="correct-hint" style={{ fontSize: "14px", color: "#555" }}>
          Uczestnik wpisze własną odpowiedź. Ty przyznasz punkt ręcznie po zakończeniu quizu.
        </p>
      )}

      <PointsInput
        value={question.points ?? (question.type === "text" ? 0 : 1)}
        onChange={(val) => update("points", val)}
        disabled={question.type === "text"}
      />
    </div>
  );
}

function EditQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [step, setStep] = useState("questions");
  const [addingType, setAddingType] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const ref = doc(db, "quizzes", quizId);
        const snap = await getDoc(ref);
        if (!snap.exists()) { alert("Quiz nie istnieje."); navigate("/manage"); return; }
        const data = snap.data();
        if (data.authorId !== auth.currentUser.uid) { alert("Brak dostępu."); navigate("/manage"); return; }
        setTitle(data.title);
        setDescription(data.description || "");
        // zapewnij że każde pytanie ma pole points
        const qs = (data.questions || []).map(q => ({
          ...q,
          points: q.points ?? (q.type === "text" ? 0 : 1),
        }));
        setQuestions(qs);
      } catch (err) {
        alert("Błąd podczas wczytywania: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

  const totalPoints = questions
    .filter(q => q.type !== "text")
    .reduce((sum, q) => sum + (q.points || 1), 0);

  const handleSave = async () => {
    if (!title.trim()) { alert("Podaj tytuł quizu."); return; }
    if (questions.length === 0) { alert("Dodaj przynajmniej jedno pytanie."); return; }
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) { alert(err); setActiveIndex(i); setStep("questions"); return; }
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "quizzes", quizId), { title, description, questions });
      alert("Quiz zapisany!");
      navigate("/manage");
    } catch (err) {
      alert("Błąd podczas zapisywania: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = (i) => {
    if (!window.confirm(`Usunąć pytanie ${i + 1}?`)) return;
    const updated = questions.filter((_, idx) => idx !== i);
    setQuestions(updated);
    setActiveIndex(Math.min(i, Math.max(0, updated.length - 1)));
  };

  const handleTypeSelect = (type) => {
    const updated = [...questions, emptyQuestion(type)];
    setQuestions(updated);
    setActiveIndex(updated.length - 1);
    setAddingType(false);
    setStep("questions");
  };

  if (loading) return (
    <div className="manage-page">
      <p className="loading-text">Wczytywanie quizu...</p>
    </div>
  );

  return (
    <div className="edit-page">
      {/* LEWY PANEL */}
      <aside className="edit-sidebar">
        <div className="edit-sidebar-header">
          <h3>Pytania</h3>
          <button className="add-question-btn"
            style={{ fontSize: "13px", padding: "5px 10px" }}
            onClick={() => setAddingType(true)}>
            + Dodaj
          </button>
        </div>

        <div className="edit-sidebar-meta"
          style={{ background: step === "meta" && !addingType ? "#e3f2fd" : "" }}
          onClick={() => { setStep("meta"); setAddingType(false); }}>
          📋 Tytuł i opis
        </div>

        <div className="edit-question-list">
          {questions.map((q, i) => (
            <div key={i}
              className={`edit-question-item ${activeIndex === i && step === "questions" && !addingType ? "active" : ""}`}
              onClick={() => { setActiveIndex(i); setStep("questions"); setAddingType(false); }}>
              <div className="edit-question-item-num">{i + 1}</div>
              <div className="edit-question-item-info">
                <span className="edit-question-item-type">{typeLabels[q.type] ?? q.type}</span>
                <span className="edit-question-item-text">
                  {q.question || <em>Brak treści</em>}
                </span>
                <span className="edit-question-item-points">
                  {q.type === "text" ? "ręcznie" : `${q.points ?? 1} pkt`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {totalPoints > 0 && (
          <div className="edit-sidebar-total">
            Łącznie: <strong>{totalPoints} pkt</strong>
          </div>
        )}
      </aside>

      {/* PRAWA STRONA */}
      <div className="edit-right">
        <div className="edit-top-bar">
          <span className="edit-top-title">{title || "Bez tytułu"}</span>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Zapisywanie..." : "💾 Zapisz quiz"}
          </button>
        </div>

        <div className="edit-main">
          {/* WYBÓR TYPU */}
          {addingType && (
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
              <div className="wizard-actions" style={{ marginTop: "20px" }}>
                <button className="back-btn" onClick={() => setAddingType(false)}>← Anuluj</button>
              </div>
            </div>
          )}

          {/* META */}
          {!addingType && step === "meta" && (
            <div className="wizard-card">
              <h2>Tytuł i opis quizu</h2>
              <p className="wizard-subtitle">Możesz je tutaj zmienić</p>
              <input type="text" placeholder="Tytuł quizu" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <textarea placeholder="Opis quizu (opcjonalnie)" value={description}
                onChange={(e) => setDescription(e.target.value)} />
            </div>
          )}

          {/* EDYCJA PYTANIA */}
          {!addingType && step === "questions" && questions.length > 0 && (
            <div className="wizard-card">
              <div className="question-header">
                <div>
                  <h2>Pytanie {activeIndex + 1}</h2>
                  <span className="question-type-badge">{typeLabels[questions[activeIndex].type]}</span>
                </div>
                <button className="remove-btn" onClick={() => handleDeleteQuestion(activeIndex)}>
                  🗑️ Usuń pytanie
                </button>
              </div>

              <QuestionEditor
                question={questions[activeIndex]}
                index={activeIndex}
                questions={questions}
                setQuestions={setQuestions}
              />

              <div className="wizard-actions">
                <button className="back-btn" disabled={activeIndex === 0}
                  onClick={() => setActiveIndex(i => i - 1)}>← Poprzednie</button>
                <button className="add-question-btn" disabled={activeIndex === questions.length - 1}
                  onClick={() => setActiveIndex(i => i + 1)}>Następne →</button>
              </div>
            </div>
          )}

          {/* BRAK PYTAŃ */}
          {!addingType && step === "questions" && questions.length === 0 && (
            <div className="wizard-card">
              <p style={{ color: "#888", textAlign: "center" }}>
                Brak pytań. Kliknij "+ Dodaj" żeby dodać pierwsze pytanie.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditQuizPage;
