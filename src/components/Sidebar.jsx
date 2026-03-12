import { useState } from "react";
import {BrowserRouter as Router,Routes,Route,Link} from "react-router";

import LoginPage from "../pages/LoginPage";

function Sidebar({ isOpen, toggleSidebar, isLoggedIn, setIsLoggedIn }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <Router>
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
                <Link to="/LoginPage">Zaloguj</Link>
                <Routes>
                  <Route path="/LoginPage" element={<LoginPage />}/>
                </Routes>
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
    </Router>
  );
}

export default Sidebar;