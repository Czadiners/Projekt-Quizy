function Header({ toggleSidebar }) {
  return (
    <header className="header">
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>

      <h1>Quizyyy</h1>
    </header>
  );
}

export default Header;