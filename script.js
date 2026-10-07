// ---------- Data ----------
const PRODUCTS = [
  { id: 1,  name: "Potato Chips",     price: 25,  category: "Snacks",   emoji: "🥔" },
  { id: 2,  name: "Chocolate Bar",    price: 30,  category: "Snacks",   emoji: "🍫" },
  { id: 3,  name: "Crackers",         price: 12,  category: "Snacks",   emoji: "🍘" },
  { id: 4,  name: "Instant Noodles",  price: 20,  category: "Snacks",   emoji: "🍜" },
  { id: 5,  name: "Cookies",          price: 18,  category: "Snacks",   emoji: "🍪" },
  { id: 6,  name: "Bottled Water",    price: 15,  category: "Drinks",   emoji: "💧" },
  { id: 7,  name: "Iced Tea",         price: 25,  category: "Drinks",   emoji: "🧋" },
  { id: 8,  name: "Soda Can",         price: 35,  category: "Drinks",   emoji: "🥤" },
  { id: 9,  name: "Orange Juice",     price: 40,  category: "Drinks",   emoji: "🍊" },
  { id: 10, name: "Coffee Sachet",    price: 10,  category: "Drinks",   emoji: "☕" },
  { id: 11, name: "Notebook",         price: 45,  category: "Supplies", emoji: "📓" },
  { id: 12, name: "Ballpen",          price: 10,  category: "Supplies", emoji: "🖊️" },
  { id: 13, name: "Pencil",           price: 8,   category: "Supplies", emoji: "✏️" },
  { id: 14, name: "Yellow Pad",       price: 35,  category: "Supplies", emoji: "📒" },
  { id: 15, name: "Highlighter",      price: 28,  category: "Supplies", emoji: "🖍️" },
  { id: 16, name: "Scientific Calc.", price: 450, category: "Supplies", emoji: "🧮" },
];

// ---------- State ----------
let cart = [];            // [{ id, qty }]
let activeCategory = "All";
let searchText = "";

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const peso = (n) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
const cartTotal = () => cart.reduce((s, c) => s + getProduct(c.id).price * c.qty, 0);
const cartCount = () => cart.reduce((s, c) => s + c.qty, 0);
const cashValue = () => parseFloat($("cash").value);
const escapeHtml = (s) => s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// ---------- Product catalog ----------
function renderTabs() {
  const cats = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  $("tabs").innerHTML = cats
    .map((c) => `<button class="tab" role="tab" aria-selected="${c === activeCategory}" data-cat="${c}">${c}</button>`)
    .join("");
}

function renderProducts() {
  const list = PRODUCTS.filter(
    (p) =>
      (activeCategory === "All" || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchText.toLowerCase())
  );
  $("productGrid").innerHTML = list.length
    ? list
        .map(
          (p) => `<button class="product" data-id="${p.id}" type="button">
            <span class="emoji" aria-hidden="true">${p.emoji}</span>
            <span class="name">${p.name}</span>
            <span class="price">${peso(p.price)}</span>
          </button>`
        )
        .join("")
    : `<p class="no-results">No products match your search.</p>`;
}

// ---------- Cart ----------
function addToCart(id) {
  const line = cart.find((c) => c.id === id);
  line ? line.qty++ : cart.push({ id, qty: 1 });
  updateUI();
}

function setQty(id, qty) {
  qty = Math.floor(qty);
  if (!qty || qty < 1) return removeFromCart(id);
  cart.find((c) => c.id === id).qty = Math.min(qty, 999);
  updateUI();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  updateUI();
}

function renderCart() {
  $("emptyMsg").hidden = cart.length > 0;
  $("cartList").innerHTML = cart
    .map((c) => {
      const p = getProduct(c.id);
      return `<li>
        <span class="nm">${p.emoji} ${p.name}<br><small>${peso(p.price)} each</small></span>
        <span class="sub">${peso(p.price * c.qty)}</span>
        <span class="qty">
          <button type="button" data-act="dec" data-id="${p.id}" aria-label="Decrease ${p.name}">−</button>
          <input type="number" min="1" value="${c.qty}" data-act="set" data-id="${p.id}" aria-label="Quantity of ${p.name}">
          <button type="button" data-act="inc" data-id="${p.id}" aria-label="Increase ${p.name}">+</button>
        </span>
        <button type="button" class="remove" data-act="rm" data-id="${p.id}">Remove</button>
      </li>`;
    })
    .join("");
}

// ---------- Payment ----------
function renderQuickCash() {
  const total = cartTotal();
  const options = new Set();
  if (total > 0) {
    options.add(total); // exact amount
    [20, 50, 100, 200, 500, 1000].forEach((d) => { if (d >= total) options.add(d); });
    const next100 = Math.ceil(total / 100) * 100;
    options.add(next100);
  }
  $("quickCash").innerHTML = [...options].slice(0, 5)
    .map((v) => `<button type="button" data-cash="${v}">${v === total ? "Exact" : "₱" + v}</button>`)
    .join("");
}

function updateChange() {
  const total = cartTotal(), cash = cashValue();
  $("change").textContent = !isNaN(cash) && cash >= total && total > 0 ? peso(cash - total) : peso(0);
}

function validatePayment() {
  const total = cartTotal(), cash = cashValue();
  if (cart.length === 0) return "Add at least one item before charging.";
  if ($("cash").value.trim() === "" || isNaN(cash)) return "Enter the cash amount received.";
  if (cash < 0) return "Cash amount cannot be negative.";
  if (cash < total) return `Cash is short by ${peso(total - cash)}.`;
  return "";
}

function updateUI() {
  renderCart();
  $("itemCount").textContent = cartCount();
  $("total").textContent = peso(cartTotal());
  renderQuickCash();
  updateChange();
  $("error").textContent = "";
}

// ---------- Receipt ----------
let receiptNo = Number(sessionStorage.getItem("receiptNo") || 1000);

function generateReceipt() {
  const error = validatePayment();
  if (error) { $("error").textContent = error; return; }

  receiptNo++;
  sessionStorage.setItem("receiptNo", receiptNo);
  const total = cartTotal(), cash = cashValue();
  const now = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

  const items = cart.map((c) => {
    const p = getProduct(c.id);
    return `<div class="item">
      <div>${escapeHtml(p.name)}</div>
      <div class="row"><span>${c.qty} x ${peso(p.price)}</span><span>${peso(p.price * c.qty)}</span></div>
    </div>`;
  }).join("");

  $("receipt").innerHTML = `
    <h3>Campus Corner Store</h3>
    <p class="c">Official digital receipt</p>
    <p class="c">${now}</p>
    <p class="c">Receipt #${receiptNo}</p>
    <hr>${items}<hr>
    <div class="row"><span>Items</span><span>${cartCount()}</span></div>
    <div class="row big"><span>TOTAL</span><span>${peso(total)}</span></div>
    <div class="row"><span>Cash</span><span>${peso(cash)}</span></div>
    <div class="row"><span>Change</span><span>${peso(cash - total)}</span></div>
    <hr><p class="c">Thank you! Come again.</p>`;
  $("receiptOverlay").hidden = false;
  $("doneBtn").focus();
}

// ---------- New transaction ----------
function newTransaction() {
  cart = [];
  $("cash").value = "";
  $("receiptOverlay").hidden = true;
  updateUI();
}

// ---------- Events ----------
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  activeCategory = b.dataset.cat;
  renderTabs(); renderProducts();
});
$("search").addEventListener("input", (e) => { searchText = e.target.value; renderProducts(); });
$("productGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) addToCart(Number(b.dataset.id));
});
$("cartList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || b.tagName !== "BUTTON") return;
  const id = Number(b.dataset.id), line = cart.find((c) => c.id === id);
  if (b.dataset.act === "inc") setQty(id, line.qty + 1);
  if (b.dataset.act === "dec") setQty(id, line.qty - 1);
  if (b.dataset.act === "rm") removeFromCart(id);
});
$("cartList").addEventListener("change", (e) => {
  if (e.target.dataset.act === "set") setQty(Number(e.target.dataset.id), Number(e.target.value));
});
$("quickCash").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cash]");
  if (b) { $("cash").value = b.dataset.cash; updateChange(); $("error").textContent = ""; }
});
$("cash").addEventListener("input", () => { updateChange(); $("error").textContent = ""; });
$("cash").addEventListener("keydown", (e) => { if (e.key === "Enter") generateReceipt(); });
$("payBtn").addEventListener("click", generateReceipt);
$("clearBtn").addEventListener("click", () => { cart = []; $("cash").value = ""; updateUI(); });
$("newTxnBtn").addEventListener("click", newTransaction);
$("doneBtn").addEventListener("click", newTransaction);
$("printBtn").addEventListener("click", () => window.print());
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("receiptOverlay").hidden) newTransaction(); });

// ---------- Init ----------
function tick() {
  $("clock").textContent = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}
tick(); setInterval(tick, 30000);
renderTabs(); renderProducts(); updateUI();
