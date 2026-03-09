import Footer from "../components/Footer";

function MainPage() {
  return (
    <div className="main-page">
      <section className="hero">
        <h2>Witaj w aplikacji Quizów</h2>
        <p>Twórz quizy i rozwiązuj testy online.</p>
      </section>

      <section className="spacer"></section>

      <Footer />
    </div>
  );
}

export default MainPage;