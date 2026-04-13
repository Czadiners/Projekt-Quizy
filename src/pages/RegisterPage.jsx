import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../components/Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

function getFirebaseError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Ten adres e-mail jest już zarejestrowany.";
    case "auth/invalid-email":
      return "Podaj poprawny adres e-mail.";
    case "auth/weak-password":
      return "Hasło musi mieć co najmniej 6 znaków.";
    default:
      return "Wystąpił błąd. Spróbuj ponownie.";
  }
}

function RegisterPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const register = async () => {
    setError("");
    if (!email.trim())              { setError("Podaj adres e-mail."); return; }
    if (password.length < 6)        { setError("Hasło musi mieć co najmniej 6 znaków."); return; }
    if (password !== confirm)       { setError("Hasła się nie zgadzają."); return; }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") register(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-icon">✨</div>
          <h2>Utwórz konto</h2>
          <p className="auth-card-subtitle">Dołącz i twórz własne quizy</p>
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
              placeholder="Minimum 6 znaków"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={handleKey}
            />
            <button className="auth-eye-btn" type="button" onClick={() => setShowPass((p) => !p)} tabIndex={-1}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label>Powtórz hasło</label>
          <div className="auth-input-wrap">
            <input
              type={showConf ? "text" : "password"}
              placeholder="Wpisz hasło ponownie"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              onKeyDown={handleKey}
            />
            <button className="auth-eye-btn" type="button" onClick={() => setShowConf((p) => !p)} tabIndex={-1}>
              {showConf ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="auth-submit">
          <button className="save-btn" onClick={register} disabled={loading}>
            {loading ? "Tworzenie konta..." : "Zarejestruj się"}
          </button>
        </div>

        <div className="auth-link-row">
          Masz już konto?{" "}
          <Link to="/login">Zaloguj się</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
