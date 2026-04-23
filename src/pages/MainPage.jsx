import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { Gamepad2,Notebook,Trophy} from 'lucide-react';

function MainPage() {
  return (
    <div className="main-page">
      <section className="hero">
        <h2>Twórz quizy.<br />Rywalizuj na żywo.</h2>
        <p>Stwórz quiz w minutę, udostępnij kod PIN i graj z dowolną liczbą osób.</p>
        <Link to="/join" className="hero-cta">Dołącz do gry</Link>

        <div className="hero-features">
          <div className="hero-feature">
            <div className="hero-feature-icon"><Gamepad2/></div>
            <h3>Gra na żywo</h3>
            <p>Gracze dołączają kodem PIN, wyniki aktualizują się w czasie rzeczywistym</p>
          </div>
          <div className="hero-feature">
            <div className="hero-feature-icon"><Notebook/></div>
            <h3>Wiele typów pytań</h3>
            <p>Jednokrotny wybór, wielokrotny, Prawda/Fałsz i pytania otwarte</p>
          </div>
          <div className="hero-feature">
            <div className="hero-feature-icon"><Trophy/></div>
            <h3>Ranking i wyniki</h3>
            <p>Podium, historia sesji i szczegółowa analiza odpowiedzi</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default MainPage;
