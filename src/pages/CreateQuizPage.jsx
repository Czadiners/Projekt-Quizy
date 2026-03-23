import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../components/Firebase";

const emptyQuestion = () => ({
  question: "",
  imageFile: null,
  imagePreview: null,
  answers: ["", "", "", ""],
  correctIndex: 0,
});

function CreateQuizPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // --- Obsługa pytań ---

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateAnswer = (qIndex, aIndex, value) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex] = value;
    setQuestions(updated);
  };

  const handleImageChange = (index, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const updated = [...questions];
    updated[index].imageFile = file;
    updated[index].imagePreview = preview;
    setQuestions(updated);
  };

  const removeImage = (index) => {
    const updated = [...questions];
    updated[index].imageFile = null;
    updated[index].imagePreview = null;
    setQuestions(updated);
  };

  // --- Zapis do Firebase ---

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Podaj tytuł quizu.");
      return;
    }
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
      const savedQuestions = await Promise.all(
        questions.map(async (q) => {
          let imageUrl = null;

          if (q.imageFile) {
            const storageRef = ref(
              storage,
              `quiz-images/${auth.currentUser.uid}/${Date.now()}_${q.imageFile.name}`
            );
            await uploadBytes(storageRef, q.imageFile);
            imageUrl = await getDownloadURL(storageRef);
          }

          return {
            question: q.question,
            imageUrl,
            answers: q.answers,
            correctIndex: q.correctIndex,
          };
        })
      );

      await addDoc(collection(db, "quizzes"), {
        title,
        description,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        questions: savedQuestions,
      });

      alert("Quiz został zapisany!");
      navigate("/manage");
    } catch (err) {
      alert("Błąd podczas zapisywania: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---

  return (
    <div className="create-quiz-page">
      <h2>Utwórz nowy quiz</h2>

      <div className="quiz-meta">
        <input
          type="text"
          placeholder="Tytuł quizu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Opis quizu (opcjonalnie)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="questions-list">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-card">
            <div className="question-header">
              <h3>Pytanie {qIndex + 1}</h3>
              {questions.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => removeQuestion(qIndex)}
                >
                  Usuń pytanie
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Treść pytania"
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
            />

            <div className="image-upload">
              {q.imagePreview ? (
                <div className="image-preview">
                  <img src={q.imagePreview} alt="Podgląd" />
                  <button onClick={() => removeImage(qIndex)}>Usuń zdjęcie</button>
                </div>
              ) : (
                <label className="upload-label">
                  + Dodaj zdjęcie (opcjonalnie)
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(qIndex, e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div className="answers-list">
              {q.answers.map((answer, aIndex) => (
                <div key={aIndex} className="answer-row">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctIndex === aIndex}
                    onChange={() => updateQuestion(qIndex, "correctIndex", aIndex)}
                  />
                  <input
                    type="text"
                    placeholder={`Odpowiedź ${String.fromCharCode(65 + aIndex)}`}
                    value={answer}
                    onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="correct-hint">
              Zaznacz radio przy poprawnej odpowiedzi.
            </p>
          </div>
        ))}
      </div>

      <div className="quiz-actions">
        <button className="add-question-btn" onClick={addQuestion}>
          + Dodaj pytanie
        </button>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Zapisywanie..." : "Zapisz quiz"}
        </button>
      </div>
    </div>
  );
}

export default CreateQuizPage;
