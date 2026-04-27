import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  collection, query, where, getDocs,
  deleteDoc, doc, onSnapshot, getDoc,
} from "firebase/firestore";
import { auth, db } from "../components/Firebase";
import { createSession } from "../components/sessionUtils";

const MAX_DESC_LENGTH = 120;

function downloadCSV(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function computeQuestionStats(players, questions) {
  return questions.map((q, i) => {
    const withAnswer = players.filter(p => p.answers?.[i] != null);
    const correct    = withAnswer.filter(p => p.answers[i].correct === true);
    const pct = withAnswer.length > 0
      ? Math.round((correct.length / withAnswer.length) * 100)
      : null;
    return { index: i, question: q.question, type: q.type,
             answered: withAnswer.length, correct: correct.length, pct };
  });
}

// karta quizu
function QuizCard({ quiz, onDelete }) {
  const [expanded, setExpanded]           = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [launching, setLaunching]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shaking, setShaking]             = useState(false);
  const cardRef  = useRef(null);
  const menuRef  = useRef(null);
  const navigate = useNavigate();

  const isLong = quiz.description && quiz.description.length > MAX_DESC_LENGTH;
  const displayDesc = expanded || !isLong
    ? quiz.description
    : quiz.description.slice(0, MAX_DESC_LENGTH) + "...";

  // zamykanie menu po kliknieciu poza nim
  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // trzesienie sie bloczku z quizem co 3 sekundy gdy karta jest w trybie potwierdzenia usuniecia
  useEffect(() => {
    if (!confirmDelete) return;

    // Pierwsze drgnięcie zaraz po wejściu w tryb potwierdzenia
    const firstShake = setTimeout(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 400);

    // Następnie co 3 sekundy
    const interval = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 3000);

    return () => {
      clearTimeout(firstShake);
      clearInterval(interval);
    };
  }, [confirmDelete]);

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

  // potwierdzanie usuwania
  if (confirmDelete) {
    return (
      <div
        ref={cardRef}
        className={`quiz-card quiz-card--confirm${shaking ? " is-shaking" : ""}`}
      >
        <div className="quiz-card-confirm-inner">
          <div className="quiz-card-confirm-headline">Usunąć quiz?</div>

          <div className="quiz-card-confirm-title">{quiz.title}</div>

          <p className="quiz-card-confirm-warning">
            Tej operacji <strong>nie można cofnąć</strong>
          </p>
          <p className="quiz-card-confirm-sub">
            Quiz zostanie trwale usunięty wraz z całą zawartością.
          </p>

          <div className="quiz-card-confirm-actions">
            <button className="back-btn" onClick={() => setConfirmDelete(false)}>
              Anuluj
            </button>
            <button
              className="quiz-card-delete-confirm-btn"
              onClick={() => onDelete(quiz.id)}
            >
              Usuń quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // normalny widok
  return (
    <div className={`quiz-card ${menuOpen ? "quiz-card--menu-open" : ""}`}>
      <div className="quiz-card-header">
        <h3 className="quiz-card-title">{quiz.title}</h3>
        <div className="quiz-card-menu" ref={menuRef}>
          <button className="menu-btn" onClick={() => setMenuOpen(p => !p)} title="Opcje">⚙</button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={() => { setMenuOpen(false); navigate(`/edit/${quiz.id}`); }}>
                Edytuj quiz
              </button>
              <button onClick={handleLaunch} disabled={launching}>
                {launching ? "Uruchamianie..." : "Uruchom sesję"}
              </button>
              <button
                className="delete-option"
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
              >
                Usuń quiz
              </button>
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
        {quiz.shuffleQuestions && (
          <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 800, marginLeft: 10 }}>
            Losowanie wł.
          </span>
        )}
      </div>
    </div>
  );
}

// wiersze sesji
function SessionRow({ session, navigate }) {
  const [expanded, setExpanded]    = useState(false);
  const [innerTab, setInnerTab]    = useState("players");
  const [players, setPlayers]      = useState(null);
  const [quiz, setQuiz]            = useState(null);
  const [loadingInner, setLoading] = useState(false);

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pl-PL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const loadData = async () => {
    if (players !== null) return;
    setLoading(true);
    try {
      const [playersSnap, quizSnap] = await Promise.all([
        getDocs(collection(db, "sessions", session.id, "players")),
        session.quizId ? getDoc(doc(db, "quizzes", session.quizId)) : null,
      ]);
      const pList = playersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      setPlayers(pList);
      if (quizSnap?.exists()) setQuiz({ id: quizSnap.id, ...quizSnap.data() });
    } catch (err) {
      console.error("Błąd ładowania sesji:", err.message);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!expanded) await loadData();
    setExpanded(p => !p);
  };

  const handleCSV = async (e) => {
    e.stopPropagation();
    let pList = players;
    let qData = quiz;
    if (!pList) {
      const [ps, qs] = await Promise.all([
        getDocs(collection(db, "sessions", session.id, "players")),
        session.quizId ? getDoc(doc(db, "quizzes", session.quizId)) : null,
      ]);
      pList = ps.docs.map(d => ({ id: d.id, ...d.data() }));
      if (qs?.exists()) qData = { id: qs.id, ...qs.data() };
    }
    const questions = qData?.questions ?? [];
    const autoMax   = questions.filter(q => q.type !== "text")
      .reduce((s, q) => s + (q.points || 1), 0);
    const header = [
      "Nick", "Data dołączenia", "Wynik", "Maks. punktów", "%",
      ...questions.map((_, i) => `Pytanie ${i + 1}`),
    ];
    const rows = (pList || []).map(p => {
      const joined = p.joinedAt?.toDate
        ? p.joinedAt.toDate().toLocaleString("pl-PL") : "";
      const score = p.score ?? 0;
      const pct   = autoMax > 0 ? Math.round((score / autoMax) * 100) + "%" : "—";
      const ansCols = questions.map((_, i) => {
        const a = p.answers?.[i];
        if (!a) return "brak";
        if (a.needsManualReview) return a.answer ?? "brak";
        return a.correct ? "poprawna" : "błędna";
      });
      return [p.nick, joined, score, autoMax, pct, ...ansCols];
    });
    const safeDate = formatDate(session.createdAt).replace(/[: /]/g, "-");
    downloadCSV(`sesja_${session.code}_${safeDate}.csv`, [header, ...rows]);
  };

  const colorClass = (pct) =>
    pct === null ? "" : pct >= 60 ? "good" : pct >= 35 ? "mid" : "bad";

  const renderStats = () => {
    if (!quiz || !players) return (
      <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700, padding: "14px 0" }}>
        Ładowanie danych...
      </p>
    );
    if (players.length === 0) return (
      <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700, padding: "12px 0" }}>
        Brak graczy — brak statystyk.
      </p>
    );

    const stats   = computeQuestionStats(players, quiz.questions ?? []);
    const autoQ   = stats.filter(s => s.type !== "text");
    const avgPct  = autoQ.length > 0
      ? Math.round(autoQ.reduce((s, q) => s + (q.pct ?? 0), 0) / autoQ.length)
      : null;
    const hardest = autoQ.length > 0
      ? autoQ.reduce((a, b) => (a.pct ?? 101) < (b.pct ?? 101) ? a : b)
      : null;

    return (
      <div style={{ paddingBottom: 8 }}>
        <div className="stats-summary">
          <div className="stats-summary-card">
            <div className="stats-summary-num">{players.length}</div>
            <div className="stats-summary-label">Graczy</div>
          </div>
          <div className="stats-summary-card">
            <div className="stats-summary-num">{avgPct !== null ? avgPct + "%" : "—"}</div>
            <div className="stats-summary-label">Śr. poprawność</div>
          </div>
          <div className="stats-summary-card">
            <div className="stats-summary-num" style={{ fontSize: 18, paddingTop: 4 }}>
              {hardest ? `#${hardest.index + 1}` : "—"}
            </div>
            <div className="stats-summary-label">Najtrudniejsze</div>
          </div>
        </div>
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.index} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-q-num">Pytanie {s.index + 1}</span>
                {s.type !== "text" && s.pct !== null ? (
                  <span className={`stat-pct-badge ${colorClass(s.pct)}`}>{s.pct}%</span>
                ) : (
                  <span className="stat-pct-badge" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    ręcznie
                  </span>
                )}
              </div>
              <div className="stat-q-text">{s.question}</div>
              {s.type !== "text" ? (
                <>
                  <div className="stat-bar-bg" style={{ marginTop: 10 }}>
                    <div className={`stat-bar-fill ${colorClass(s.pct)}`} style={{ width: `${s.pct ?? 0}%` }} />
                  </div>
                  <div className="stat-meta">{s.correct} / {s.answered} poprawnych odpowiedzi</div>
                </>
              ) : (
                <div className="stat-text-note">Pytanie otwarte — ocena ręczna</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="session-row">
      <div className="session-row-header" onClick={handleToggle}>
        <div className="session-row-info">
          <span className="session-row-title">{session.quizTitle || "Quiz"}</span>
          <span className="session-row-meta">
            Kod: <strong>{session.code}</strong> · {formatDate(session.createdAt)}
          </span>
        </div>
        <div className="session-row-right">
          <span className={`session-status session-status--${session.status}`}>
            {session.status === "waiting"  ? "Oczekiwanie"
              : session.status === "active" ? "Trwa"
              : "Zakończona"}
          </span>
          {session.status === "active" && (
            <button className="save-btn" style={{ fontSize: "13px", padding: "6px 14px" }}
              onClick={(e) => { e.stopPropagation(); navigate(`/host/${session.id}`); }}>
              Wróć do sesji
            </button>
          )}
          {session.status === "finished" && (
            <>
              <button className="csv-btn" onClick={handleCSV} title="Pobierz wyniki CSV">
                Eksport CSV
              </button>
              <button className="add-question-btn" style={{ fontSize: "13px", padding: "6px 14px" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/results/${session.id}`); }}>
                Wyniki
              </button>
            </>
          )}
          <span className="session-expand-icon">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="session-row-players">
          <div className="session-inner-tabs">
            <button className={`session-inner-tab ${innerTab === "players" ? "active" : ""}`}
              onClick={() => setInnerTab("players")}>Gracze</button>
            <button className={`session-inner-tab ${innerTab === "stats" ? "active" : ""}`}
              onClick={() => setInnerTab("stats")}>Statystyki pytań</button>
          </div>
          {loadingInner && (
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700, padding: "14px 0" }}>
              Ładowanie...
            </p>
          )}
          {!loadingInner && innerTab === "players" && (
            !players || players.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700, padding: "14px 0" }}>
                Brak graczy w tej sesji.
              </p>
            ) : (
              <table className="history-table">
                <thead><tr><th>#</th><th>Nick</th><th>Wynik</th><th>Status</th></tr></thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td><td>{p.nick}</td><td>{p.score ?? 0} pkt</td>
                      <td>
                        <span className={`player-status player-status--${p.status}`}>
                          {p.status === "finished" ? "Ukończył" : "W trakcie"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {!loadingInner && innerTab === "stats" && renderStats()}
        </div>
      )}
    </div>
  );
}

// historia sesji
function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      where("hostId", "==", auth.currentUser.uid)
    );
    const unsub = onSnapshot(q,
      (snap) => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toDate?.() ?? new Date(0);
            const tb = b.createdAt?.toDate?.() ?? new Date(0);
            return tb - ta;
          });
        setSessions(list);
        setLoading(false);
      },
      (err) => { console.error("Historia sesji – błąd:", err.message); setLoading(false); }
    );
    return () => unsub();
  }, []);

  if (loading) return <p className="loading-text">Ładowanie historii...</p>;
  if (sessions.length === 0) return (
    <div className="empty-state" style={{ padding: "40px 0" }}>
      <div className="empty-icon">🎮</div>
      <h3>Brak historii sesji</h3>
      <p>Uruchom quiz, aby zobaczyć tu historię rozgrywek.</p>
    </div>
  );

  return (
    <div className="session-history">
      {sessions.map(s => <SessionRow key={s.id} session={s} navigate={navigate} />)}
    </div>
  );
}

// Strona główna
function ManageQuizzesPage() {
  const [quizzes, setQuizzes]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "quizzes"),
          where("authorId", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toDate?.() ?? new Date(0);
            const tb = b.createdAt?.toDate?.() ?? new Date(0);
            return tb - ta;
          });
        setQuizzes(list);
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
          <Link to="/create" className="save-btn">+ Utwórz nowy quiz</Link>
        )}
      </div>

      <div className="manage-tabs">
        <button className={`manage-tab ${activeTab === "quizzes" ? "active" : ""}`}
          onClick={() => setActiveTab("quizzes")}>Moje quizy</button>
        <button className={`manage-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}>Historia sesji</button>
      </div>

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

      {activeTab === "history" && <SessionHistory />}
    </div>
  );
}

export default ManageQuizzesPage;
