## Do zrobienia – UI/UX

main rzecz do zastanowienia sie:
historia gier usuwa sie po skonczonej sesji a najlepiej by bylo gdyby historia sie wyswietlala cala i jest dostepna ciagle bo zapisywana historia sesji jest w firebase
jak tworzy sie quiz i kliknie sie wstecz do pytania to nie ma zadnego przycisku nastepne


### 4. Styl strony
- Usunąć wszystkie emoji z przycisków (oprócz zębatki ⚙ i tzw "hamburgera" - 3 poziome linie od sidebar)
- Spójny design komponentów (karty, przyciski, inputy)
- Responsywność


Q: Jaki kierunek wizualny?

A: Coś pośrodku (czysty ale nie zimny, z odrobiną charakteru)



Q: Kolor wiodący aplikacji?

A: Biorąc pod uwagę kod Twojej aplikacji, który udostępniłeś wcześniej (widziałem tam mechanikę dołączania po kodzie PIN, "Lobby", hostowanie i ranking na żywo), budujesz coś na kształt **Kahoota lub Quizizz**.   Dlatego zdecydowanie **najlepszą opcją będzie styl Grywalizacji (Playful / Duolingo style)!** 🎮  Zastosowanie czystego, biurowego stylu (SaaS) mogłoby sprawić, że strona wyglądałaby jak narzędzie do wypełniania ankiet HR, a Ty przecież chcesz, żeby gracze świetnie się bawili.  ### Dlaczego styl "Playful" to strzał w dziesiątkę?  * **Zachęca do akcji:** Grube, wesołe przyciski sprawiają, że aż chce się w nie klikać (zwłaszcza pod presją czasu na telefonie). * **Zmniejsza stres:** Testy z wiedzy potrafią stresować. Przyjazne kolory, zaokrąglone rogi i zabawny interfejs sprawiają, że zła odpowiedź to tylko element gry, a nie powód do frustracji. * **Czytelność w locie:** Mocne kontrasty pomagają graczom błyskawicznie odczytać pytania i odpowiedzi na ekranie telefonu.  ---  ### Jak to osiągnąć w praktyce (Przepis na styl "Playful"):  Aby uzyskać ten efekt, wystarczy zmienić kilka kluczowych elementów w Twoim kodzie CSS:  **1. Przyciski z efektem 3D (Wciskanie)** To absolutna podstawa stylu gier. Zamiast rozmytego cienia, używasz twardego, przesuniętego w dół. ```css .play-btn {   background-color: #3b82f6; /* Żywy niebieski */   color: white;   border-radius: 16px;   border: 2px solid #1d4ed8; /* Ciemniejsza ramka */   box-shadow: 0 6px 0 #1e40af; /* Twardy cień na dole */   transition: all 0.1s; }  .play-btn:active {   transform: translateY(6px); /* Przycisk "zjeżdża" w dół */   box-shadow: 0 0px 0 #1e40af; /* Cień znika, dając efekt fizycznego wciśnięcia */ } ```  **2. Zaokrąglone fonty** Porzuć Arial. Wejdź na Google Fonts i podepnij **Nunito** albo **Quicksand**. To grube, miękkie i bardzo przyjazne czcionki, które natychmiast zmieniają klimat strony z "dokumentu Word" na "grę".  **3. Odważne tła** Dla strony, na której gracz dołącza (wpisuje PIN), zamiast białego tła, daj mocny, jednolity kolor (np. nasycony fiolet `#6d28d9` lub pastelowy niebieski `#bae6fd`), a na nim wyśrodkuj dużą, białą kartę z mocnym zaokrągleniem (`border-radius: 24px;`).  ---  Czy chciałbyś, żebym napisał dla Ciebie gotowy kawałek CSS, który całkowicie odmieni wygląd Twojej strony logowania do gry (`JoinPage.jsx`), abyś od razu mógł zobaczyć ten "growy" efekt w swojej aplikacji?



Q: Czcionka?

A: 1. Nunito (Mój faworyt dla Twojego projektu) To jest "król" aplikacji mobilnych i quizów. Jest niesamowicie czytelna, ale ma zaokrąglone kształty, co sprawia, że interfejs wydaje się przyjazny i mniej "poważny".  Vibe: Nowoczesna gra, profesjonalna ale "luzacka".  Gdzie znaleźć: Google Fonts - Nunito

### 5. Obsługa błędów
- Zastąpić wszystkie `alert()` komunikatami inline (klasa `form-error`)
- Dotyczy: LoginPage, RegisterPage, EditQuizPage, ManageQuizzesPage

### 6. Strona logowania / rejestracji
- LoginPage: link "Nie masz konta? Zarejestruj się"
- RegisterPage: link "Masz już konto? Zaloguj się"
- Powtórzenie hasła przy rejestracji
- Podgląd hasła (przycisk pokaż/ukryj)
- Czytelne komunikaty błędów Firebase (zamiast surowych kodów)
- nie trzeba klikac przycisku login lub register tylko wciseniecie enter na klawiaturze tez zadziala

---

## Do zrobienia – Opcjonalne (rozszerzenia z PDF)


### 8. Losowanie pytań
- Opcja losowej kolejności pytań przy graniu
- Twórca włącza/wyłącza w ustawieniach quizu

### 9. Statystyki pytań
- Widok dla twórcy: które pytanie miało najniższy % poprawnych odpowiedzi (w historii sesji)

### 10. Eksport wyników do CSV
- Przycisk w historii prób
- Plik: uczestnik, data, wynik, odpowiedzi

---

## Organizacyjne (na koniec)

- [ ] GitHub – min. 20 commitów z opisami
- [ ] README – opis projektu, instrukcja uruchomienia, podział zadań
- [ ] Prezentacja 5–7 minut + demo

---

## Pytanie otwarte
**Granie bez hostingu:** Tak, jest to możliwe przez udostępnienie linku do lokalnego serwera
w sieci lokalnej (`npm start` + IP komputera) albo przez darmowy hosting na
Firebase Hosting / Netlify / Vercel – żadne z nich nie wymaga płatnego planu dla projektu
tej skali. Najprościej: `firebase deploy` po skonfigurowaniu Firebase Hosting.