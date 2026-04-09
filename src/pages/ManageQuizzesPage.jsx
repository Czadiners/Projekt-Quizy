import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  collection, query, where, getDocs,
  deleteDoc, doc, orderBy, onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../components/Firebase";
import { createSession } from "../components/sessionUtils";

const MAX_DESC_LENGTH = 120;

// kwadracik reprezentujacy quiz z opcjami w zebatce

function QuizCard({ quiz, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const isLong = quiz.description && quiz.description.length > MAX_DESC_LENGTH;
  const displayDesc = expanded || !isLong
    ? quiz.description
    : quiz.description.slice(0, MAX_DESC_LENGTH) + "...";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm(`Czy na pewno chcesz usunąć quiz "${quiz.title}"?`)) return;
    await onDelete(quiz.id);
  };

  const handleLaunch = async () => {
    setMenuOpen(false);
    setLaunching(true);
    try {
      const { sessionId } = await createSession(quiz.id);
      navigate(`/host/${sessionId}`);
    } catch (err) {
      console.error("Błąd uruchamiania sesji:", err.message);
      setLaunching(false);
    }
  };

  return (
    <div className="quiz-card">
      <div className="quiz-card-header">
        <h3 className="quiz-card-title">{quiz.title}</h3>
        <div className="quiz-card-menu" ref={menuRef}>
          <button className="menu-btn" onClick={() => setMenuOpen(p => !p)} title="Opcje">⚙</button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={() => { setMenuOpen(false); navigate(`/edit/${quiz.id}`); }}>Edytuj quiz</button>
              <button onClick={handleLaunch} disabled={launching}>
                {launching ? "Uruchamianie..." : "Uruchom sesję"}
              </button>
              <button className="delete-option" onClick={handleDelete}>Usuń quiz</button>
            </div>
          )}
        </div>
      </div>

      {quiz.description ? (
        <div className="quiz-card-desc">
          <p>{displayDesc}</p>
          {isLong && (
            <button className="expand-btn" onClick={() => setExpanded(p => !p)}>
              {expanded ? "Zwiń" : "Rozwiń"}
            </button>
          )}
        </div>
      ) : (
        <p className="quiz-card-no-desc">Brak opisu</p>
      )}

      <div className="quiz-card-footer">
        <span className="quiz-card-count">{quiz.questions?.length ?? 0} pytań</span>
      </div>
    </div>
  );
}

// historia sesji

function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [playersMap, setPlayersMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      where("hostId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loadPlayers = async (sessionId) => {
    if (playersMap[sessionId]) {
      setExpandedSession(expandedSession === sessionId ? null : sessionId);
      return;
    }
    const snap = await getDocs(collection(db, "sessions", sessionId, "players"));
    const list = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    setPlayersMap(prev => ({ ...prev, [sessionId]: list }));
    setExpandedSession(sessionId);
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pl-PL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) return <p className="loading-text">Ładowanie historii...</p>;

  if (sessions.length === 0) return (
    <div className="empty-state" style={{ padding: "40px 0" }}>
      <h3>Brak historii sesji</h3>
      <p>Uruchom quiz, aby zobaczyć tu historię rozgrywek.</p>
    </div>
  );

  return (
    <div className="session-history">
      {sessions.map((s) => {
        const isExpanded = expandedSession === s.id;
        const players = playersMap[s.id] ?? [];

        return (
          <div key={s.id} className="session-row">
            <div
              className="session-row-header"
              onClick={() => loadPlayers(s.id)}
            >
              <div className="session-row-info">
                <span className="session-row-title">{s.quizTitle || "Quiz"}</span>
                <span className="session-row-meta">
                  Kod: <strong>{s.code}</strong> · {formatDate(s.createdAt)}
                </span>
              </div>
              <div className="session-row-right">
                <span className={`session-status session-status--${s.status}`}>
                  {s.status === "waiting" ? "Oczekiwanie"
                    : s.status === "active" ? "Trwa"
                    : "Zakończona"}
                </span>
                {s.status === "active" && (
                  <button
                    className="save-btn"
                    style={{ fontSize: "13px", padding: "5px 12px" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/host/${s.id}`); }}
                  >
                    Wróć do sesji
                  </button>
                )}
                {s.status === "finished" && (
                  <button
                    className="add-question-btn"
                    style={{ fontSize: "13px", padding: "5px 12px" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/results/${s.id}`); }}
                  >
                    Wyniki
                  </button>
                )}
                <span className="session-expand-icon">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="session-row-players">
                {players.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>Brak graczy w tej sesji.</p>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nick</th>
                        <th>Wynik</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.nick}</td>
                          <td>{p.score ?? 0} pkt</td>
                          <td>
                            <span className={`player-status player-status--${p.status}`}>
                              {p.status === "finished" ? "Ukończył" : "W trakcie"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// main strona

function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "quizzes"),
          where("authorId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Błąd pobierania quizów:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId) => {
    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      console.error("Błąd usuwania quizu:", err.message);
    }
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h2>Panel quizów</h2>
        {activeTab === "quizzes" && (
          <Link to="/create" className="save-btn">Utwórz nowy quiz</Link>
        )}
      </div>

      {/* ZAKŁADKI */}
      <div className="manage-tabs">
        <button
          className={`manage-tab ${activeTab === "quizzes" ? "active" : ""}`}
          onClick={() => setActiveTab("quizzes")}
        >
          Moje quizy
        </button>
        <button
          className={`manage-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historia sesji
        </button>
      </div>

      {/* QUIZY */}
      {activeTab === "quizzes" && (
        loading ? (
          <p className="loading-text">Ładowanie quizów...</p>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Nie masz jeszcze żadnych quizów</h3>
            <p>Stwórz swój pierwszy quiz i podziel się wiedzą!</p>
            <Link to="/create" className="save-btn" style={{ marginTop: "8px" }}>
              Utwórz pierwszy quiz
            </Link>
          </div>
        ) : (
          <div className="quiz-grid">
            {quizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} onDelete={handleDelete} />
            ))}
          </div>
        )
      )}

      {/* HISTORIA */}
      {activeTab === "history" && <SessionHistory />}
    </div>
  );
}

export default ManageQuizzesPage;
