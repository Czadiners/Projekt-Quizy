import { useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../components/Firebase";

function Sidebar({ isOpen, toggleSidebar, user, setUser }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toggleSidebar();
    } catch (error) {
      alert("Błąd podczas wylogowywania: " + error.message);
    }
  };

  const getInitial = () => {
    if (!user) return <img className="IconImage" style={{height:"110px", width:"auto"}} src="/Projekt-Quizy/mini.png"></img>;
    if (user.displayName) return user.displayName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "?";
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={toggleSidebar}>✕</button>

      <div className="profile-section">
        <div
          className="profile-icon"
          style={{ background: user ? "#4caf50" : " #ffffffff" }}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          {getInitial()}
        </div>

        {user
          ? <div className="profile-email">{user.email}</div>
          : <div className="profile-guest">Niezalogowany</div>
        }

        {profileOpen && (
          <div className="profile-menu">
            {!user ? (
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
        <li><Link to="/" onClick={toggleSidebar}>Strona główna</Link></li>
        {user && (
          <>
            <li><Link to="/create" onClick={toggleSidebar}>Utwórz quiz</Link></li>
            <li><Link to="/manage" onClick={toggleSidebar}>Zarządzaj quizami</Link></li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
