const seedProducts = [
  {
    id: "henrietta",
    name: "Henrietta",
    breed: "Rhode Island Red",
    age: 4,
    price: 42,
    stock: 3,
    image: "assets/hen-red.jpg",
    description: "A confident young pullet with rich mahogany-red feathers. Rhode Island Reds are a well-known, hardy heritage breed.",
    traits: ["Mahogany plumage", "Alert & curious", "Heritage breed"]
  },
  {
    id: "pepper",
    name: "Pepper",
    breed: "Plymouth Rock",
    age: 5,
    price: 48,
    stock: 2,
    image: "assets/hen-speckled.png",
    description: "A gentle, growing pullet with classic barred plumage. Plymouth Rocks are a popular dual-purpose American breed.",
    traits: ["Barred plumage", "Calm nature", "American heritage"]
  },
  {
    id: "sunny",
    name: "Sunny",
    breed: "Buff Orpington",
    age: 6,
    price: 55,
    stock: 4,
    image: "assets/hen-golden.jpg",
    description: "A golden-feathered hen with a soft, rounded shape. Buff Orpingtons are a well-loved English heritage breed.",
    traits: ["Golden buff feathers", "Soft feathering", "English heritage"]
  },
  {
    id: "maple",
    name: "Maple",
    breed: "Brahma",
    age: 5,
    price: 46,
    stock: 0,
    image: "assets/maple-brahma.png",
    description: "A Brahma with pale plumage, dark neck markings, and feathered legs. Brahmas are a large heritage breed.",
    traits: ["Feathered legs", "Dark neck markings", "Heritage breed"]
  },
  {
    id: "daisy",
    name: "Daisy",
    breed: "Copper Maran",
    age: 4,
    price: 40,
    stock: 1,
    image: "assets/daisy-copper-maran.png",
    description: "A Copper Maran with deep copper neck feathers, dark plumage, and feathered legs.",
    traits: ["Copper neck feathers", "Dark plumage", "Feathered legs"]
  },
  {
    id: "marigold",
    name: "Marigold",
    breed: "Porcelain D'uccle Bantam",
    age: 7,
    price: 58,
    stock: 2,
    image: "assets/marigold-porcelain-duc-clubantam.png",
    description: "A Porcelain D'uccle Bantam with pale plumage, delicate blue-gray markings, and feathered legs.",
    traits: ["Porcelain coloring", "Feathered legs", "Bantam breed"]
  }
];

const STORAGE_KEY = "meadow-cluck-products";
const imageOptions = new Set(["assets/hen-red.jpg", "assets/hen-speckled.png", "assets/hen-golden.jpg", "assets/maple-brahma.png", "assets/daisy-copper-maran.png", "assets/marigold-porcelain-duc-clubantam.png"]);
const legacyImagePaths = new Map([
  ["assets/hen-red.svg", "assets/hen-red.jpg"],
  ["assets/hen-speckled.svg", "assets/hen-speckled.png"],
  ["assets/hen-golden.svg", "assets/hen-golden.jpg"]
]);
const grid = document.querySelector("#product-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const detailsModal = document.querySelector("#details-modal");
const adminModal = document.querySelector("#admin-modal");
const adminList = document.querySelector("#admin-list");
const productForm = document.querySelector("#product-form");
const listingStatus = document.querySelector("#listing-status");
const adminStatus = document.querySelector("#admin-status");
let activeAge = "all";
let products = loadProducts();
let lastFocusedElement;

function loadProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return structuredClone(seedProducts);
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const migrated = parsed.map((product) => {
        let updatedProduct = product;
        if (product.id === "maple") {
          updatedProduct = {
              ...product,
              breed: "Brahma",
              image: "assets/maple-brahma.png",
              description: "A Brahma with pale plumage, dark neck markings, and feathered legs. Brahmas are a large heritage breed.",
              traits: ["Feathered legs", "Dark neck markings", "Heritage breed"]
          };
        } else if (product.id === "daisy") {
          updatedProduct = {
            ...product,
            breed: "Copper Maran",
            image: "assets/daisy-copper-maran.png",
            description: "A Copper Maran with deep copper neck feathers, dark plumage, and feathered legs.",
            traits: ["Copper neck feathers", "Dark plumage", "Feathered legs"]
          };
        } else if (product.id === "marigold") {
          updatedProduct = {
            ...product,
            breed: "Porcelain D'uccle Bantam",
            image: "assets/marigold-porcelain-duc-clubantam.png",
            description: "A Porcelain D'uccle Bantam with pale plumage, delicate blue-gray markings, and feathered legs.",
            traits: ["Porcelain coloring", "Feathered legs", "Bantam breed"]
          };
        }
        return {
          ...updatedProduct,
          image: legacyImagePaths.get(updatedProduct.image) ?? updatedProduct.image
        };
      });
      if (migrated.some((product, index) => JSON.stringify(product) !== JSON.stringify(parsed[index]))) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    }
    throw new Error("Saved chicken listings are not a list.");
  } catch (error) {
    console.error("Could not read saved chicken listings:", error);
    listingStatus.textContent = "Saved listings could not be read. Showing the original farm listings instead.";
    return structuredClone(seedProducts);
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error("Could not save chicken listings:", error);
    adminStatus.textContent = "Could not save changes in this browser. Check browser storage and try again.";
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function ageLabel(age) {
  return `${age} ${age === 1 ? "month" : "months"}`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(price);
}

function filteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  return products.filter((product) => {
    const inAgeGroup = activeAge === "all" || (activeAge === "6" ? product.age >= 6 : product.age === Number(activeAge));
    const matchesSearch = !query || `${product.name} ${product.breed} ${product.description}`.toLowerCase().includes(query);
    return inAgeGroup && matchesSearch;
  });
}

function renderProducts() {
  const visibleProducts = filteredProducts();
  grid.innerHTML = visibleProducts.map((product) => {
    const available = product.stock > 0;
    const traits = Array.isArray(product.traits) ? product.traits : [];
    return `<article class="product-card">
      <div class="product-image">
        <span class="age-badge">${escapeHTML(ageLabel(product.age))}</span>
        <span class="stock-badge ${available ? "" : "unavailable"}">${available ? `${product.stock} available` : "Currently unavailable"}</span>
        <img src="${escapeHTML(imageOptions.has(product.image) ? product.image : "assets/hen-red.jpg")}" alt="Photo of ${escapeHTML(product.breed)} chicken">
        <span class="breed-photo-label"><small>BREED</small> ${escapeHTML(product.breed)}</span>
      </div>
      <div class="product-info">
        <p class="product-subtitle">Chicken breed · ${escapeHTML(product.breed)}</p>
        <div class="product-title-row"><h3>${escapeHTML(product.name)}</h3><span class="product-price">${formatPrice(product.price)}</span></div>
        <p class="product-description">${escapeHTML(product.description)}</p>
        <div class="card-footer"><span class="traits-preview">${escapeHTML(traits.slice(0, 2).join(" · "))}</span><button class="details-link" type="button" data-details="${escapeHTML(product.id)}">Meet ${escapeHTML(product.name)} <span aria-hidden="true">→</span></button></div>
      </div>
    </article>`;
  }).join("");
  emptyState.hidden = visibleProducts.length > 0;
  document.querySelector("#count-all").textContent = products.length;
}

function showModal(modal) {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector("button")?.focus();
}

function closeModal(modal) {
  modal.hidden = true;
  if (detailsModal.hidden && adminModal.hidden) document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}

function openDetails(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const traits = Array.isArray(product.traits) ? product.traits : [];
  document.querySelector("#details-content").innerHTML = `
    <div class="details-layout">
      <div class="details-image"><img src="${escapeHTML(imageOptions.has(product.image) ? product.image : "assets/hen-red.jpg")}" alt="Photo of ${escapeHTML(product.breed)} chicken"></div>
      <div class="details-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> FROM OUR FLOCK</p>
        <h2 id="details-title">${escapeHTML(product.name)}</h2>
        <p class="details-breed"><strong>Breed:</strong> ${escapeHTML(product.breed)}</p>
        <p class="details-price">${formatPrice(product.price)}</p>
        <p class="details-description">${escapeHTML(product.description)}</p>
        <div class="details-traits">${traits.map((trait) => `<span class="details-trait">${escapeHTML(trait)}</span>`).join("")}</div>
        <p class="details-stock">${product.stock > 0 ? `${product.stock} currently available · ${escapeHTML(ageLabel(product.age))} old` : `Currently unavailable · ${escapeHTML(ageLabel(product.age))} old`}</p>
      </div>
    </div>`;
  showModal(detailsModal);
}

function renderAdmin() {
  document.querySelector("#admin-count").textContent = `${products.length} ${products.length === 1 ? "listing" : "listings"}`;
  adminList.innerHTML = products.map((product) => `<div class="admin-row">
    <img src="${escapeHTML(imageOptions.has(product.image) ? product.image : "assets/hen-red.jpg")}" alt="">
    <div class="admin-row-copy"><strong>${escapeHTML(product.name)} <span>·</span> ${escapeHTML(product.breed)}</strong><span>${escapeHTML(ageLabel(product.age))} · ${formatPrice(product.price)}</span></div>
    <span class="admin-row-stock">${product.stock} in stock</span>
    <div class="admin-row-actions"><button class="tiny-button" type="button" data-edit="${escapeHTML(product.id)}">Edit</button><button class="tiny-button delete" type="button" data-delete="${escapeHTML(product.id)}">Delete</button></div>
  </div>`).join("");
}

function resetForm() {
  productForm.reset();
  document.querySelector("#product-id").value = "";
  document.querySelector("#form-title").textContent = "Add a chicken";
  productForm.hidden = true;
}

function startEditing(product) {
  productForm.hidden = false;
  document.querySelector("#form-title").textContent = product ? `Edit ${product.name}` : "Add a chicken";
  document.querySelector("#product-id").value = product?.id ?? "";
  document.querySelector("#product-name").value = product?.name ?? "";
  document.querySelector("#product-breed").value = product?.breed ?? "";
  document.querySelector("#product-age").value = product?.age ?? "";
  document.querySelector("#product-price").value = product?.price ?? "";
  document.querySelector("#product-stock").value = product?.stock ?? "";
  document.querySelector("#product-image").value = product?.image ?? "assets/hen-red.jpg";
  document.querySelector("#product-description").value = product?.description ?? "";
  document.querySelector("#product-traits").value = Array.isArray(product?.traits) ? product.traits.join(" · ") : "";
  productForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
  document.querySelector("#product-name").focus({ preventScroll: true });
}

document.querySelectorAll(".filter-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeAge = button.dataset.age;
    document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    renderProducts();
  });
});
searchInput.addEventListener("input", renderProducts);
grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-details]");
  if (button) openDetails(button.dataset.details);
});
document.querySelector("#admin-open").addEventListener("click", () => {
  adminStatus.textContent = "";
  renderAdmin();
  resetForm();
  showModal(adminModal);
});
document.querySelector("#add-product").addEventListener("click", () => startEditing(null));
adminList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const product = products.find((item) => item.id === editButton.dataset.edit);
    if (product) startEditing(product);
  }
  if (deleteButton) {
    const product = products.find((item) => item.id === deleteButton.dataset.delete);
    if (!product || !window.confirm(`Delete the listing for ${product.name}?`)) return;
    const previousProducts = products;
    products = products.filter((item) => item.id !== product.id);
    if (saveProducts()) {
      renderAdmin();
      renderProducts();
      adminStatus.textContent = `${product.name}'s listing was deleted.`;
    } else {
      products = previousProducts;
    }
  }
});
document.querySelectorAll(".close-modal").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));
document.querySelectorAll(".cancel-form").forEach((button) => button.addEventListener("click", resetForm));
document.querySelectorAll(".modal-backdrop").forEach((modal) => modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal(modal);
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!adminModal.hidden) closeModal(adminModal);
    else if (!detailsModal.hidden) closeModal(detailsModal);
  }
});
productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!productForm.reportValidity()) return;
  const id = document.querySelector("#product-id").value;
  const age = Number(document.querySelector("#product-age").value);
  const price = Number(document.querySelector("#product-price").value);
  const stock = Number(document.querySelector("#product-stock").value);
  const product = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : `bird-${Date.now()}`),
    name: document.querySelector("#product-name").value.trim(),
    breed: document.querySelector("#product-breed").value.trim(),
    age,
    price,
    stock,
    image: document.querySelector("#product-image").value,
    description: document.querySelector("#product-description").value.trim(),
    traits: document.querySelector("#product-traits").value.split("·").map((trait) => trait.trim()).filter(Boolean)
  };
  const previousProducts = products;
  if (id) products = products.map((item) => item.id === id ? product : item);
  else products = [product, ...products];
  if (saveProducts()) {
    resetForm();
    renderAdmin();
    renderProducts();
    adminStatus.textContent = `${product.name}'s listing was ${id ? "updated" : "added"}.`;
  } else {
    products = previousProducts;
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();
renderProducts();
