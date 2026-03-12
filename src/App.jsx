import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainPage from "./pages/MainPage";
import "./App.css";

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
      <Header toggleSidebar={toggleSidebar} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setLogin={setLogin}
        setPasword={setPasword}
      />

      <main className="main-content">
        <MainPage />
      </main>
    </div>
  );
}

export default App;