import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../components/Firebase";

function ResultsPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [manualPoints, setManualPoints] = useState({}); // {playerId_questionIndex: points}

  useEffect(() => {
    const fetchData = async () => {
      const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
      if (!sessionSnap.exists()) { navigate("/"); return; }
      const sessionData = { id: sessionSnap.id, ...sessionSnap.data() };
      setSession(sessionData);

      const hostCheck = auth.currentUser?.uid === sessionData.hostId;
      setIsHost(hostCheck);

      const quizSnap = await getDoc(doc(db, "quizzes", sessionData.quizId));
      if (quizSnap.exists()) setQuiz({ id: quizSnap.id, ...quizSnap.data() });

      setLoading(false);
    };
    fetchData();

    // Nasłuchuj graczy na żywo (ranking)
    const unsubPlayers = onSnapshot(
      collection(db, "sessions", sessionId, "players"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.score || 0) - (a.score || 0));
        setPlayers(list);

        if (playerId) {
          const p = list.find((p) => p.id === playerId);
          if (p) setPlayer(p);
        }
      }
    );

    return () => unsubPlayers();
  }, [sessionId, playerId, navigate]);

  const handleManualPoints = async (pid, questionIndex, points, currentAnswers) => {
    const key = `${pid}_${questionIndex}`;
    setManualPoints({ ...manualPoints, [key]: points });

    const updatedAnswers = currentAnswers.map((a, i) =>
      i === questionIndex ? { ...a, earnedPoints: Number(points) } : a
    );
    const newScore = updatedAnswers.reduce((sum, a) => sum + (a.earnedPoints || 0), 0);

    await updateDoc(doc(db, "sessions", sessionId, "players", pid), {
      answers: updatedAnswers,
      score: newScore,
    });
  };

  if (loading) return <div className="manage-page"><p className="loading-text">Ładowanie wyników...</p></div>;

  const totalAutoPoints = quiz?.questions
    ?.filter(q => q.type !== "text")
    ?.reduce((sum, q) => sum + (q.points || 1), 0) ?? 0;

  const textQuestions = quiz?.questions
    ?.map((q, i) => ({ ...q, index: i }))
    ?.filter(q => q.type === "text") ?? [];

  // WIDOK GRACZA
  if (!isHost && player) {
    const myRank = players.findIndex(p => p.id === playerId) + 1;
    const percent = totalAutoPoints > 0
      ? Math.round((player.score / totalAutoPoints) * 100)
      : 0;

    return (
      <div className="results-page">
        <div className="results-card">
          <h2>Twoje wyniki</h2>
          <p className="results-quiz-title">{quiz?.title}</p>

          <div className="results-score-big">
            <span className="results-score-num">{player.score}</span>
            <span className="results-score-max">/ {totalAutoPoints} pkt</span>
          </div>

          <div className="results-percent">{percent}%</div>
          <div className="results-rank">Miejsce #{myRank} z {players.length} graczy</div>

          {/* Ranking */}
          <div className="results-ranking">
            <h3>Ranking</h3>
            {players.map((p, i) => (
              <div key={p.id} className={`results-rank-row ${p.id === playerId ? "highlight" : ""}`}>
                <span className="results-rank-pos">#{i + 1}</span>
                <span className="results-rank-nick">{p.nick}</span>
                <span className="results-rank-score">{p.score ?? 0} pkt</span>
              </div>
            ))}
          </div>

          {/* Odpowiedzi */}
          <div className="results-answers">
            <h3>Twoje odpowiedzi</h3>
            {quiz?.questions?.map((q, i) => {
              const ans = player.answers?.[i];
              if (!ans) return null;
              return (
                <div key={i} className={`results-answer-row ${ans.needsManualReview ? "manual" : ans.correct ? "correct" : "wrong"}`}>
                  <div className="results-answer-q">
                    <span className="results-answer-num">{i + 1}.</span>
                    {q.question}
                  </div>
                  <div className="results-answer-detail">
                    {ans.needsManualReview
                      ? <span className="results-manual-badge">Oczekuje na ocenę prowadzącego</span>
                      : ans.correct
                      ? <span className="results-correct-badge">Poprawnie · +{ans.earnedPoints} pkt</span>
                      : <span className="results-wrong-badge">Błędnie · 0 pkt</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // WIDOK HOSTA
  return (
    <div className="results-page">
      <div className="results-header">
        <h2>Wyniki sesji – {quiz?.title}</h2>
        <button className="back-btn" onClick={() => navigate("/manage")}>
          Wróć do quizów
        </button>
      </div>

      {/* RANKING */}
      <div className="results-section">
        <h3>Ranking końcowy</h3>
        <div className="players-list">
          {players.map((p, i) => (
            <div key={p.id} className="player-row">
              <span className="player-rank">#{i + 1}</span>
              <span className="player-nick">{p.nick}</span>
              <span className={`player-status player-status--${p.status}`}>
                {p.status === "finished" ? "Ukończył" : "W trakcie"}
              </span>
              <span className="player-score">{p.score ?? 0} / {totalAutoPoints} pkt</span>
            </div>
          ))}
        </div>
      </div>

      {/* RĘCZNA OCENA ODPOWIEDZI TEKSTOWYCH */}
      {textQuestions.length > 0 && (
        <div className="results-section">
          <h3>Odpowiedzi do ręcznej oceny</h3>
          {textQuestions.map((q) => (
            <div key={q.index} className="manual-review-block">
              <p className="manual-review-question">
                <strong>Pytanie {q.index + 1}:</strong> {q.question}
              </p>
              {players.filter(p => p.answers?.[q.index]).map((p) => {
                const ans = p.answers[q.index];
                const key = `${p.id}_${q.index}`;
                return (
                  <div key={p.id} className="manual-review-row">
                    <span className="manual-review-nick">{p.nick}</span>
                    <span className="manual-review-answer">
                      {ans.answer ?? <em>Brak odpowiedzi</em>}
                    </span>
                    <div className="manual-review-points">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="points-input"
                        value={manualPoints[key] ?? ans.earnedPoints ?? 0}
                        onChange={(e) => setManualPoints({ ...manualPoints, [key]: e.target.value })}
                      />
                      <button
                        className="save-btn"
                        style={{ fontSize: "13px", padding: "6px 12px" }}
                        onClick={() => handleManualPoints(p.id, q.index, manualPoints[key] ?? 0, p.answers)}
                      >
                        Zapisz
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResultsPage;
