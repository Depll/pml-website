// ==========================================================================
// GLOBALE PRÜFUNGEN & VARIABLEN
// ==========================================================================
const VALID_POSTCODES = ["51371", "51373", "51375", "51377", "51379", "51381"];
let cart = [];
const MIN_ORDER_VALUE = 20.0; // Mindestbestellwert 20 Euro

// DOM Elemente Allgemein / PLZ / Navbar
const plzModal = document.getElementById("plz-modal");
const plzSubmitBtn = document.getElementById("btn-check-plz");
const plzInputField = document.getElementById("plz-input");
const plzErrorMsg = document.getElementById("plz-error");
const plzChangeLink = document.querySelector(".change-link");

const orderBtn = document.querySelector(".btn-order");
const searchSection = document.querySelector(".search-section");

const categoryButtons = document.querySelectorAll(".category-item");
const categoryGroups = document.querySelectorAll(".menu-category-group");

const cartCountBadge = document.getElementById("cart-count-badge");
const navCartBtn = document.querySelector(".cart-box");

// DOM Elemente für das Produkt-Modal
const productModal = document.getElementById("product-modal");
const closeModalX = document.querySelector(".close-product-modal");
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

// DOM Elemente für die Warenkorb-Sidebar
const cartSidebar = document.getElementById("cart-sidebar");
const closeCartBtn = document.querySelector(".close-cart-btn");
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
if (plzModal) {
  plzModal.classList.remove("hidden");
}

function checkZipcode() {
  if (!plzInputField) return;
  const enteredCode = plzInputField.value.trim();

  if (VALID_POSTCODES.includes(enteredCode)) {
    plzModal.classList.add("hidden");
    if (plzErrorMsg) plzErrorMsg.classList.add("hidden");
  } else {
    if (plzErrorMsg) plzErrorMsg.classList.remove("hidden");
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
    if (plzModal) plzModal.classList.remove("hidden");
    if (plzInputField) plzInputField.value = "";
  });
}

// ==========================================================================
// 2. SMOOTH SCROLLING & KATEGORIEN-FILTER
// ==========================================================================
// ==========================================================================
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
    const localMenuGroups = document.querySelectorAll(".menu-category-group");

    localMenuGroups.forEach((group) => {
      const cardsInGroup = group.querySelectorAll(".product-card");
      let hasVisibleProducts = false;

      cardsInGroup.forEach((card) => {
        const productTitleEl = card.querySelector(".product-title");

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
        group.classList.remove("hidden-group");
      } else {
        group.classList.add("hidden-group");
      }
    });
  });
}

// ==========================================================================
// 3. KATEGORIE-BUTTONS (NUR NOCH DIESE EINE LOGIK FÜR KLICKS!)
// ==========================================================================
document.querySelectorAll(".category-item").forEach((button) => {
  button.addEventListener("click", () => {
    // 1. Klasse "active" umschalten
    document
      .querySelectorAll(".category-item")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

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
      .querySelectorAll(".product-card")
      .forEach((card) => (card.style.display = ""));

    // 4. Kategorie-Gruppen über das HTML-Attribut "data-category" filtern
    const localMenuGroups = document.querySelectorAll(".menu-category-group");
    localMenuGroups.forEach((group) => {
      const groupCategory = group.getAttribute("data-category");

      // Wenn "alle" geklickt wurde oder die Kategorie exakt übereinstimmt -> zeigen, sonst verstecken
      if (
        selectedCategory.toLowerCase() === "alle" ||
        groupCategory === selectedCategory
      ) {
        group.classList.remove("hidden-group");
      } else {
        group.classList.add("hidden-group");
      }
    });
  });
});

// ==========================================================================
// 3. PRODUKT-MODAL STEUERUNG
// ==========================================================================
document.querySelectorAll(".btn-add-cart").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const card = button.closest(".product-card");
    currentProductName = card
      .querySelector(".product-title")
      .textContent.trim();
    const productDescText = card
      .querySelector(".product-description")
      .textContent.trim();
    const priceText = card.querySelector(".product-price").textContent;

    basePrice = parseFloat(priceText.replace(/[^\d.,]/g, "").replace(",", "."));

    modalTitle.textContent = currentProductName;
    modalDescription.textContent = productDescText;
    modalNotes.value = "";

    extraCheckboxes.forEach((cb) => (cb.checked = false));
    removeCheckboxes.forEach((cb) => (cb.checked = false));

    updateModalPrice();
    productModal.classList.remove("hidden");
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

const closeModal = () => productModal.classList.add("hidden");
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
      cartCountBadge.classList.add("hidden");
    } else {
      cartCountBadge.classList.remove("hidden");
      cartCountBadge.textContent = totalItems > 5 ? "5+" : totalItems;
    }
  }

  // Prüfen ob leer
  if (cart.length === 0) {
    cartEmptyView.style.display = "block";
    btnToCheckout.classList.add("disabled");
    btnToCheckout.disabled = true;

    cartSubtotalEl.textContent = "0,00 EUR";
    cartDiscountEl.textContent = "0,00 EUR";
    cartTotalEl.textContent = "0,00 EUR";
    minOrderAlert.style.display = "block";
    return;
  }

  cartEmptyView.style.display = "none";
  let subtotal = 0;

  // Jedes Produkt mit deinen Kartenelement-Styles rendern
  cart.forEach((item) => {
    subtotal += item.totalPrice;

    const extrasHTML =
      item.extras.length > 0
        ? item.extras
            .map(
              (e) =>
                `<div class="item-extra-line">+ Extra ${e.charAt(0).toUpperCase() + e.slice(1)}</div>`,
            )
            .join("")
        : "";

    const removedHTML =
      item.removed.length > 0
        ? item.removed
            .map(
              (r) =>
                `<div class="item-remove-line">- Ohne ${r.charAt(0).toUpperCase() + r.slice(1)}</div>`,
            )
            .join("")
        : "";

    const notesHTML = item.notes
      ? `<div class="item-note-line">Anmerkung: "${item.notes}"</div>`
      : "";

    const itemCard = document.createElement("div");
    itemCard.classList.add("cart-item-card");

    itemCard.innerHTML = `
      <div class="cart-item-header">
        <span class="item-title">${item.name}</span>
        <span class="item-delete btn-remove-item" data-id="${item.id}">&times;</span>
      </div>
      
      <div class="cart-item-details">
        ${extrasHTML}
        ${removedHTML}
        ${notesHTML}
      </div>
      
      <div class="cart-item-footer">
        <div class="quantity-control">
          <span>Menge:</span>
          <input type="text" class="qty-input" value="1" readonly />
        </div>
        <span class="item-price">${item.totalPrice.toFixed(2).replace(".", ",")} EUR</span>
      </div>
    `;
    cartItemsContainer.appendChild(itemCard);
  });

  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  cartSubtotalEl.textContent = `${subtotal.toFixed(2).replace(".", ",")} EUR`;
  cartDiscountEl.textContent = `-${discount.toFixed(2).replace(".", ",")} EUR`;
  cartTotalEl.textContent = `${total.toFixed(2).replace(".", ",")} EUR`;

  if (subtotal >= MIN_ORDER_VALUE) {
    minOrderAlert.style.display = "none";
    btnToCheckout.classList.remove("disabled");
    btnToCheckout.disabled = false;
  } else {
    minOrderAlert.style.display = "block";
    btnToCheckout.classList.add("disabled");
    btnToCheckout.disabled = true;
  }

  document.querySelectorAll(".btn-remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idToRemove = parseInt(btn.getAttribute("data-id"));
      cart = cart.filter((item) => item.id !== idToRemove);
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
    if (cartSidebar) cartSidebar.classList.remove("hidden");
  });
}

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", () => {
    cartSidebar.classList.add("hidden");
  });
}

if (cartSidebar) {
  cartSidebar.addEventListener("click", (event) => {
    if (event.target === cartSidebar) {
      cartSidebar.classList.add("hidden");
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
    impressumModal.classList.remove("hidden");
  });
}

// Schließen-Logik (Kreuz und Hintergrund-Klick)
if (impressumModal) {
  impressumModal.addEventListener("click", (event) => {
    // Falls auf das X geklickt wird ODER direkt auf den dunklen Hintergrund
    if (
      event.target.classList.contains("close-impressum-btn") ||
      event.target === impressumModal
    ) {
      impressumModal.classList.add("hidden");
    }
  });
}
