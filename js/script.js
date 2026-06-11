// ==========================================================================
// GLOBAL CONFIGURATION, CONFIG STATE & CONSTANTS
// ==========================================================================

/** @type {string[]} Supported operational delivery postal codes */
const VALID_POSTCODES = ["51371", "51373", "51375", "51377", "51379", "51381"];

/** @type {Array<Object>} Global runtime shopping cart storage */
let cart = [];

/** @type {number} Minimum financial threshold required to dispatch an order */
const MIN_ORDER_VALUE = 20.0;

// ==========================================================================
// DOM ELEMENT INITIALIZATION & SELECTORS
// ==========================================================================

// Postal Code Verification & Navigation Header Elements
const plzModal = document.getElementById("plz-modal");
const plzSubmitBtn = document.getElementById("btn-check-plz");
const plzInputField = document.getElementById("plz-input");
const plzErrorMsg = document.getElementById("plz-error");
const plzChangeLink = document.querySelector(".pml-change-link");

// Navigation & Global Interaction Targets
const orderBtn = document.querySelector(".pml-btn-order");
const searchSection = document.querySelector(".pml-search-section");
const categoryButtons = document.querySelectorAll(".pml-category-item");
const categoryGroups = document.querySelectorAll(".pml-menu-category-group");
const cartCountBadge = document.getElementById("cart-count-badge");
const navCartBtn = document.querySelector(".pml-cart-box");
const menuRenderTarget = document.getElementById("menu-render-target");

// Configurable Product Customization Modal UI Nodes
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

// Contextual Tracking States for Product Customization Window
let basePrice = 0;
let currentProductName = "";

// ==========================================================================
// SHOPPING CART CORE DATA SYNC & PERSISTENCE
// ==========================================================================

/**
 * Retrieves and normalizes cart line-items stored in local browser state.
 * Gracefully defaults to an empty layout structure upon detection of corrupt payloads.
 */
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
    console.warn("Shopping cart state hydration failed:", error);
    cart = [];
  }
}

/**
 * Persists the current collection state of active line items into local storage cache.
 */
function saveCartToStorage() {
  localStorage.setItem("milano_warenkorb", JSON.stringify(cart));
}

/**
 * Aggregates financials for line items inside the active transaction footprint.
 * Applies a global promotional 10% discount profile over calculated subtotals.
 * * @param {Array<Object>} items - Array of active line items in the cart.
 * @returns {{subtotal: number, discount: number, total: number}} Financial calculation aggregates.
 */
function getCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const discount = subtotal * 0.1; // 10% global incentive markdown
  const total = subtotal - discount;

  return { subtotal, discount, total };
}

// Shopping Cart Sidebar Container & Summary UI Components
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
// 1. POSTAL CODE (PLZ) VERIFICATION ENGINE
// ==========================================================================

const savedPlzOnLoad = localStorage.getItem("milano_plz");

// Initialize execution flow checks against saved geo-restrictions on boot
if (plzModal) {
  if (savedPlzOnLoad && VALID_POSTCODES.includes(savedPlzOnLoad)) {
    plzModal.classList.add("pml-hidden");
    const navPlzDisplay = document.getElementById("nav-plz");
    if (navPlzDisplay) navPlzDisplay.textContent = savedPlzOnLoad;
  } else {
    plzModal.classList.remove("pml-hidden");
  }
}

/**
 * Synchronizes the postal code context string across the Navigation UI display state
 * and active Shipping Checkout Input modules.
 */
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

/**
 * Evaluates text inputs against delivery region guidelines.
 * Rejects invalid profiles and updates validation messaging nodes accordingly.
 */
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

// Bind verification trigger points for postal data operations
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

// SMOOTH SCROLL ANCHOR NAVIGATION INTERACTION
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
// 2. LIVE ASYNCHRONOUS ITEM SEARCH FILTER
// ==========================================================================
const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const searchText = event.target.value.toLowerCase().trim();
    const localMenuGroups = document.querySelectorAll(
      ".pml-menu-category-group",
    );

    localMenuGroups.forEach((group) => {
      const cardsInGroup = group.querySelectorAll(".pml-product-card");
      let hasVisibleProducts = false;

      cardsInGroup.forEach((card) => {
        const productTitleEl = card.querySelector(".pml-product-title");

        if (productTitleEl) {
          const productTitle = productTitleEl.textContent.toLowerCase();

          // Evaluate text visibility bounds matching dynamic search query patterns
          if (productTitle.includes(searchText)) {
            card.style.display = "";
            hasVisibleProducts = true;
          } else {
            card.style.display = "none";
          }
        }
      });

      // Clear layout nodes representing catalog segments stripped of active variants
      if (hasVisibleProducts || searchText === "") {
        group.classList.remove("pml-hidden-group");
      } else {
        group.classList.add("pml-hidden-group");
      }
    });
  });
}

// ==========================================================================
// 3. MENU CATEGORY ARCHITECTURE & SELECTION FLOW
// ==========================================================================
document.querySelectorAll(".pml-category-item").forEach((button) => {
  button.addEventListener("click", () => {
    // Tweak local visualization state flags across interaction buttons
    document
      .querySelectorAll(".pml-category-item")
      .forEach((btn) => btn.classList.remove("pml-active"));
    button.classList.add("pml-active");

    // Cleanse structural category data criteria strings (Strips compound Emojis)
    const selectedCategory = button.textContent
      .replace(
        /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g,
        "",
      )
      .trim();

    // Reset search inputs on category switch to ensure full catalog re-evaluation
    if (searchInput) {
      searchInput.value = "";
    }
    document
      .querySelectorAll(".pml-product-card")
      .forEach((card) => (card.style.display = ""));

    // Evaluate global layout boundaries against selection data attributes
    const localMenuGroups = document.querySelectorAll(
      ".pml-menu-category-group",
    );
    localMenuGroups.forEach((group) => {
      const groupCategory = group.getAttribute("data-category");

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

/**
 * Dynamically renders product nodes inside the application markup view layer using incoming JSON collections.
 * * @param {Array<Object>} menuGroups - Dynamic data structures defining categories and inner item configurations.
 */
function renderMenuFromJson(menuGroups) {
  if (!menuRenderTarget) return;

  menuRenderTarget.innerHTML = menuGroups
    .map(
      (group) => `
        <div class="pml-menu-category-group" data-category="${group.category}">
          <div class="pml-category-banner">${group.label}</div>
          <div class="pml-products-grid">
            ${group.items
              .map(
                (item) => `
                  <div class="pml-product-card" data-product-name="${item.name}" data-product-description="${item.description}" data-product-price="${item.price}">
                    <div class="pml-product-info">
                      <h3 class="pml-product-title">${item.name}</h3>
                      <p class="pml-product-description">${item.description}</p>
                    </div>
                    <div class="pml-product-bottom">
                      <span class="pml-product-price">ab ${Number(item.price).toFixed(2).replace(".", ",")} EUR</span>
                      <button class="pml-btn-add-cart" type="button">
                        <span class="material-symbols-outlined">add_shopping_cart</span>
                        In den Warenkorb
                      </button>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `,
    )
    .join("");
}

/**
 * Hydrates, formats, and opens the customization modal window using data-attributes from the selected item card.
 * * @param {HTMLElement} card - The DOM element block of the clicked menu item.
 */
function openProductModalFromCard(card) {
  currentProductName = card.dataset.productName || "";
  const productDescText = card.dataset.productDescription || "";
  const priceText = card.dataset.productPrice || "0";

  basePrice = parseFloat(priceText.replace(",", "."));

  modalTitle.textContent = currentProductName;
  modalDescription.textContent = productDescText;
  modalNotes.value = "";

  extraCheckboxes.forEach((cb) => (cb.checked = false));
  removeCheckboxes.forEach((cb) => (cb.checked = false));

  updateModalPrice();
  productModal.classList.remove("pml-hidden");
}

// Delegation hook tracking dynamic interface clicks within product rendering layouts
if (menuRenderTarget) {
  menuRenderTarget.addEventListener("click", (event) => {
    const button = event.target.closest(".pml-btn-add-cart");
    if (!button) return;

    event.preventDefault();
    const card = button.closest(".pml-product-card");
    if (card) openProductModalFromCard(card);
  });
}

// Fetch structural menu data schema configuration objects from storage endpoint
fetch("products.json")
  .then((response) => {
    if (!response.ok)
      throw new Error(
        "Failed to resolve application products dataset manifest structure.",
      );
    return response.json();
  })
  .then((data) => renderMenuFromJson(data))
  .catch((error) => {
    console.error(error);
    if (menuRenderTarget) {
      menuRenderTarget.innerHTML =
        '<p class="pml-product-description">Die Speisekarte konnte nicht geladen werden.</p>';
    }
  });

/**
 * Computes modification costs based on user selections and updates the configuration window markup.
 */
function updateModalPrice() {
  let extraCost = 0;
  extraCheckboxes.forEach((cb) => {
    if (cb.checked) extraCost += 1.5; // Constant upcharge fee per item modification
  });
  const totalPrice = basePrice + extraCost;
  modalCurrentPrice.textContent = `${totalPrice.toFixed(2).replace(".", ",")} EUR`;
}

extraCheckboxes.forEach((cb) =>
  cb.addEventListener("change", updateModalPrice),
);

// Configuration handlers controlling active visibility structures across item modals
const closeModal = () => productModal.classList.add("pml-hidden");
if (closeModalX) closeModalX.addEventListener("click", closeModal);
if (btnCloseAbort) btnCloseAbort.addEventListener("click", closeModal);

productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeModal();
});

// ==========================================================================
// 4. SHOPPING CART LOGIC (STATE UPDATES & RENDER ENGINE)
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
      id: Date.now(), // High-entropy internal tracking key assignment
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

/**
 * Synchronizes runtime item parameters with DOM rendering.
 * Re-evaluates order limits, applies discounts, and configures event bindings for line components.
 */
function updateCartUI() {
  cartItemsContainer.innerHTML = "";

  // Synchronize cart counter indicators based on items length
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

  // Handle UX rendering structures for empty shopping cart containers
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

  // Render configured product selections with appropriate dynamic modifiers
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

  // Display computed global financial totals across UI elements
  cartSubtotalEl.textContent = `${subtotal.toFixed(2).replace(".", ",")} EUR`;
  cartDiscountEl.textContent = `-${discount.toFixed(2).replace(".", ",")} EUR`;
  cartTotalEl.textContent = `${total.toFixed(2).replace(".", ",")} EUR`;

  // Evaluate structural processing allowance against business rule limits
  if (subtotal >= MIN_ORDER_VALUE) {
    minOrderAlert.style.display = "none";
    btnToCheckout.classList.remove("pml-disabled");
    btnToCheckout.disabled = false;
  } else {
    minOrderAlert.style.display = "block";
    btnToCheckout.classList.add("pml-disabled");
    btnToCheckout.disabled = true;
  }

  // Bind removal hooks for removing individual tracking keys out of storage arrays
  document.querySelectorAll(".pml-btn-remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idToRemove = parseInt(btn.getAttribute("data-id"));
      cart = cart.filter((item) => item.id !== idToRemove);
      saveCartToStorage();
      updateCartUI();
    });
  });

  // Dynamic input triggers updating operational product matrix pricing properties
  document.querySelectorAll(".pml-cart-quantity-change").forEach((input) => {
    input.addEventListener("input", (event) => {
      const idToChange = parseInt(input.getAttribute("data-id"));
      let newQty = parseInt(event.target.value) || 1;

      if (newQty < 1) newQty = 1;

      const targetItem = cart.find((item) => item.id === idToChange);
      if (targetItem) {
        if (!targetItem.singlePrice) {
          targetItem.singlePrice = targetItem.totalPrice;
        }
        targetItem.quantity = newQty;
        targetItem.totalPrice = targetItem.singlePrice * newQty;
      }

      saveCartToStorage();
      updateCartUI(); // Instantly update view tracking indicators
    });
  });
}

// ==========================================================================
// 5. SHOPPING CART SIDEBAR DISPLAY TOGGLES
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
// 6. LEGAL NOTICE (IMPRESSUM) MODAL DISPLAY LOGIC
// ==========================================================================
const linkImpressum = document.getElementById("link-impressum");
const impressumModal = document.getElementById("impressum-modal");

if (linkImpressum && impressumModal) {
  linkImpressum.addEventListener("click", (event) => {
    event.preventDefault();
    impressumModal.classList.remove("pml-hidden");
  });
}

if (impressumModal) {
  impressumModal.addEventListener("click", (event) => {
    if (
      event.target.classList.contains("pml-close-impressum-btn") ||
      event.target === impressumModal
    ) {
      impressumModal.classList.add("pml-hidden");
    }
  });
}

// ==========================================================================
// 7. MULTI-STEP CHECKOUT ROUTING FLOW
// ==========================================================================
const cartViewStep = document.getElementById("cart-view-step");
const addressViewStep = document.getElementById("address-view-step");
const btnToCheckoutLocal = document.getElementById("btn-to-checkout");
const btnBackToCart = document.getElementById("btn-back-to-cart");
const deliveryForm = document.getElementById("delivery-form");
const addressPlzField = document.getElementById("address-plz");

// Forward workflow route transition initialization
if (btnToCheckoutLocal) {
  btnToCheckoutLocal.addEventListener("click", () => {
    if (cart.length > 0) {
      cartViewStep.classList.add("pml-hidden-step");
      addressViewStep.classList.remove("pml-hidden-step");

      const savedPlz = localStorage.getItem("milano_plz") || "";
      if (addressPlzField) {
        addressPlzField.value = savedPlz;
      }
    }
  });
}

// Reversal workflow route transition initialization
if (btnBackToCart) {
  btnBackToCart.addEventListener("click", () => {
    addressViewStep.classList.add("pml-hidden-step");
    cartViewStep.classList.remove("pml-hidden-step");
  });
}

// Interface step resetting configuration handlers mapped on closure events
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

/**
 * Resets the visual presentation state of checkout wizard layers by adjusting active visibility classes.
 */
function resetSidebarSteps() {
  const cartViewStep = document.getElementById("cart-view-step");
  const addressViewStep = document.getElementById("address-view-step");

  if (cartViewStep && addressViewStep) {
    // Clear residual formatting behaviors injected by direct layout modifications
    addressViewStep.style.display = "";
    cartViewStep.style.display = "";

    addressViewStep.classList.add("pml-hidden-step");
    cartViewStep.classList.remove("pml-hidden-step");
  }
}

// Validation handler monitoring structural field inputs prior to payment dispatch
if (deliveryForm) {
  deliveryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let isFormValid = true;

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

      console.log("Validated Shipping Model Target Payload:", customerData);

      // INTEGRATION ANCHOR: Insert operational Stripe checkout gateway hooks here
      alert("Weiterleitung zur Zahlung...");
    }
  });
}

// Live interactive sync tracking matching UI elements across postal updates
if (addressPlzField) {
  addressPlzField.addEventListener("input", () => {
    const navPlzDisplay = document.getElementById("nav-plz");
    const currentCode = addressPlzField.value.trim();

    if (navPlzDisplay && currentCode.length === 5 && !isNaN(currentCode)) {
      navPlzDisplay.textContent = currentCode;
    }
  });
}

// =========================================================================
// 8. STORAGE CAPABILITY MODULE DESIGN
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
// 9. RIGID INPUT VALIDATION CONTROLLER
// =========================================================================

/**
 * Executes evaluation logic using strong regex matching parameters.
 * Blocks form propagation sequences if input metrics violate integrity definitions.
 * * @param {Event} event - System submit tracking event reference object context.
 * @returns {boolean} Validation evaluation result flag status.
 */
function validiereBestellung(event) {
  // Terminate execution lifecycles across alternative framework listeners
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  // Regular expression evaluation rules mapping localized standard conventions
  const emailMuster = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameMuster = /^[a-zA-ZäöüÄÖÜß\s\-]{2,}$/;
  const telefonMuster = /^[0-9\s\+\-\/]{5,}$/;

  let hatFehler = false;

  // Retrieve functional form context module selectors
  const vornameInput = document.getElementById("address-firstname");
  const nachnameInput = document.getElementById("address-lastname");
  const telefonInput = document.getElementById("address-phone");
  const emailInput = document.getElementById("address-email");
  const strasseInput = document.getElementById("address-street");
  const hausnummerInput = document.getElementById("address-housenumber");
  const plzInput = document.getElementById("address-plz");
  const stadtInput = document.getElementById("address-city");

  /**
   * Adjusts functional evaluation interface classes based on error assertions.
   */
  function zeigeFehler(inputElement, istFehler, nachricht) {
    if (!inputElement) return;
    const fehlerDiv = inputElement.parentElement.querySelector(
      ".pml-form-error-msg",
    );

    if (istFehler) {
      inputElement.classList.add("pml-input-error");
      if (fehlerDiv) {
        fehlerDiv.innerText = nachricht;
        fehlerDiv.classList.remove("pml-hidden");
        fehlerDiv.style.display = "block";
      }
      hatFehler = true; // Error assertion flag triggered
    } else {
      inputElement.classList.remove("pml-input-error");
      if (fehlerDiv) {
        fehlerDiv.classList.add("pml-hidden");
        fehlerDiv.style.display = "none";
      }
    }
  }

  // --- STRICT PATTERN MATCHING VALIDATION EXECUTION ---
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

  // --- CONDITIONAL STRATIFICATION SWITCH ---
  if (hatFehler) {
    console.log("Validation evaluation failed. Interception triggered.");
    return false; // Terminate submission pipeline
  } else {
    speicherePLZ(plzInput.value);
    alert("Weiterleitung zur Zahlung...");
    // starteStripeCheckout(); // Target deployment hook
    return true;
  }
}

// =========================================================================
// 10. SYSTEM APPLICATION ROOT BOOTSTRAPPER
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Hydrate states from tracking arrays
  loadCartFromStorage();
  updateCartUI();

  const form = document.getElementById("delivery-form");
  if (form) {
    form.addEventListener("submit", validiereBestellung);
  }

  // Pre-populate input fields using geolocation attributes stored inside memory
  const gespeichertePlz = ladePLZ();
  const plzFeld = document.getElementById("address-plz");

  if (gespeichertePlz && plzFeld) {
    plzFeld.value = gespeichertePlz;
  }

  syncAddressPlzField();
});
