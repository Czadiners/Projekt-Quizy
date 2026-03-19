import { useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {auth} from "../components/Firebase";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      console.log("Wylogowano pomyślnie");
    } catch (error) {
      alert("Błąd podczas wylogowywania: " + error.message);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <Link to="/">maciej</Link>

      <button className="close-btn" onClick={toggleSidebar}>
        ✕
      </button>

      <div className="profile-section">
        <div
          className="profile-icon"
          style={{ background: isLoggedIn ? "#4caf50" : "#888"}}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          👾
        </div>

        {profileOpen && (
          <div className="profile-menu">
            {!isLoggedIn ? (
              <>
                <Link to="/login">Zaloguj</Link>
                <Link to= "/register">Utwórz konto</Link>
              </>
            ) : (
              <button onClick={handleLogout}>Wyloguj</button>
            )}
          </div>
        )}
      </div>

      <ul>
        <li>Utwórz quiz</li>
        <li>Manage your quiz</li>
      </ul>
    </div>
  );
}

export default Sidebar;