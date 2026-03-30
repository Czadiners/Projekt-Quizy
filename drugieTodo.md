# Plan prac – Quizy

---

## Naprawione
- [x] Tworzenie quizu – przycisk "Dalej" na kroku z opisem nie działał
- [x] Alerty zastąpione inline komunikatami (form-error) w CreateQuizPage

---

## W trakcie
- [~] System punktacji przy pytaniach (dodane, wymaga testów)

---

## Do zrobienia – WYMAGANE (z PDF)

### 1. Rozwiązywanie quizu `/play/:quizId`
- Pytania jedno po drugim
- Obsługa typów: single, multiple, truefalse, text
- Przycisk "Dalej" / "Zakończ"
- Zapis odpowiedzi uczestnika lokalnie (stan)

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
- Usunąć wszystkie emoji z przycisków (oprócz zębatki ⚙)
- Spójny design komponentów (karty, przyciski, inputy)
- Responsywność

### 5. Obsługa błędów
- Zastąpić wszystkie `alert()` komunikatami inline (klasa `form-error`)
- Dotyczy: LoginPage, RegisterPage, EditQuizPage, ManageQuizzesPage

### 6. Strona logowania / rejestracji
- LoginPage: link "Nie masz konta? Zarejestruj się"
- RegisterPage: link "Masz już konto? Zaloguj się"
- Powtórzenie hasła przy rejestracji
- Podgląd hasła (przycisk pokaż/ukryj)
- Czytelne komunikaty błędów Firebase (zamiast surowych kodów)

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