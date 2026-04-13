import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateQuizPage from "./pages/CreateQuizPage";
import ManageQuizzesPage from "./pages/ManageQuizzesPage";
import EditQuizPage from "./pages/EditQuizPage";
import HostPage from "./pages/HostPage";
import PlayPage from "./pages/PlayPage";
import ResultsPage from "./pages/ResultsPage";
import JoinPage from "./pages/JoinPage";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/Firebase";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Ładowanie...</p>
      </div>
    );
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const ProtectedRoute = ({ children }) => user ? children : <Navigate to="/login" />;

  return (
    <div className="app">
      <Router>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} user={user} setUser={setUser} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/play/:sessionId" element={<PlayPage />} />
            <Route path="/results/:sessionId" element={<ResultsPage />} />
            <Route path="/create" element={<ProtectedRoute><CreateQuizPage /></ProtectedRoute>} />
            <Route path="/manage" element={<ProtectedRoute><ManageQuizzesPage /></ProtectedRoute>} />
            <Route path="/edit/:quizId" element={<ProtectedRoute><EditQuizPage /></ProtectedRoute>} />
            <Route path="/host/:sessionId" element={<ProtectedRoute><HostPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
