// =================================================================
// PLZ-PRÜFUNG (START-LOGIK FÜR LEVERKUSEN)
// =================================================================

// Gültige Postleitzahlen aus Leverkusen
const VALID_POSTCODES = ["51371", "51373", "51375", "51377", "51379", "51381"];

// Elemente aus dem HTML selektieren
const plzModal = document.getElementById("plz-modal");
const plzSubmitBtn = document.getElementById("btn-check-plz");
const plzInputField = document.getElementById("plz-input");
const plzErrorMsg = document.getElementById("plz-error");
const plzChangeLink = document.querySelector(".change-link");

// Sorgt dafür, dass das PLZ-Modal beim Laden der Seite aktiv aufploppt
if (plzModal) {
  plzModal.classList.remove("hidden");
}

// Hauptfunktion zur Überprüfung der Postleitzahl
function checkZipcode() {
  const enteredCode = plzInputField.value.trim();

  if (VALID_POSTCODES.includes(enteredCode)) {
    // Wenn die PLZ stimmt: Modal schließen und Fehler verstecken
    plzModal.classList.add("hidden");
    if (plzErrorMsg) {
      plzErrorMsg.classList.add("hidden");
    }
  } else {
    // Wenn die PLZ falsch ist: Fehler anzeigen und Eingabe leeren
    if (plzErrorMsg) {
      plzErrorMsg.classList.remove("hidden");
    }
    plzInputField.value = "";
  }
}

// Event-Listener: Klick auf den "Speichern"-Button
if (plzSubmitBtn) {
  plzSubmitBtn.addEventListener("click", checkZipcode);
}

// Event-Listener: Enter-Taste im Eingabefeld abfangen
if (plzInputField) {
  plzInputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      checkZipcode();
    }
  });

  if (plzChangeLink) {
    plzChangeLink.addEventListener("click", () => {
      if (plzModal) {
        plzModal.classList.remove("hidden"); // Modal wieder anzeigen
      }
      if (plzInputField) {
        plzInputField.value = ""; // Eingabefeld leeren für die neue PLZ
      }
    });
  }
}
