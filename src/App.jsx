import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //logowanie zmienne
  const [login,setLogin] = useState("");
  const [password,setPasword] = useState("");
  //logowanie zmienne

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
            setLogin={setLogin}
            setPasword={setPasword}
          />
          
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>

          <main className="main-content">
            <MainPage />
          </main>
        </Router>
    </div>
  );
}

export default App;