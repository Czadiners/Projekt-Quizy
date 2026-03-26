import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../components/Firebase";

const MAX_DESC_LENGTH = 120;

function QuizCard({ quiz, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const isLong = quiz.description && quiz.description.length > MAX_DESC_LENGTH;
  const displayDesc = expanded || !isLong
    ? quiz.description
    : quiz.description.slice(0, MAX_DESC_LENGTH) + "...";

  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setMenuOpen(false);
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć quiz "${quiz.title}"? Tej operacji nie można cofnąć.`
    );
    if (!confirmed) return;
    await onDelete(quiz.id);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-card-header">
        <h3 className="quiz-card-title">{quiz.title}</h3>
        <div className="quiz-card-menu" ref={menuRef}>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            title="Opcje"
          >
            ⚙
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={() => { setMenuOpen(false); navigate(`/edit/${quiz.id}`); }}>
                ✏️ Edytuj quiz
              </button>
              <button onClick={() => { setMenuOpen(false); alert("Funkcja uruchamiania quizu będzie dostępna wkrótce."); }}>
                ▶️ Uruchom quiz
              </button>
              <button className="delete-option" onClick={handleDelete}>
                🗑️ Usuń quiz
              </button>
            </div>
          )}
        </div>
      </div>

      {quiz.description ? (
        <div className="quiz-card-desc">
          <p>{displayDesc}</p>
          {isLong && (
            <button
              className="expand-btn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "▲ Zwiń" : "▼ Rozwiń"}
            </button>
          )}
        </div>
      ) : (
        <p className="quiz-card-no-desc">Brak opisu</p>
      )}

      <div className="quiz-card-footer">
        <span className="quiz-card-count">
          liczba pytań: {quiz.questions?.length ?? 0}
        </span>
      </div>
    </div>
  );
}

function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "quizzes"),
        where("authorId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQuizzes(data);
    } catch (err) {
      alert("Błąd podczas pobierania quizów: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId) => {
    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert("Błąd podczas usuwania quizu: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="manage-page">
        <p className="loading-text">Ładowanie quizów...</p>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h2>Moje quizy</h2>
        <Link to="/create" className="create-link-btn">+ Utwórz nowy quiz</Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Nie masz jeszcze żadnych quizów</h3>
          <p>Stwórz swój pierwszy quiz i podziel się wiedzą!</p>
          <Link to="/create" className="save-btn">+ Utwórz pierwszy quiz</Link>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageQuizzesPage;
