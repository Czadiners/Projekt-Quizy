# Plan prac – Quizy

---

## Naprawione
- [x] Tworzenie quizu – przycisk "Dalej" na kroku z opisem nie działał

---

## W trakcie
- [~] System punktacji przy pytaniach (dodane, wymaga testów)

---

## Do zrobienia – WYMAGANE (z PDF)

### 1. Rozwiązywanie quizu `/play/:quizId`
- Pytania jedno po drugim
- Obsługa typów: single, multiple, truefalse, text
- Przycisk "Dalej" / "Zakończ"
- Zapis odpowiedzi uczestnika w firebase


w większości nie aktualne punkt 2 i 3 prawie zrobiony, blad ten sam ktory opisany jest pod punktem 3
poprawki:
zrobic tak zeby uzytkownik wchodzil na rozwiazywanie quizu nie po localhost (lokalnie) jak sie da
poprawic to jak host usunie gracza z quizu to zeby u niego na stronie pokazywalo sie ze nie jest juz w tym quizie i zeby faktycznie sie tak dzialo i ze wraca na strone /join
gdy zakonczy uzytkownik quiz to nie powinien miec opcji zeby oceniac itp pytania (takie rzeczy tylko host a osoba jako gracz widzi tylko wyniki i moze miec tylko wstepny podglad z tego testu, w miejscach gdzie sa pytania z wlasna odpoweidzia bedzie wyswietlane to pytanie ale z informacja ze tworca quizu oceni to pozniej czy cos) do tego gdy quiz sie skonczy i tworca ocenia test a byly tam punkty do przyznania to liczba tych punktow powinna byc dodana do ogolnej - maksymalnej liczby- punktow do zdobycia i dodana ilosc punktow tyle ile gracz dany uzyskal np. pytanie otwarte jest a maksymalna liczba punktow w tescie ooglnie to 8 a tworca potem przyzna 10 punktow to maksymalna liczba powinna sie zmienic na 18 i liczba punktow ktore zdobyl gracz powinna sie zwiekszyc o liczbe punktow ktore dostal za pytanei otwarte.(img jest zapisany tutaj)


### 2. Wyniki po zakończeniu quizu `/results/:attemptId`
- Podsumowanie: zdobyte punkty / max punktów / procent
- Lista pytań z zaznaczeniem co było poprawne/błędne
- Pytania tekstowe oznaczone jako "oczekuje na ocenę"

### 3. Historia prób `/history` lub w `/manage`
- Lista: kto grał, kiedy, ile punktów
- Zapis prób do Firestore (`attempts` kolekcja)
- Ręczne przyznawanie punktów za pytania tekstowe

---

## Do zrobienia – UI/UX

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

### 7. Timer
- Opcjonalne ograniczenie czasu na cały quiz lub per pytanie
- Twórca ustawia limit w kreatorze

### 8. Losowanie pytań
- Opcja losowej kolejności pytań przy graniu
- Twórca włącza/wyłącza w ustawieniach quizu

### 9. Statystyki pytań
- Widok dla twórcy: które pytanie miało najniższy % poprawnych odpowiedzi

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