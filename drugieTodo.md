## Do zrobienia

## main rzecz do zastanowienia sie:

historia gier usuwa sie po skonczonej sesji a najlepiej by bylo gdyby historia sie wyswietlala cala i jest dostepna ciagle bo zapisywana historia sesji jest w firebase, częściowo rozwizane (img z errorami zapisane tutaj, tak wiem ze w paint XD)
jak tworzy sie quiz i kliknie sie wstecz do pytania to nie ma zadnego przycisku nastepne


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