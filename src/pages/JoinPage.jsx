import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../components/Firebase";

function JoinPage() {
  const [code, setCode] = useState("");
  const [nick, setNick] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    setError("");
    if (!code.trim() || code.trim().length !== 6) {
      setError("Wpisz poprawny 6-cyfrowy kod.");
      return;
    }
    if (!nick.trim()) {
      setError("Wpisz swój nick.");
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "sessions"),
        where("code", "==", code.trim().toUpperCase()),
        where("status", "in", ["waiting", "active"])
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Nie znaleziono sesji z tym kodem. Sprawdź czy kod jest poprawny.");
        setLoading(false);
        return;
      }

      const sessionDoc = snap.docs[0];
      const sessionId = sessionDoc.id;

      // Sprawdź czy nick nie jest zajęty
      const playersSnap = await getDocs(
        collection(db, "sessions", sessionId, "players")
      );
      const nickTaken = playersSnap.docs.some(
        (d) => d.data().nick.toLowerCase() === nick.trim().toLowerCase()
      );
      if (nickTaken) {
        setError("Ten nick jest już zajęty w tej sesji. Wybierz inny.");
        setLoading(false);
        return;
      }

      // Dołącz do sesji
      const playerRef = await addDoc(
        collection(db, "sessions", sessionId, "players"),
        {
          nick: nick.trim(),
          joinedAt: serverTimestamp(),
          status: "playing",
          score: 0,
          answers: [],
        }
      );

      navigate(`/play/${sessionId}?playerId=${playerRef.id}`);
    } catch (err) {
      setError("Błąd połączenia: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <h2>Dołącz do quizu</h2>
        <p className="wizard-subtitle">Wpisz kod sesji i swój nick</p>

        <div className="join-field">
          <label>Kod sesji</label>
          <input
            type="text"
            placeholder="np. A3F7K2"
            maxLength={6}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            className="code-input"
          />
        </div>

        <div className="join-field">
          <label>Twój nick</label>
          <input
            type="text"
            placeholder="np. Jan"
            maxLength={20}
            value={nick}
            onChange={(e) => { setNick(e.target.value); setError(""); }}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="wizard-actions">
          <button className="save-btn" onClick={handleJoin} disabled={loading}>
            {loading ? "Łączenie..." : "Dołącz"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
