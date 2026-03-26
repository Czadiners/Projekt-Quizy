import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateQuizPage from "./pages/CreateQuizPage";
import ManageQuizzesPage from "./pages/ManageQuizzesPage";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "./components/Firebase";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) return <div>Ładowanie...</div>;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const ProtectedRoute = ({ children }) =>
    isLoggedIn ? children : <Navigate to="/login" />;

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
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create" element={<ProtectedRoute><CreateQuizPage /></ProtectedRoute>} />
            <Route path="/manage" element={<ProtectedRoute><ManageQuizzesPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
