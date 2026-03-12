import { useState } from "react";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <a href="MainPage.jsx">maciej</a>
      <button className="close-btn" onClick={toggleSidebar}>
        ✕
      </button>

      {/* PROFIL */}
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
                <button><a href="LoginPage.jsx">Zaloguj</a></button>
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