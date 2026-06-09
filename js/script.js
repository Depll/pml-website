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

const orderBtn = document.querySelector(".btn-order");
const searchSection = document.querySelector(".search-section");

const categoryButtons = document.querySelectorAll(".category-item");
const categoryGroups = document.querySelectorAll(".menu-category-group");

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

  if (orderBtn && searchSection) {
    orderBtn.addEventListener("click", (event) => {
      event.preventDefault(); // Verhindert den href="#" Sprung

      // Scrollt sanft zur Klasse .search-section
      searchSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 1. Klick-Effekt: Aktiven Button stylen
      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // 2. Filter-Logik: Text ohne Emojis holen
      const selectedCategory = button.textContent
        .replace(
          /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g,
          "",
        )
        .trim();

      // Durch alle Gruppen gehen und filtern
      categoryGroups.forEach((group) => {
        const groupCategory = group.getAttribute("data-category");

        if (groupCategory === selectedCategory) {
          group.classList.remove("hidden-group"); // Passende Gruppe zeigen
        } else {
          group.classList.add("hidden-group"); // Andere Gruppen verstecken
        }
      });
    });
  });
}
