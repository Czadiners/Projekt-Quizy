import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc,
  onSnapshot, collection, deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../components/Firebase";

function HostPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubSession = onSnapshot(doc(db, "sessions", sessionId), async (snap) => {
      if (!snap.exists()) { navigate("/manage"); return; }
      const data = snap.data();
      if (data.hostId !== auth.currentUser?.uid) { navigate("/manage"); return; }
      setSession({ id: snap.id, ...data });

      if (!quiz) {
        const quizSnap = await getDoc(doc(db, "quizzes", data.quizId));
        if (quizSnap.exists()) setQuiz({ id: quizSnap.id, ...quizSnap.data() });
      }
      setLoading(false);
    });

    const unsubPlayers = onSnapshot(collection(db, "sessions", sessionId, "players"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      setPlayers(list);
    });

    return () => { unsubSession(); unsubPlayers(); };
  }, [sessionId, navigate]);

  const handleStart = async () => {
    if (players.length === 0) { setError("Poczekaj aż przynajmniej jeden gracz dołączy."); return; }
    await updateDoc(doc(db, "sessions", sessionId), { status: "active" });
    setError("");
  };

  const handleEnd = async () => {
    if (!window.confirm("Zakończyć sesję? Gracze nie będą mogli dalej grać.")) return;
    await updateDoc(doc(db, "sessions", sessionId), { status: "finished", finishedAt: new Date() });
    navigate(`/results/${sessionId}`);
  };

  const handleKickPlayer = async (playerId) => {
    await deleteDoc(doc(db, "sessions", sessionId, "players", playerId));
  };

  if (loading) return <div className="manage-page"><p className="loading-text">Ładowanie sesji...</p></div>;

  const totalPoints = quiz?.questions?.filter(q => q.type !== "text")
    ?.reduce((sum, q) => sum + (q.points || 1), 0) ?? 0;
  const finishedCount = players.filter(p => p.status === "finished").length;

  return (
    <div className="host-page">
      <div className="host-header">
        <div>
          <h2>{quiz?.title ?? "Quiz"}</h2>
          <p className="host-subtitle">
            {session.status === "waiting"
              ? "Udostępnij kod i poczekaj na graczy"
              : session.status === "active"
              ? `Trwa gra · ${finishedCount} / ${players.length} ukończyło`
              : "Sesja zakończona"}
          </p>
        </div>
        <div className="host-actions">
          {session.status === "waiting" && (
            <button className="save-btn" onClick={handleStart}>Rozpocznij quiz</button>
          )}
          {session.status === "active" && (
            <button className="remove-btn" onClick={handleEnd}>Zakończ sesję</button>
          )}
          {session.status === "finished" && (
            <button className="save-btn" onClick={() => navigate(`/results/${sessionId}`)}>
              Zobacz wyniki
            </button>
          )}
        </div>
      </div>

      {/* pin do gry */}
      <div className="session-code-banner">
        <span className="session-code-label">Kod dostępu</span>
        <span className="session-code">{session.code}</span>
        <span className="session-code-hint">Wejdź na stronę i wpisz kod</span>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "16px" }}>{error}</p>}

      <div className="host-players">
        <h3>
          {session.status === "waiting"
            ? `Lobby - ${players.length} graczy`
            : `Ranking na żywo — ${players.length} graczy`}
        </h3>

        {players.length === 0 ? (
          <p className="host-empty">Brak graczy. Udostępnij kod, aby dołączyli.</p>
        ) : (
          <div className="players-list">
            {players.map((player, index) => (
              <div key={player.id} className="player-row">
                <span className="player-rank">
                  {session.status !== "waiting" ? `#${index + 1}` : ""}
                </span>
                <span className="player-nick">{player.nick}</span>
                <span className={`player-status player-status--${player.status}`}>
                  {player.status === "playing" ? "Gra" : player.status === "finished" ? "Ukończył" : "Czeka"}
                </span>
                {session.status !== "waiting" && (
                  <span className="player-score">{player.score ?? 0} / {totalPoints} pkt</span>
                )}
                {session.status === "waiting" && (
                  <button className="kick-btn" onClick={() => handleKickPlayer(player.id)}>
                    Usuń
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HostPage;
