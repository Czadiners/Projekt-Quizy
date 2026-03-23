import { useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import {auth} from "../components/Firebase";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      toggleSidebar();
    } catch (error) {
      alert("Błąd podczas wylogowywania: " + error.message);
    }
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
                <Link to="/login" onClick={toggleSidebar}>Zaloguj się</Link>
                <Link to="/register" onClick={toggleSidebar}>Utwórz konto</Link>
              </>
            ) : (
              <button onClick={handleLogout}>Wyloguj się</button>
            )}
          </div>
        )}
      </div>

      <ul>
        <li>
          <Link to="/" onClick={toggleSidebar}>Strona główna</Link>
        </li>
        {isLoggedIn && (
          <>
            <li>
              <Link to="/create" onClick={toggleSidebar}>Utwórz quiz</Link>
            </li>
            <li>
              <Link to="/manage" onClick={toggleSidebar}>Zarządzaj quizami</Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
