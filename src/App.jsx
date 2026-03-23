import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/Firebase";

// Komponenty
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Strony
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Style
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subskrypcja stanu autoryzacji
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false); // Kończymy ładowanie, gdy mamy odpowiedź z Firebase
    });

    return () => unsubscribe();
  }, []);

  // Prosty ekran ładowania, aby uniknąć błędów renderowania
  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Ładowanie aplikacji...</p>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Router>
        <Header toggleSidebar={toggleSidebar} />

        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />

        <main className="main-content">
          <Routes>
            {/* Publiczne trasy */}
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Trasy dostępne po zalogowaniu (na razie placeholdery) */}
            {isLoggedIn && (
              <>
                <Route path="/create-quiz" element={<div><h2>Strona tworzenia nowego quizu</h2></div>} />
                <Route path="/manage-quizzes" element={<div><h2>Strona zarządzania Twoimi quizami</h2></div>} />
              </>
            )}

            {/* Opcjonalnie: Obsługa nieistniejących stron (404) */}
            <Route path="*" element={<div>404 - Nie znaleziono strony</div>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;