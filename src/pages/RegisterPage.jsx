import { useState } from "react";
import { auth } from "../components/Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Konto utworzone!");
    } catch (err) {
      alert("Wystąpił błąd podczas rejestracji");
    }
  };

  return (
    <div>
      <h2>Rejestracja</h2>

      <input
        placeholder="Adres e-mail"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Hasło"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={register}>Zarejestruj się</button>
    </div>
  );
}

export default RegisterPage;
