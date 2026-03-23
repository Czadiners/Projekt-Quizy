import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {auth} from "../components/Firebase";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      toggleSidebar();
    } catch (error) {
      alert("Błąd podczas wylogowywania: " + error.message);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    toggleSidebar();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
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
                <button onClick={() => handleNavigate("/login")}>Zaloguj się</button>
                <button onClick={() => handleNavigate("/register")}>Utwórz konto</button>
              </>
            ) : (
              <button onClick={handleLogout}>Wyloguj się</button>
            )}
          </div>
        )}
      </div>

      <ul>
        <li onClick={() => handleNavigate("/")}>Strona główna</li>
        {isLoggedIn && (
          <>
            <li>Utwórz quiz</li>
            <li>Zarządzaj quizami</li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
