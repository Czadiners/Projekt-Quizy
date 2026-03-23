import Footer from "../components/Footer";
import Header from "../components/Header";
import { useState } from "react";
import { auth } from "../components/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth"
import { useNavigate } from "react-router";

function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Zalogowano!");
      navigate('/')
    } catch (err) {
      alert("Wprowadzono nieprawidłowe dane");
    }
  };

  return (
    <div className="loginPage">
      <h2>Login</h2>

      <input
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="hasło"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Login</button>
      <Footer />
    </div>
  );
}

export default LoginPage;