import { Link } from "react-router-dom";
import "./Footer.css"; 

function Footer() {
  const currentYear = new Date().getFullYear(); // Automatyczny rok

  return (
    <footer className="footer">
      <div className="footer-content" style={{display:"flex",justifyContent:"center"}}>
        {/* Prawa strona - Linki podzielone na kolumny */}
        <div className="footer-links-group">
          <div className="footer-column">
            <h4 style={{color:"black"}}>Nawigacja</h4>
            <Link to="/">Strona główna</Link>
            <Link to="/join">Dołącz do gry</Link>
            <Link to="/login">Zaloguj się</Link>
          </div>

          <div className="footer-column">
            <h4 style={{color:"black"}}>Wsparcie</h4>
            <a href="mailto:pomoc@quizapp.pl">pomoc@quizyyy.pl</a>
            <Link to="/faq">FAQ</Link>
            <Link to="/regulamin">Regulamin</Link>
          </div>
        </div>
      </div>

      {/* Dolny pasek */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Quizyyy. Wszelkie prawa zastrzeżone.</p>
        <div className="socials">
          <span>📱</span>
          <span>💻</span>
          <span>✉️</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;