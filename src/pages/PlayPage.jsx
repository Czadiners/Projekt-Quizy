import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../components/Firebase";

function PlayPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIndex]: answer }
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [waitingForStart, setWaitingForStart] = useState(true);

  useEffect(() => {
    if (!playerId) { navigate("/join"); return; }

    const unsubSession = onSnapshot(doc(db, "sessions", sessionId), async (snap) => {
      if (!snap.exists()) { navigate("/join"); return; }
      const data = snap.data();
      setSession({ id: snap.id, ...data });

      if (data.status === "finished" && !submitted) {
        navigate(`/results/${sessionId}?playerId=${playerId}`);
        return;
      }

      if (data.status === "active" || data.status === "finished") {
        setWaitingForStart(false);
      }

      if (!quiz && data.quizId) {
        const quizSnap = await getDoc(doc(db, "quizzes", data.quizId));
        if (quizSnap.exists()) {
          setQuiz({ id: quizSnap.id, ...quizSnap.data() });
        }
      }

      setLoading(false);
    });

    return () => unsubSession();
  }, [sessionId, playerId, navigate, submitted]);

  const currentQuestion = quiz?.questions?.[currentIndex];
  const totalQuestions = quiz?.questions?.length ?? 0;

  const handleAnswer = (value) => {
    if (submitted) return;
    setError("");

    if (currentQuestion.type === "multiple") {
      const prev = answers[currentIndex] ?? [];
      const next = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      setAnswers({ ...answers, [currentIndex]: next });
    } else {
      setAnswers({ ...answers, [currentIndex]: value });
    }
  };

  const handleTextAnswer = (value) => {
    setAnswers({ ...answers, [currentIndex]: value });
  };

  const handleNext = () => {
    if (answers[currentIndex] === undefined || answers[currentIndex] === "") {
      setError("Wybierz lub wpisz odpowiedź przed przejściem dalej.");
      return;
    }
    setError("");
    setCurrentIndex(currentIndex + 1);
  };

  const handleFinish = async () => {
    if (answers[currentIndex] === undefined || answers[currentIndex] === "") {
      setError("Wybierz lub wpisz odpowiedź przed zakończeniem.");
      return;
    }
    setError("");
    setSubmitted(true);

    // Oblicz punkty automatyczne
    let totalScore = 0;
    const answersArray = quiz.questions.map((q, i) => {
      const userAnswer = answers[i];
      let correct = false;
      let earnedPoints = 0;

      if (q.type === "single") {
        correct = userAnswer === q.correctIndex;
        earnedPoints = correct ? (q.points ?? 1) : 0;
      } else if (q.type === "multiple") {
        const userSet = new Set(userAnswer ?? []);
        const correctSet = new Set(q.correctIndexes ?? []);
        correct = userSet.size === correctSet.size &&
          [...userSet].every(v => correctSet.has(v));
        earnedPoints = correct ? (q.points ?? 1) : 0;
      } else if (q.type === "truefalse") {
        correct = userAnswer === q.correct;
        earnedPoints = correct ? (q.points ?? 1) : 0;
      } else if (q.type === "text") {
        earnedPoints = 0; // ręcznie
      }

      totalScore += earnedPoints;
      return {
        questionIndex: i,
        answer: userAnswer ?? null,
        correct,
        earnedPoints,
        needsManualReview: q.type === "text",
      };
    });

    try {
      await updateDoc(doc(db, "sessions", sessionId, "players", playerId), {
        status: "finished",
        score: totalScore,
        answers: answersArray,
        finishedAt: new Date(),
      });
      navigate(`/results/${sessionId}?playerId=${playerId}`);
    } catch (err) {
      setError("Błąd podczas zapisywania wyników: " + err.message);
      setSubmitted(false);
    }
  };

  if (loading) return <div className="manage-page"><p className="loading-text">Łączenie z sesją...</p></div>;

  // Oczekiwanie na start
  if (waitingForStart) return (
    <div className="play-waiting">
      <div className="play-waiting-card">
        <div className="play-waiting-spinner" />
        <h2>Poczekaj na start</h2>
        <p>Gospodarz za chwilę rozpocznie quiz.</p>
        <p className="play-waiting-quiz">{quiz?.title}</p>
      </div>
    </div>
  );

  if (!currentQuestion) return null;

  const isLast = currentIndex === totalQuestions - 1;
  const selectedAnswer = answers[currentIndex];

  return (
    <div className="play-page">
      <div className="play-progress-bar">
        <div
          className="play-progress-fill"
          style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
        />
      </div>

      <div className="play-card">
        <div className="play-header">
          <span className="play-counter">Pytanie {currentIndex + 1} z {totalQuestions}</span>
          {currentQuestion.type !== "text" && (
            <span className="play-points-badge">{currentQuestion.points ?? 1} pkt</span>
          )}
        </div>

        <h2 className="play-question">{currentQuestion.question}</h2>

        {/* SINGLE */}
        {currentQuestion.type === "single" && (
          <div className="play-answers">
            {currentQuestion.answers.map((answer, i) => (
              <button
                key={i}
                className={`play-answer-btn ${selectedAnswer === i ? "selected" : ""}`}
                onClick={() => handleAnswer(i)}
              >
                <span className="play-answer-letter">{String.fromCharCode(65 + i)}</span>
                {answer}
              </button>
            ))}
          </div>
        )}

        {/* MULTIPLE */}
        {currentQuestion.type === "multiple" && (
          <div className="play-answers">
            <p className="correct-hint">Zaznacz wszystkie poprawne odpowiedzi.</p>
            {currentQuestion.answers.map((answer, i) => (
              <button
                key={i}
                className={`play-answer-btn ${(selectedAnswer ?? []).includes(i) ? "selected" : ""}`}
                onClick={() => handleAnswer(i)}
              >
                <span className="play-answer-letter">
                  {(selectedAnswer ?? []).includes(i) ? "✓" : String.fromCharCode(65 + i)}
                </span>
                {answer}
              </button>
            ))}
          </div>
        )}

        {/* TRUE/FALSE */}
        {currentQuestion.type === "truefalse" && (
          <div className="play-answers play-answers--tf">
            <button
              className={`play-answer-btn ${selectedAnswer === true ? "selected" : ""}`}
              onClick={() => handleAnswer(true)}
            >
              Prawda
            </button>
            <button
              className={`play-answer-btn ${selectedAnswer === false ? "selected" : ""}`}
              onClick={() => handleAnswer(false)}
            >
              Fałsz
            </button>
          </div>
        )}

        {/* TEXT */}
        {currentQuestion.type === "text" && (
          <div className="play-text-answer">
            <textarea
              placeholder="Wpisz swoją odpowiedź..."
              value={selectedAnswer ?? ""}
              onChange={(e) => handleTextAnswer(e.target.value)}
              rows={4}
            />
            <p className="correct-hint">Ta odpowiedź zostanie oceniona ręcznie przez prowadzącego.</p>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="play-footer">
          {!isLast ? (
            <button className="save-btn" onClick={handleNext}>Dalej</button>
          ) : (
            <button className="save-btn" onClick={handleFinish} disabled={submitted}>
              {submitted ? "Zapisywanie..." : "Zakończ quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayPage;
