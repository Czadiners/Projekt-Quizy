import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot, collection, updateDoc } from "firebase/firestore";
import { db } from "../components/Firebase";


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

function Podium({ players }) {
  if (players.length === 0) return null;
  const top = players.slice(0, 3);
  // Render order: 2nd, 1st, 3rd
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const ranks = top[1] ? [2, 1, 3] : [1];

  return (
    <div className="results-podium">
      {order.map((p, idx) => {
        const rank = ranks[idx];
        const medals = ["🥇", "🥈", "🥉"];
        const rankClass = `podium-place podium-place--${rank}`;
        return (
          <div key={p.id} className={rankClass}>
            <div className="podium-medal">{medals[rank - 1]}</div>
            <div className="podium-nick">{p.nick}</div>
            <div className="podium-score">{p.score ?? 0} pkt</div>
          </div>
        );
      })}
    </div>
  );
}

function ResultsPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();
  const isPlayerView = !!playerId;

  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingFor, setSavingFor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
      if (!sessionSnap.exists()) { navigate("/"); return; }
      const sessionData = { id: sessionSnap.id, ...sessionSnap.data() };
      setSession(sessionData);
      const quizSnap = await getDoc(doc(db, "quizzes", sessionData.quizId));
      if (quizSnap.exists()) setQuiz({ id: quizSnap.id, ...quizSnap.data() });
      setLoading(false);
    };
    fetchData();

    const unsubPlayers = onSnapshot(collection(db, "sessions", sessionId, "players"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      setPlayers(list);
      if (playerId) {
        const found = list.find((p) => p.id === playerId);
        if (found) setPlayer(found);
      }
    });

    return () => unsubPlayers();
  }, [sessionId, playerId, navigate]);

  const handleManualPoints = async (pid, questionIndex, newPoints) => {
    const targetPlayer = players.find(p => p.id === pid);
    if (!targetPlayer) return;
    setSavingFor(`${pid}_${questionIndex}`);
    const updatedAnswers = (targetPlayer.answers ?? []).map((a, i) =>
      i !== questionIndex ? a : { ...a, earnedPoints: Number(newPoints), manuallyGraded: true }
    );
    const newScore = updatedAnswers.reduce((sum, a) => sum + (a.earnedPoints || 0), 0);
    await updateDoc(doc(db, "sessions", sessionId, "players", pid), {
      answers: updatedAnswers, score: newScore,
    });
    setSavingFor(null);
  };

  if (loading) return <div className="manage-page"><p className="loading-text">Ładowanie wyników...</p></div>;

  const autoMaxPoints = quiz?.questions?.filter(q => q.type !== "text")
    ?.reduce((sum, q) => sum + (q.points || 1), 0) ?? 0;
  const textQuestions = quiz?.questions?.map((q, i) => ({ ...q, index: i }))?.filter(q => q.type === "text") ?? [];
  const getPlayerMax = (p) => {
    const manualGranted = (p.answers ?? []).filter(a => a.needsManualReview && a.manuallyGraded)
      .reduce((sum, a) => sum + (a.earnedPoints || 0), 0);
    return autoMaxPoints + manualGranted;
  };

  /* ── PLAYER VIEW ── */
  if (isPlayerView) {
    if (!player) return <div className="manage-page"><p className="loading-text">Ładowanie wyników...</p></div>;
    const myRank = players.findIndex(p => p.id === playerId) + 1;
    const playerMax = getPlayerMax(player);
    const percent = playerMax > 0 ? Math.round((player.score / playerMax) * 100) : 0;

    return (
      <div className="results-page">
        <Podium players={players} />

        <div className="results-card">
          <h2>Twój wynik</h2>
          <p className="results-quiz-title">{quiz?.title}</p>

          <div className="results-score-big">
            <span className="results-score-num">{player.score ?? 0}</span>
            <span className="results-score-max">/ {playerMax} pkt</span>
          </div>
          <div className="results-percent">{percent}%</div>
          <div className="results-rank">Miejsce #{myRank} z {players.length} graczy</div>

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

          <div className="results-answers">
            <h3>Twoje odpowiedzi</h3>
            {quiz?.questions?.map((q, i) => {
              const ans = player.answers?.[i];
              if (!ans) return null;
              const cls = ans.needsManualReview
                ? (ans.manuallyGraded ? "manual-graded" : "manual")
                : (ans.correct ? "correct" : "wrong");
              return (
                <div key={i} className={`results-answer-row ${cls}`}>
                  <div className="results-answer-q">
                    <span className="results-answer-num">{i + 1}.</span>
                    {q.question}
                  </div>
                  <div className="results-answer-detail">
                    {ans.needsManualReview ? (
                      <>
                        <div className="results-text-answer-preview">
                          Twoja odpowiedź: <em>{ans.answer || "brak odpowiedzi"}</em>
                        </div>
                        {ans.manuallyGraded
                          ? <span className="results-correct-badge">Oceniono: +{ans.earnedPoints} pkt</span>
                          : <span className="results-manual-badge">Oczekuje na ocenę prowadzącego</span>
                        }
                      </>
                    ) : (
                      ans.correct
                        ? <span className="results-correct-badge">Poprawnie · +{ans.earnedPoints} pkt</span>
                        : <span className="results-wrong-badge">Błędnie · 0 pkt</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── HOST VIEW ── */
  return (
    <div className="results-page">
      <div className="results-header">
        <h2>Wyniki – {quiz?.title}</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="csv-btn" onClick={() => {
            const questions = quiz?.questions ?? [];
            const autoMax   = questions.filter(q => q.type !== "text")
              .reduce((s, q) => s + (q.points || 1), 0);
            const header = [
              "Nick", "Wynik", "Maks. punktów", "%",
              ...questions.map((_, i) => `Pytanie ${i + 1}`),
            ];
            const rows = players.map(p => {
              const score = p.score ?? 0;
              const pct   = autoMax > 0 ? Math.round((score / autoMax) * 100) + "%" : "—";
              const ansCols = questions.map((_, i) => {
                const a = p.answers?.[i];
                if (!a) return "brak";
                if (a.needsManualReview) return a.answer ?? "brak";
                return a.correct ? "poprawna" : "błędna";
              });
              return [p.nick, score, autoMax, pct, ...ansCols];
            });
            downloadCSV(`wyniki_${quiz?.title ?? "sesja"}.csv`, [header, ...rows]);
          }}>
            Eksport CSV
          </button>
          <button className="back-btn" onClick={() => navigate("/manage")}>Wróć do quizów</button>
        </div>
      </div>

      <Podium players={players} />

      <div className="results-section">
        <h3>Ranking końcowy</h3>
        <div className="players-list">
          {players.map((p, i) => {
            const pMax = getPlayerMax(p);
            const pPercent = pMax > 0 ? Math.round((p.score / pMax) * 100) : 0;
            return (
              <div key={p.id} className="player-row">
                <span className="player-rank">#{i + 1}</span>
                <span className="player-nick">{p.nick}</span>
                <span className={`player-status player-status--${p.status}`}>
                  {p.status === "finished" ? "Ukończył" : "W trakcie"}
                </span>
                <span className="player-score">{p.score ?? 0} / {pMax} pkt ({pPercent}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {textQuestions.length > 0 && (
        <div className="results-section">
          <h3>Odpowiedzi do ręcznej oceny</h3>
          <p className="results-manual-info">
            Przyznane punkty zostaną automatycznie dodane do wyniku gracza.
          </p>
          {textQuestions.map((q) => (
            <div key={q.index} className="manual-review-block">
              <p className="manual-review-question">
                <strong>Pytanie {q.index + 1}:</strong> {q.question}
              </p>
              {players.filter(p => p.answers?.[q.index]).map((p) => (
                <ManualGradeRow
                  key={p.id}
                  nick={p.nick}
                  answer={p.answers[q.index].answer}
                  currentPoints={p.answers[q.index].earnedPoints ?? 0}
                  isGraded={!!p.answers[q.index].manuallyGraded}
                  isSaving={savingFor === `${p.id}_${q.index}`}
                  onSave={(pts) => handleManualPoints(p.id, q.index, pts)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualGradeRow({ nick, answer, currentPoints, isGraded, isSaving, onSave }) {
  const [points, setPoints] = useState(currentPoints);
  useEffect(() => { setPoints(currentPoints); }, [currentPoints]);

  return (
    <div className="manual-review-row">
      <span className="manual-review-nick">{nick}</span>
      <span className="manual-review-answer">{answer || <em>Brak odpowiedzi</em>}</span>
      <div className="manual-review-points">
        {isGraded && <span className="manual-graded-badge">Oceniono</span>}
        <input
          type="number" min="0" max="100"
          className="points-input"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
        />
        <button
          className="save-btn"
          style={{ fontSize: "13px", padding: "6px 14px", boxShadow: "0 4px 0 var(--primary-shadow)" }}
          onClick={() => onSave(points)}
          disabled={isSaving}
        >
          {isSaving ? "..." : "Zapisz"}
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
