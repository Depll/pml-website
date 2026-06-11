// ==========================================================================
// **GLOBAL CHECKS & VARIABLES**
// ==========================================================================
const VALID_POSTCODES = ["51371", "51373", "51375", "51377", "51379", "51381"];
let cart = [];
const MIN_ORDER_VALUE = 20.0; // Minimum order value: €20

// DOM Elements (General) / Postal Code / Navbar
const plzModal = document.getElementById("plz-modal");
const plzSubmitBtn = document.getElementById("btn-check-plz");
const plzInputField = document.getElementById("plz-input");
const plzErrorMsg = document.getElementById("plz-error");
const plzChangeLink = document.querySelector(".pml-change-link");

const orderBtn = document.querySelector(".pml-btn-order");
const searchSection = document.querySelector(".pml-search-section");

const categoryButtons = document.querySelectorAll(".pml-category-item");
const categoryGroups = document.querySelectorAll(".pml-menu-category-group");

const cartCountBadge = document.getElementById("cart-count-badge");
const navCartBtn = document.querySelector(".pml-cart-box");

// **DOM Elements for the Product Modal**

const productModal = document.getElementById("product-modal");
const closeModalX = document.querySelector(".pml-close-product-modal");
const btnCloseAbort = document.getElementById("btn-close-product");
const btnAddToCart = document.getElementById("btn-add-to-cart");

const modalTitle = document.getElementById("modal-product-title");
const modalDescription = document.getElementById("modal-product-description");
const modalCurrentPrice = document.getElementById("modal-current-price");
const modalNotes = document.getElementById("modal-product-notes");

const extraCheckboxes = document.querySelectorAll(
  '#extra-ingredients-container input[type="checkbox"]',
);
const removeCheckboxes = document.querySelectorAll(
  '#remove-ingredients-container input[type="checkbox"]',
);

let basePrice = 0;
let currentProductName = "";

function loadCartFromStorage() {
  try {
    const storedCart = localStorage.getItem("milano_warenkorb");
    if (!storedCart) return;

    const parsedCart = JSON.parse(storedCart);
    if (Array.isArray(parsedCart)) {
      cart = parsedCart.map((item) => ({
        ...item,
        quantity: Number.isFinite(item.quantity) ? item.quantity : 1,
        totalPrice: Number.isFinite(item.totalPrice)
          ? item.totalPrice
          : Number(item.singlePrice || 0),
      }));
    }
  } catch (error) {
    console.warn("Warenkorb konnte nicht geladen werden:", error);
    cart = [];
  }
}

function saveCartToStorage() {
  localStorage.setItem("milano_warenkorb", JSON.stringify(cart));
}

function getCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  return { subtotal, discount, total };
}

// DOM Elemente für die Warenkorb-Sidebar
const cartSidebar = document.getElementById("cart-sidebar");
const closeCartBtn = document.querySelector(".pml-close-cart-btn");
const cartEmptyView = document.getElementById("cart-empty-view");
const cartItemsContainer = document.getElementById("cart-items-container");
const btnToCheckout = document.getElementById("btn-to-checkout");
const minOrderAlert = document.getElementById("min-order-alert");

const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartDiscountEl = document.getElementById("cart-discount");
const cartTotalEl = document.getElementById("cart-total");

// ==========================================================================
// 1. PLZ-PRÜFUNG LOGIK
// ==========================================================================
const savedPlzOnLoad = localStorage.getItem("milano_plz");

if (plzModal) {
  if (savedPlzOnLoad && VALID_POSTCODES.includes(savedPlzOnLoad)) {
    plzModal.classList.add("pml-hidden");
    const navPlzDisplay = document.getElementById("nav-plz");
    if (navPlzDisplay) navPlzDisplay.textContent = savedPlzOnLoad;
  } else {
    plzModal.classList.remove("pml-hidden");
  }
}

function syncAddressPlzField() {
  const storedPlz = localStorage.getItem("milano_plz") || "";
  const navPlzDisplay = document.getElementById("nav-plz");
  const addressPlzFieldLocal = document.getElementById("address-plz");

  if (navPlzDisplay && VALID_POSTCODES.includes(storedPlz)) {
    navPlzDisplay.textContent = storedPlz;
  }

  if (addressPlzFieldLocal) {
    addressPlzFieldLocal.value = storedPlz;
  }
}

function checkZipcode() {
  if (!plzInputField) return;
  const enteredCode = plzInputField.value.trim();

  if (VALID_POSTCODES.includes(enteredCode)) {
    plzModal.classList.add("pml-hidden");
    if (plzErrorMsg) plzErrorMsg.classList.add("pml-hidden");

    localStorage.setItem("milano_plz", enteredCode);
    syncAddressPlzField();
  } else {
    if (plzErrorMsg) plzErrorMsg.classList.remove("pml-hidden");
    plzInputField.value = "";
  }
}

if (plzSubmitBtn) {
  plzSubmitBtn.addEventListener("click", checkZipcode);
}

if (plzInputField) {
  plzInputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") checkZipcode();
  });
}

if (plzChangeLink) {
  plzChangeLink.addEventListener("click", () => {
    if (plzModal) plzModal.classList.remove("pml-hidden");
    if (plzInputField) plzInputField.value = "";
  });
}

// 1. SMOOTH SCROLLING (Bestell-Button)
// ==========================================================================
if (
  typeof orderBtn !== "undefined" &&
  typeof searchSection !== "undefined" &&
  orderBtn &&
  searchSection
) {
  orderBtn.addEventListener("click", (event) => {
    event.preventDefault();
    searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ==========================================================================
// 2. LIVE-SUCHE FÜR GERICHTE (Sucht im Text der Gerichte)
// ==========================================================================
const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const searchText = event.target.value.toLowerCase().trim();
    const localMenuGroups = document.querySelectorAll(".pml-menu-category-group");

    localMenuGroups.forEach((group) => {
      const cardsInGroup = group.querySelectorAll(".pml-product-card");
      let hasVisibleProducts = false;

      cardsInGroup.forEach((card) => {
        const productTitleEl = card.querySelector(".pml-product-title");

        if (productTitleEl) {
          const productTitle = productTitleEl.textContent.toLowerCase();

          // Wenn der Text übereinstimmt, zeigen, sonst verstecken
          if (productTitle.includes(searchText)) {
            card.style.display = "";
            hasVisibleProducts = true;
          } else {
            card.style.display = "none";
          }
        }
      });

      // Leere Kategorien ausblenden, ansonsten einblenden
      if (hasVisibleProducts || searchText === "") {
        group.classList.remove("pml-hidden-group");
      } else {
        group.classList.add("pml-hidden-group");
      }
    });
  });
}

// ==========================================================================
// 3. KATEGORIE-BUTTONS (NUR NOCH DIESE EINE LOGIK FÜR KLICKS!)
// ==========================================================================
document.querySelectorAll(".pml-category-item").forEach((button) => {
  button.addEventListener("click", () => {
    // 1. Klasse "active" umschalten
    document
      .querySelectorAll(".pml-category-item")
      .forEach((btn) => btn.classList.remove("pml-active"));
    button.classList.add("pml-active");

    // 2. Button-Text für den data-category Abgleich säubern (Emojis raus)
    const selectedCategory = button.textContent
      .replace(
        /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g,
        "",
      )
      .trim();

    // 3. Suchfeld leeren und alle Einzelprodukte wieder einblenden (Reset der Suche)
    if (searchInput) {
      searchInput.value = "";
    }
    document
      .querySelectorAll(".pml-product-card")
      .forEach((card) => (card.style.display = ""));

    // 4. Kategorie-Gruppen über das HTML-Attribut "data-category" filtern
    const localMenuGroups = document.querySelectorAll(".pml-menu-category-group");
    localMenuGroups.forEach((group) => {
      const groupCategory = group.getAttribute("data-category");

      // Wenn "alle" geklickt wurde oder die Kategorie exakt übereinstimmt -> zeigen, sonst verstecken
      if (
        selectedCategory.toLowerCase() === "alle" ||
        groupCategory === selectedCategory
      ) {
        group.classList.remove("pml-hidden-group");
      } else {
        group.classList.add("pml-hidden-group");
      }
    });
  });
});

// ==========================================================================
// 3. PRODUKT-MODAL STEUERUNG
// ==========================================================================
document.querySelectorAll(".pml-btn-add-cart").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const card = button.closest(".pml-product-card");
    currentProductName = card
      .querySelector(".pml-product-title")
      .textContent.trim();
    const productDescText = card
      .querySelector(".pml-product-description")
      .textContent.trim();
    const priceText = card.querySelector(".pml-product-price").textContent;

    basePrice = parseFloat(priceText.replace(/[^\d.,]/g, "").replace(",", "."));

    modalTitle.textContent = currentProductName;
    modalDescription.textContent = productDescText;
    modalNotes.value = "";

    extraCheckboxes.forEach((cb) => (cb.checked = false));
    removeCheckboxes.forEach((cb) => (cb.checked = false));

    updateModalPrice();
    productModal.classList.remove("pml-hidden");
  });
});

function updateModalPrice() {
  let extraCost = 0;
  extraCheckboxes.forEach((cb) => {
    if (cb.checked) extraCost += 1.5;
  });
  const totalPrice = basePrice + extraCost;
  modalCurrentPrice.textContent = `${totalPrice.toFixed(2).replace(".", ",")} EUR`;
}

extraCheckboxes.forEach((cb) =>
  cb.addEventListener("change", updateModalPrice),
);

const closeModal = () => productModal.classList.add("pml-hidden");
if (closeModalX) closeModalX.addEventListener("click", closeModal);
if (btnCloseAbort) btnCloseAbort.addEventListener("click", closeModal);

productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeModal();
});

// ==========================================================================
// 4. WARENKORB LOGIK (SPEICHERN & UPDATEN)
// ==========================================================================
if (btnAddToCart) {
  btnAddToCart.addEventListener("click", () => {
    const selectedExtras = [];
    extraCheckboxes.forEach((cb) => {
      if (cb.checked) selectedExtras.push(cb.value);
    });

    const removedIngredients = [];
    removeCheckboxes.forEach((cb) => {
      if (cb.checked) removedIngredients.push(cb.value);
    });

    const cartItem = {
      id: Date.now(),
      name: currentProductName,
      totalPrice: parseFloat(
        modalCurrentPrice.textContent.replace(/[^\d.,]/g, "").replace(",", "."),
      ),
      extras: selectedExtras,
      removed: removedIngredients,
      notes: modalNotes.value.trim(),
    };

    cart.push(cartItem);
    saveCartToStorage();
    closeModal();
    updateCartUI();
  });
}

function updateCartUI() {
  cartItemsContainer.innerHTML = "";

  // Badge-Ziffer aktualisieren
  if (cartCountBadge) {
    const totalItems = cart.length;
    if (totalItems === 0) {
      cartCountBadge.textContent = "0";
      cartCountBadge.classList.add("pml-hidden");
    } else {
      cartCountBadge.classList.remove("pml-hidden");
      cartCountBadge.textContent = totalItems > 5 ? "5+" : totalItems;
    }
  }

  // Prüfen ob leer
  if (cart.length === 0) {
    cartEmptyView.style.display = "block";
    btnToCheckout.classList.add("pml-disabled");
    btnToCheckout.disabled = true;

    cartSubtotalEl.textContent = "0,00 EUR";
    cartDiscountEl.textContent = "0,00 EUR";
    cartTotalEl.textContent = "0,00 EUR";
    minOrderAlert.style.display = "block";
    return;
  }

  cartEmptyView.style.display = "none";

  const { subtotal, discount, total } = getCartTotals(cart);

  // Jedes Produkt mit deinen Kartenelement-Styles rendern
  cart.forEach((item) => {

    const extrasHTML =
      item.extras.length > 0
        ? item.extras
            .map(
              (e) =>
                `<div class="pml-item-extra-line">+ Extra ${e.charAt(0).toUpperCase() + e.slice(1)}</div>`,
            )
            .join("")
        : "";

    const removedHTML =
      item.removed.length > 0
        ? item.removed
            .map(
              (r) =>
                `<div class="pml-item-remove-line">- Ohne ${r.charAt(0).toUpperCase() + r.slice(1)}</div>`,
            )
            .join("")
        : "";

    const notesHTML = item.notes
      ? `<div class="pml-item-note-line">Anmerkung: "${item.notes}"</div>`
      : "";

    const itemCard = document.createElement("div");
    itemCard.classList.add("pml-cart-item-card");

    itemCard.innerHTML = `
      <div class="pml-cart-item-header">
        <span class="pml-item-title">${item.name}</span>
        <span class="pml-item-delete pml-btn-remove-item" data-id="${item.id}">&times;</span>
      </div>
      
      <div class="pml-cart-item-details">
        ${extrasHTML}
        ${removedHTML}
        ${notesHTML}
      </div>
      
      <div class="pml-cart-item-footer">
        <div class="pml-quantity-control">
  <span>Menge:</span>
  <input type="number" class="pml-qty-input pml-cart-quantity-change" data-id="${item.id}" value="${item.quantity || 1}" min="1" style="width: 50px; text-align: center;" />
</div>
        <span class="pml-item-price">${item.totalPrice.toFixed(2).replace(".", ",")} EUR</span>
      </div>
    `;
    cartItemsContainer.appendChild(itemCard);
  });

  cartSubtotalEl.textContent = `${subtotal.toFixed(2).replace(".", ",")} EUR`;
  cartDiscountEl.textContent = `-${discount.toFixed(2).replace(".", ",")} EUR`;
  cartTotalEl.textContent = `${total.toFixed(2).replace(".", ",")} EUR`;

  if (subtotal >= MIN_ORDER_VALUE) {
    minOrderAlert.style.display = "none";
    btnToCheckout.classList.remove("pml-disabled");
    btnToCheckout.disabled = false;
  } else {
    minOrderAlert.style.display = "block";
    btnToCheckout.classList.add("pml-disabled");
    btnToCheckout.disabled = true;
  }

  document.querySelectorAll(".pml-btn-remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idToRemove = parseInt(btn.getAttribute("data-id"));
      cart = cart.filter((item) => item.id !== idToRemove);
      saveCartToStorage();
      updateCartUI();
    });
  });

  // Event-Listener für Pfeiltasten-Klicks und manuelle Mengeneingaben
  document.querySelectorAll(".pml-cart-quantity-change").forEach((input) => {
    input.addEventListener("input", (event) => {
      const idToChange = parseInt(input.getAttribute("data-id"));
      let newQty = parseInt(event.target.value) || 1;

      if (newQty < 1) newQty = 1;

      // Die Menge im globalen cart-Array updaten
      const targetItem = cart.find((item) => item.id === idToChange);
      if (targetItem) {
        // Falls singlePrice noch nicht existiert, alten totalPrice als Basis sichern
        if (!targetItem.singlePrice) {
          targetItem.singlePrice = targetItem.totalPrice;
        }
        targetItem.quantity = newQty;
        targetItem.totalPrice = targetItem.singlePrice * newQty;
      }

      saveCartToStorage();

      // UI sofort neu rendern, um alle Preise live zu aktualisieren
      updateCartUI();
    });
  });
}

// ==========================================================================
// 5. WARENKORB SIDEBAR ÖFFNEN / SCHLIESSEN
// ==========================================================================
if (navCartBtn) {
  navCartBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (cartSidebar) cartSidebar.classList.remove("pml-hidden");
  });
}

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", () => {
    cartSidebar.classList.add("pml-hidden");
  });
}

if (cartSidebar) {
  cartSidebar.addEventListener("click", (event) => {
    if (event.target === cartSidebar) {
      cartSidebar.classList.add("pml-hidden");
    }
  });
}

// ==========================================================================
// 6. IMPRESSUM POP-UP (MODAL) STEUERUNG
// ==========================================================================
const linkImpressum = document.getElementById("link-impressum");
const impressumModal = document.getElementById("impressum-modal");

if (linkImpressum && impressumModal) {
  // Pop-up öffnen bei Klick auf den Link im Footer
  linkImpressum.addEventListener("click", (event) => {
    event.preventDefault();
    impressumModal.classList.remove("pml-hidden");
  });
}

// Schließen-Logik (Kreuz und Hintergrund-Klick)
if (impressumModal) {
  impressumModal.addEventListener("click", (event) => {
    // Falls auf das X geklickt wird ODER direkt auf den dunklen Hintergrund
    if (
      event.target.classList.contains("pml-close-impressum-btn") ||
      event.target === impressumModal
    ) {
      impressumModal.classList.add("pml-hidden");
    }
  });
}

const cartViewStep = document.getElementById("cart-view-step");
const addressViewStep = document.getElementById("address-view-step");
const btnToCheckoutLocal = document.getElementById("btn-to-checkout");
const btnBackToCart = document.getElementById("btn-back-to-cart");
const deliveryForm = document.getElementById("delivery-form");
const addressPlzField = document.getElementById("address-plz");

// 1. Wechsel zum Adress-Formular
if (btnToCheckoutLocal) {
  btnToCheckoutLocal.addEventListener("click", () => {
    if (cart.length > 0) {
      cartViewStep.classList.add("pml-hidden-step");
      addressViewStep.classList.remove("pml-hidden-step");

      // Postleitzahl immer aus dem persistierten Speicher übernehmen,
      // nicht aus dem versteckten Modal-Feld.
      const savedPlz = localStorage.getItem("milano_plz") || "";
      if (addressPlzField) {
        addressPlzField.value = savedPlz;
      }
    }
  });
}

// 2. Zurück zum Warenkorb
if (btnBackToCart) {
  btnBackToCart.addEventListener("click", () => {
    addressViewStep.classList.add("pml-hidden-step");
    cartViewStep.classList.remove("pml-hidden-step");
  });
}

// 3. Beim vollständigen Schließen der Sidebar den Zustand SOFORT resetten
// 3. Beim vollständigen Schließen der Sidebar den Zustand zurücksetzen
document.querySelectorAll(".pml-close-cart-btn").forEach((closeBtn) => {
  closeBtn.addEventListener("click", () => {
    if (cartSidebar) cartSidebar.classList.add("pml-hidden");
    resetSidebarSteps();
  });
});

if (cartSidebar) {
  cartSidebar.addEventListener("click", (e) => {
    if (e.target === cartSidebar) {
      cartSidebar.classList.add("pml-hidden");
      resetSidebarSteps();
    }
  });
}

// DIE REPARIERTE FUNKTION: Nur über Klassen steuern, KEINE festen Styles!
function resetSidebarSteps() {
  const cartViewStep = document.getElementById("cart-view-step");
  const addressViewStep = document.getElementById("address-view-step");

  if (cartViewStep && addressViewStep) {
    // Entferne die harten Styles wieder, die das Layout zerschossen haben
    addressViewStep.style.display = "";
    cartViewStep.style.display = "";

    // Jetzt sauber nur noch die Klassen umschalten
    addressViewStep.classList.add("pml-hidden-step");
    cartViewStep.classList.remove("pml-hidden-step");
  }
}

// 4. Formular-Validierung bei Klick auf "Weiter zur Zahlung"
if (deliveryForm) {
  deliveryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let isFormValid = true;

    // Alle Pflichtfelder im Formular prüfen
    const requiredInputs = deliveryForm.querySelectorAll("input[required]");

    requiredInputs.forEach((input) => {
      const formGroup = input.closest(".pml-form-group");
      const errorMsg = formGroup.querySelector(".pml-form-error-msg");

      if (input.value.trim() === "") {
        formGroup.classList.add("pml-has-error");
        if (errorMsg) {
          errorMsg.classList.remove("pml-hidden");
        }
        isFormValid = false;
      } else {
        formGroup.classList.remove("pml-has-error");
        if (errorMsg) errorMsg.classList.add("pml-hidden");
      }
    });

    if (isFormValid) {
      // Speicher Daten für den nächsten Schritt (z.B. Stripe Checkout)
      const customerData = {
        firstname: document.getElementById("address-firstname").value.trim(),
        lastname: document.getElementById("address-lastname").value.trim(),
        phone: document.getElementById("address-phone").value.trim(),
        email: document.getElementById("address-email").value.trim(),
        street: document.getElementById("address-street").value.trim(),
        housenumber: document
          .getElementById("address-housenumber")
          .value.trim(),
        plz: addressPlzField.value,
        city: document.getElementById("address-city").value.trim(),
        comment: document.getElementById("address-comment").value.trim(),
      };

      console.log("Valide Adressdaten:", customerData);

      // HIER KANNST DU JETZT DEINE STRIPE- / PAYMENT-FUNKTION AUFRUFEN
      alert("Weiterleitung zur Zahlung...");
    }
  });
}

// Live-Update: Wenn der Nutzer im Adressformular die PLZ ändert, zieht die Navbar sofort mit
if (addressPlzField) {
  addressPlzField.addEventListener("input", () => {
    const navPlzDisplay = document.getElementById("nav-plz");
    const currentCode = addressPlzField.value.trim();

    // Aktualisiert die Navbar live, sobald eine gültige 5-stellige PLZ getippt wurde
    if (navPlzDisplay && currentCode.length === 5 && !isNaN(currentCode)) {
      navPlzDisplay.textContent = currentCode;
    }
  });
}

// VALIEDIERUNG FÜR DIE ADRESSE DANACH LOCAL STORAGE FÜR PLZ UND AUCH WARENKORB / ADRESSE
// Checkout und Stripe.  // Hosting Und Brevo (email an die küche schicken)

// =========================================================================
// 1. LOCAL STORAGE MANAGER (NUR WARENKORB & PLZ)
// =========================================================================
function speichereWarenkorb(warenkorbArray) {
  localStorage.setItem("milano_warenkorb", JSON.stringify(warenkorbArray));
}

function ladeWarenkorb() {
  const daten = localStorage.getItem("milano_warenkorb");
  return daten ? JSON.parse(daten) : [];
}

function speicherePLZ(plz) {
  localStorage.setItem("milano_plz", plz);
}

function ladePLZ() {
  return localStorage.getItem("milano_plz") || "";
}

// =========================================================================
// 2. FORMULAR-VALIDIERUNG MIT DEINEN ECHTEN HTML-IDs
// =========================================================================
function validiereBestellung(event) {
  // 1. KNALLHARTE SPERRE: Stoppt JEDE automatische Aktion des Browsers sofort
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  const emailMuster = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameMuster = /^[a-zA-ZäöüÄÖÜß\s\-]{2,}$/;
  const telefonMuster = /^[0-9\s\+\-\/]{5,}$/;

  let hatFehler = false;

  // Inputs holen
  const vornameInput = document.getElementById("address-firstname");
  const nachnameInput = document.getElementById("address-lastname");
  const telefonInput = document.getElementById("address-phone");
  const emailInput = document.getElementById("address-email");
  const strasseInput = document.getElementById("address-street");
  const hausnummerInput = document.getElementById("address-housenumber");
  const plzInput = document.getElementById("address-plz");
  const stadtInput = document.getElementById("address-city");

  // Fehler-Anzeige-Funktion
  function zeigeFehler(inputElement, istFehler, nachricht) {
    if (!inputElement) return;
    const fehlerDiv =
      inputElement.parentElement.querySelector(".pml-form-error-msg");

    if (istFehler) {
      inputElement.classList.add("pml-input-error");
      if (fehlerDiv) {
        fehlerDiv.innerText = nachricht;
        fehlerDiv.classList.remove("pml-hidden");
        fehlerDiv.style.display = "block";
      }
      hatFehler = true; // Flagge geht hoch!
    } else {
      inputElement.classList.remove("pml-input-error");
      if (fehlerDiv) {
        fehlerDiv.classList.add("pml-hidden");
        fehlerDiv.style.display = "none";
      }
    }
  }

  // --- DIE PRÜFUNGEN ---
  zeigeFehler(
    vornameInput,
    !nameMuster.test(vornameInput.value.trim()),
    "Bitte gib einen echten Vornamen ohne Zahlen ein (z.B. Max).",
  );
  zeigeFehler(
    nachnameInput,
    !nameMuster.test(nachnameInput.value.trim()),
    "Bitte gib einen echten Nachnamen ohne Zahlen ein (z.B. Müller).",
  );
  zeigeFehler(
    telefonInput,
    !telefonMuster.test(telefonInput.value.trim()),
    "Bitte gib eine echte Telefonnummer mit mindestens 5 Zahlen ein (z.B. 0176123456).",
  );
  zeigeFehler(
    emailInput,
    !emailMuster.test(emailInput.value.trim()),
    "Ungültiges Format. Eine richtige E-Mail benötigt ein '@' und eine Endung (z.B. max@beispiel.de).",
  );
  zeigeFehler(
    strasseInput,
    strasseInput.value.trim().length < 3 ||
      /^\d+$/.test(strasseInput.value.trim()),
    "Bitte gib einen echten Straßennamen ein (z.B. Hauptstraße).",
  );
  zeigeFehler(
    hausnummerInput,
    hausnummerInput.value.trim().length === 0,
    "Bitte gib deine Hausnummer an (z.B. 12a).",
  );
  zeigeFehler(
    stadtInput,
    !nameMuster.test(stadtInput.value.trim()),
    "Bitte gib einen echten Stadtnamen ein (z.B. Köln).",
  );

  // --- DIE ABSOLUTE WEICHENTRENNUNG ---
  if (hatFehler) {
    console.log("Validierung fehlgeschlagen. Alert blockiert.");
    return false; // Hier ist FEIERABEND. Der Code bricht ab.
  } else {
    // DAS ALERT DARF NUR HIER DRIN STEHEN!
    speicherePLZ(plzInput.value);
    alert("Weiterleitung zur Zahlung...");
    // starteStripeCheckout();
    return true;
  }
}

// =========================================================================
// 3. EVENT-LISTENER (NUR EIN EINZIGER, SAUBERER AUFRUF)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  updateCartUI();

  const form = document.getElementById("delivery-form");
  if (form) {
    // Verbindet das Abschicken direkt mit unserer Absperrung
    form.addEventListener("submit", validiereBestellung);
  }

  // =========================================================================
  // 4. BEIM LADEN DER SEITE: PLZ AUTOMATISCH EINTRAGEN
  // =========================================================================
  const gespeichertePlz = ladePLZ();
  const plzFeld = document.getElementById("address-plz");

  if (gespeichertePlz && plzFeld) {
    plzFeld.value = gespeichertePlz;
  }

  syncAddressPlzField();
});
