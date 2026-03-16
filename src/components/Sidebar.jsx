import { useState } from "react";
import { Link } from "react-router-dom";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <Link to="/">maciej</Link>

      <button className="close-btn" onClick={toggleSidebar}>
        ✕
      </button>

      <div className="profile-section">
        <div
          className={`profile-icon ${isLoggedIn ? "logged" : "guest"}`}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          👤
        </div>

        {profileOpen && (
          <div className="profile-menu">
            {!isLoggedIn ? (
              <>
                <Link to="/login">Zaloguj</Link>
                <button>Utwórz konto</button>
              </>
            ) : (
              <button onClick={() => setIsLoggedIn(false)}>Wyloguj</button>
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