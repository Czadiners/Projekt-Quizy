function Sidebar({ isOpen }) {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <ul>
        <li>Logowanie / Utwórz konto</li>
        <li>Utwórz quiz</li>
        <li>Manage your quiz</li>
      </ul>
    </div>
  );
}

export default Sidebar;