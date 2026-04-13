import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../components/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Footer from "../components/Footer";

function getFirebaseError(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Nieprawidłowy email lub hasło.";
    case "auth/too-many-requests":
      return "Za dużo prób. Spróbuj ponownie za chwilę.";
    case "auth/invalid-email":
      return "Podaj poprawny adres e-mail.";
    default:
      return "Wystąpił błąd. Spróbuj ponownie.";
  }
}

function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    setError("");
    if (!email.trim())    { setError("Podaj adres e-mail."); return; }
    if (!password)        { setError("Podaj hasło."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") login(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-icon">🔑</div>
          <h2>Witaj z powrotem!</h2>
          <p className="auth-card-subtitle">Zaloguj się, aby zarządzać quizami</p>
        </div>

        <div className="auth-field">
          <label>Adres e-mail</label>
          <div className="auth-input-wrap">
            <input
              type="email"
              placeholder="jan@przykład.pl"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>
        </div>

        <div className="auth-field">
          <label>Hasło</label>
          <div className="auth-input-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={handleKey}
            />
            <button
              className="auth-eye-btn"
              type="button"
              onClick={() => setShowPass((p) => !p)}
              tabIndex={-1}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="auth-submit">
          <button className="save-btn" onClick={login} disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </div>

        <div className="auth-link-row">
          Nie masz konta?{" "}
          <Link to="/register">Zarejestruj się</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default LoginPage;
