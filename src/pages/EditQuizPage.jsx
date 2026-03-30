import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const typeLabels = {
  single: "Jednokrotny wybór",
  multiple: "Wielokrotny wybór",
  text: "Własna odpowiedź",
  truefalse: "Prawda / Fałsz",
  matching: "Dopasowywanie",
  order: "Kolejność",
};

const emptyQuestion = (type) => {
  switch (type) {
    case "single": return { type, question: "", answers: ["", "", "", ""], correctIndex: 0 };
    case "multiple": return { type, question: "", answers: ["", "", "", ""], correctIndexes: [] };
    case "text": return { type, question: "" };
    case "truefalse": return { type, question: "", correct: true };
    case "matching": return { type, question: "", pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
    case "order": return { type, question: "", items: ["", "", "", ""] };
    default: return { type: "single", question: "", answers: ["", "", "", ""], correctIndex: 0 };
  }
};

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
    case "matching":
      if (q.pairs.some((p) => !p.left.trim() || !p.right.trim())) return `Pytanie ${index + 1} ma niekompletną parę.`;
      break;
    case "order":
      if (q.items.some((i) => !i.trim())) return `Pytanie ${index + 1} ma pusty element.`;
      break;
    default: break;
  }
  return null;
};

function QuestionEditor({ question, index, questions, setQuestions }) {
  const updateQuestion = (field, value) => {
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
      <input
        type="text"
        placeholder="Treść pytania"
        value={question.question}
        onChange={(e) => updateQuestion("question", e.target.value)}
        autoFocus
      />

      {/* SINGLE */}
      {question.type === "single" && (
        <div className="answers-list">
          {question.answers.map((answer, aIndex) => (
            <div key={aIndex} className="answer-row">
              <input type="radio" name={`correct-${index}`} checked={question.correctIndex === aIndex}
                onChange={() => updateQuestion("correctIndex", aIndex)} />
              <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
            </div>
          ))}
          <p className="correct-hint">Zaznacz radio przy poprawnej odpowiedzi.</p>
        </div>
      )}

      {/* MULTIPLE */}
      {question.type === "multiple" && (
        <div className="answers-list">
          {question.answers.map((answer, aIndex) => (
            <div key={aIndex} className="answer-row">
              <input type="checkbox" checked={question.correctIndexes.includes(aIndex)}
                onChange={() => {
                  const prev = question.correctIndexes;
                  const next = prev.includes(aIndex) ? prev.filter((i) => i !== aIndex) : [...prev, aIndex];
                  updateQuestion("correctIndexes", next);
                }} />
              <input type="text" placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                value={answer} onChange={(e) => updateAnswer(aIndex, e.target.value)} />
            </div>
          ))}
          <p className="correct-hint">Zaznacz checkboxy przy poprawnych odpowiedziach.</p>
        </div>
      )}

      {/* TRUE/FALSE */}
      {question.type === "truefalse" && (
        <div className="answers-list">
          <div className="answer-row">
            <input type="radio" name={`tf-${index}`} checked={question.correct === true}
              onChange={() => updateQuestion("correct", true)} />
            <span>Prawda</span>
          </div>
          <div className="answer-row">
            <input type="radio" name={`tf-${index}`} checked={question.correct === false}
              onChange={() => updateQuestion("correct", false)} />
            <span>Fałsz</span>
          </div>
        </div>
      )}

      {/* TEXT */}
      {question.type === "text" && (
        <p className="correct-hint" style={{ fontSize: "14px", color: "#555" }}>
          Uczestnik wpisze własną odpowiedź. Ty przyznasz punkt ręcznie.
        </p>
      )}

      {/* MATCHING */}
      {question.type === "matching" && (
        <div className="answers-list">
          {question.pairs.map((pair, pIndex) => (
            <div key={pIndex} className="answer-row">
              <input type="text" placeholder={`Lewa strona ${pIndex + 1}`} value={pair.left}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[index].pairs[pIndex].left = e.target.value;
                  setQuestions(updated);
                }} />
              <span style={{ padding: "0 8px" }}>↔</span>
              <input type="text" placeholder={`Prawa strona ${pIndex + 1}`} value={pair.right}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[index].pairs[pIndex].right = e.target.value;
                  setQuestions(updated);
                }} />
            </div>
          ))}
          <button className="add-question-btn"
            style={{ marginTop: "10px", fontSize: "13px", padding: "6px 12px" }}
            onClick={() => {
              const updated = [...questions];
              updated[index].pairs.push({ left: "", right: "" });
              setQuestions(updated);
            }}>
            + Dodaj parę
          </button>
        </div>
      )}

      {/* ORDER */}
      {question.type === "order" && (
        <div className="answers-list">
          {question.items.map((item, iIndex) => (
            <div key={iIndex} className="answer-row">
              <span className="order-number">{iIndex + 1}.</span>
              <input type="text" placeholder={`Element ${iIndex + 1}`} value={item}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[index].items[iIndex] = e.target.value;
                  setQuestions(updated);
                }} />
            </div>
          ))}
          <button className="add-question-btn"
            style={{ marginTop: "10px", fontSize: "13px", padding: "6px 12px" }}
            onClick={() => {
              const updated = [...questions];
              updated[index].items.push("");
              setQuestions(updated);
            }}>
            + Dodaj element
          </button>
          <p className="correct-hint">Wpisz elementy w poprawnej kolejności.</p>
        </div>
      )}
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
  const [step, setStep] = useState("questions"); // "meta" | "questions" | "typeSelect"
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
        setQuestions(data.questions || []);
        setActiveIndex(0);
      } catch (err) {
        alert("Błąd podczas wczytywania: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

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
    setActiveIndex(Math.min(i, updated.length - 1));
  };

  const handleTypeSelect = (type) => {
    const newQ = emptyQuestion(type);
    const updated = [...questions, newQ];
    setQuestions(updated);
    setActiveIndex(updated.length - 1);
    setAddingType(false);
    setStep("questions");
  };

  if (loading) return <div className="manage-page"><p className="loading-text">Wczytywanie quizu...</p></div>;

  return (
    <div className="edit-page">

      {/* SIDEBAR Z LISTĄ PYTAŃ */}
      <aside className="edit-sidebar">
        <div className="edit-sidebar-header">
          <h3>Pytania</h3>
          <button className="add-question-btn" style={{ fontSize: "13px", padding: "5px 10px" }}
            onClick={() => setAddingType(true)}>
            + Dodaj
          </button>
        </div>
        <div className="edit-sidebar-meta"
          onClick={() => setStep("meta")}
          style={{ background: step === "meta" ? "#e3f2fd" : "" }}>
          <span>📋 Tytuł i opis</span>
        </div>
        <div className="edit-question-list">
          {questions.map((q, i) => (
            <div key={i}
              className={`edit-question-item ${activeIndex === i && step === "questions" ? "active" : ""}`}
              onClick={() => { setActiveIndex(i); setStep("questions"); setAddingType(false); }}>
              <div className="edit-question-item-num">{i + 1}</div>
              <div className="edit-question-item-info">
                <span className="edit-question-item-type">{typeLabels[q.type]}</span>
                <span className="edit-question-item-text">
                  {q.question || <em>Brak treści</em>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <div className="edit-main">

        {/* WYBÓR TYPU NOWEGO PYTANIA */}
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

        {/* META — TYTUŁ I OPIS */}
        {!addingType && step === "meta" && (
          <div className="wizard-card">
            <h2>Tytuł i opis quizu</h2>
            <p className="wizard-subtitle">Możesz je tutaj zmienić</p>
            <input type="text" placeholder="Tytuł quizu" value={title}
              onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Opis quizu (opcjonalnie)" value={description}
              onChange={(e) => setDescription(e.target.value)} />
            <div className="wizard-actions">
              <button className="save-btn" onClick={() => setStep("questions")} disabled={questions.length === 0}>
                Przejdź do pytań →
              </button>
            </div>
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
                onClick={() => setActiveIndex((i) => i - 1)}>
                ← Poprzednie
              </button>
              <button className="add-question-btn" disabled={activeIndex === questions.length - 1}
                onClick={() => setActiveIndex((i) => i + 1)}>
                Następne →
              </button>
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Zapisywanie..." : "💾 Zapisz quiz"}
              </button>
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

      {/* PRZYCISK ZAPISU NA GÓRZE */}
      <div className="edit-top-bar">
        <span className="edit-top-title">{title || "Bez tytułu"}</span>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Zapisywanie..." : "💾 Zapisz quiz"}
        </button>
      </div>
    </div>
  );
}

export default EditQuizPage;
