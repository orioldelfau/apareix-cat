const STORAGE_KEY = "apareix.ops.v1";

const checklistItems = [
  "Fitxa de Google Maps localitzada",
  "Acces com a gestor rebut",
  "Horaris normals i especials confirmats",
  "Carta o menu actualitzat",
  "Link de reserves i web revisats",
  "Fotos del local i plats rebudes",
  "To de veu definit",
  "Competidors principals anotats",
  "Objectiu del pilot definit",
  "Primera auditoria preparada"
];

const postTemplates = [
  {
    title: "Plat destacat de la setmana",
    body: "Presentar un plat amb ingredients, moment ideal per demanar-lo i crida a reservar."
  },
  {
    title: "Recordatori de reserves",
    body: "Missatge curt per empentar reserves en dies fluixos o serveis clau."
  },
  {
    title: "Menu o proposta de migdia",
    body: "Publicacio orientada a cerques locals entre setmana i clients de proximitat."
  },
  {
    title: "Ressenya convertida en prova social",
    body: "Convertir una ressenya positiva en contingut visible a Google."
  }
];

let state = loadState();
let selectedId = state.restaurants[0]?.id || null;

const elements = {
  restaurantForm: document.querySelector("#restaurant-form"),
  restaurantList: document.querySelector("#restaurant-list"),
  resetDemo: document.querySelector("#reset-demo"),
  selectedName: document.querySelector("#selected-name"),
  selectedMeta: document.querySelector("#selected-meta"),
  exportJson: document.querySelector("#export-json"),
  emptyState: document.querySelector("#empty-state"),
  clientWorkspace: document.querySelector("#client-workspace"),
  clientForm: document.querySelector("#client-form"),
  deleteRestaurant: document.querySelector("#delete-restaurant"),
  checklist: document.querySelector("#checklist"),
  checklistProgress: document.querySelector("#checklist-progress"),
  generatePosts: document.querySelector("#generate-posts"),
  postForm: document.querySelector("#post-form"),
  postsList: document.querySelector("#posts-list"),
  reviewForm: document.querySelector("#review-form"),
  reviewsList: document.querySelector("#reviews-list"),
  generateReport: document.querySelector("#generate-report"),
  reportOutput: document.querySelector("#report-output"),
  metrics: {
    restaurants: document.querySelector("#metric-restaurants"),
    posts: document.querySelector("#metric-posts"),
    reviews: document.querySelector("#metric-reviews"),
    onboarding: document.querySelector("#metric-onboarding")
  }
};

render();

elements.restaurantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const restaurant = createRestaurant({
    name: form.get("name"),
    area: form.get("area"),
    cuisine: form.get("cuisine"),
    mapsUrl: form.get("mapsUrl"),
    contact: form.get("contact")
  });

  state.restaurants.unshift(restaurant);
  selectedId = restaurant.id;
  event.currentTarget.reset();
  persistAndRender();
});

elements.resetDemo.addEventListener("click", () => {
  const demo = createRestaurant({
    name: "La Taula del Barri",
    area: "Eixample, Barcelona",
    cuisine: "cuina catalana de temporada",
    mapsUrl: "https://maps.google.com/",
    contact: "gerencia@lataula.example"
  });
  demo.status = "Setup en curs";
  demo.ticket = "30-40 EUR";
  demo.goal = "Mes reserves de dimarts a dijous";
  demo.tone = "proper, local i professional";
  demo.notes = "Pilot ideal per validar posts setmanals i resposta a ressenyes.";
  demo.checklist = Object.fromEntries(checklistItems.slice(0, 6).map((item) => [item, true]));
  demo.posts = postTemplates.map((template, index) => ({
    id: createId(),
    title: template.title,
    body: buildPostBody(demo, template),
    status: index === 0 ? "Aprovat" : "Idea",
    createdAt: new Date().toISOString()
  }));
  demo.reviews = [
    {
      id: createId(),
      rating: "5",
      sentiment: "Positiva",
      body: "Molt bon tracte i menjar excel.lent.",
      reply: buildReply(demo, "5", "Positiva"),
      status: "Resposta suggerida",
      createdAt: new Date().toISOString()
    }
  ];

  state.restaurants = [demo];
  selectedId = demo.id;
  persistAndRender();
});

elements.clientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const restaurant = selectedRestaurant();
  if (!restaurant) return;

  const form = new FormData(event.currentTarget);
  restaurant.status = form.get("status");
  restaurant.ticket = form.get("ticket");
  restaurant.goal = form.get("goal");
  restaurant.tone = form.get("tone");
  restaurant.notes = form.get("notes");
  persistAndRender();
});

elements.deleteRestaurant.addEventListener("click", () => {
  const restaurant = selectedRestaurant();
  if (!restaurant) return;

  state.restaurants = state.restaurants.filter((item) => item.id !== restaurant.id);
  selectedId = state.restaurants[0]?.id || null;
  persistAndRender();
});

elements.generatePosts.addEventListener("click", () => {
  const restaurant = selectedRestaurant();
  if (!restaurant) return;

  const existingTitles = new Set(restaurant.posts.map((post) => post.title));
  const additions = postTemplates
    .filter((template) => !existingTitles.has(template.title))
    .map((template) => ({
      id: createId(),
      title: template.title,
      body: buildPostBody(restaurant, template),
      status: "Idea",
      createdAt: new Date().toISOString()
    }));

  restaurant.posts = [...additions, ...restaurant.posts];
  persistAndRender();
});

elements.postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const restaurant = selectedRestaurant();
  if (!restaurant) return;

  const form = new FormData(event.currentTarget);
  const title = String(form.get("title") || "").trim();
  if (!title) return;

  restaurant.posts.unshift({
    id: createId(),
    title,
    body: `Post per ${restaurant.name}. Enfocar en ${restaurant.goal || "reserves, carta i visibilitat local"}.`,
    status: "Idea",
    createdAt: new Date().toISOString()
  });

  event.currentTarget.reset();
  persistAndRender();
});

elements.reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const restaurant = selectedRestaurant();
  if (!restaurant) return;

  const form = new FormData(event.currentTarget);
  const rating = form.get("rating");
  const sentiment = form.get("sentiment");

  restaurant.reviews.unshift({
    id: createId(),
    rating,
    sentiment,
    body: form.get("body"),
    reply: buildReply(restaurant, rating, sentiment),
    status: sentiment === "Negativa" ? "Pendent aprovacio" : "Resposta suggerida",
    createdAt: new Date().toISOString()
  });

  event.currentTarget.reset();
  persistAndRender();
});

elements.generateReport.addEventListener("click", () => {
  const restaurant = selectedRestaurant();
  if (!restaurant) return;
  elements.reportOutput.value = buildReport(restaurant);
});

elements.exportJson.addEventListener("click", async () => {
  const payload = JSON.stringify(state, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    elements.exportJson.textContent = "Copiat";
  } catch {
    elements.reportOutput.value = payload;
    elements.exportJson.textContent = "Dades a l'informe";
  }
  window.setTimeout(() => {
    elements.exportJson.textContent = "Exportar dades";
  }, 1300);
});

function render() {
  renderRestaurantList();
  renderSelected();
  renderMetrics();
}

function renderRestaurantList() {
  elements.restaurantList.innerHTML = "";

  if (state.restaurants.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Encara no hi ha restaurants.";
    elements.restaurantList.append(empty);
    return;
  }

  state.restaurants.forEach((restaurant) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `restaurant-button${restaurant.id === selectedId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(restaurant.name)}</strong>
      <span>${escapeHtml(restaurant.area)} · ${escapeHtml(restaurant.status)}</span>
    `;
    button.addEventListener("click", () => {
      selectedId = restaurant.id;
      render();
    });
    elements.restaurantList.append(button);
  });
}

function renderSelected() {
  const restaurant = selectedRestaurant();
  elements.emptyState.hidden = Boolean(restaurant);
  elements.clientWorkspace.hidden = !restaurant;

  if (!restaurant) {
    elements.selectedName.textContent = "Selecciona un restaurant";
    elements.selectedMeta.textContent = "Alta, onboarding, posts, ressenyes i informe mensual.";
    return;
  }

  elements.selectedName.textContent = restaurant.name;
  elements.selectedMeta.textContent = `${restaurant.area} · ${restaurant.cuisine} · ${restaurant.status}`;
  elements.clientForm.status.value = restaurant.status;
  elements.clientForm.ticket.value = restaurant.ticket || "";
  elements.clientForm.goal.value = restaurant.goal || "";
  elements.clientForm.tone.value = restaurant.tone || "";
  elements.clientForm.notes.value = restaurant.notes || "";

  renderChecklist(restaurant);
  renderPosts(restaurant);
  renderReviews(restaurant);
}

function renderChecklist(restaurant) {
  elements.checklist.innerHTML = "";

  checklistItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(restaurant.checklist[item]);
    checkbox.addEventListener("change", () => {
      restaurant.checklist[item] = checkbox.checked;
      persistAndRender();
    });

    const label = document.createElement("label");
    label.textContent = item;
    row.append(checkbox, label);
    elements.checklist.append(row);
  });

  elements.checklistProgress.textContent = `${onboardingProgress(restaurant)}%`;
}

function renderPosts(restaurant) {
  elements.postsList.innerHTML = "";

  if (restaurant.posts.length === 0) {
    elements.postsList.append(emptyTask("Cap post creat encara."));
    return;
  }

  restaurant.posts.forEach((post) => {
    const card = taskCard(post.title, post.body, post.status);
    card.querySelector("[data-action='advance']").addEventListener("click", () => {
      post.status = nextPostStatus(post.status);
      persistAndRender();
    });
    card.querySelector("[data-action='delete']").addEventListener("click", () => {
      restaurant.posts = restaurant.posts.filter((item) => item.id !== post.id);
      persistAndRender();
    });
    elements.postsList.append(card);
  });
}

function renderReviews(restaurant) {
  elements.reviewsList.innerHTML = "";

  if (restaurant.reviews.length === 0) {
    elements.reviewsList.append(emptyTask("Cap ressenya registrada encara."));
    return;
  }

  restaurant.reviews.forEach((review) => {
    const card = taskCard(
      `${review.rating} estrelles · ${review.sentiment}`,
      `${review.body || "Sense text"}\n\nResposta: ${review.reply}`,
      review.status
    );
    card.querySelector("[data-action='advance']").addEventListener("click", () => {
      review.status = nextReviewStatus(review.status);
      persistAndRender();
    });
    card.querySelector("[data-action='delete']").addEventListener("click", () => {
      restaurant.reviews = restaurant.reviews.filter((item) => item.id !== review.id);
      persistAndRender();
    });
    elements.reviewsList.append(card);
  });
}

function renderMetrics() {
  const restaurants = state.restaurants;
  const selected = selectedRestaurant();
  const pendingPosts = restaurants.flatMap((item) => item.posts).filter((post) => post.status !== "Publicat").length;
  const pendingReviews = restaurants.flatMap((item) => item.reviews).filter((review) => review.status !== "Resposta publicada").length;

  elements.metrics.restaurants.textContent = restaurants.length;
  elements.metrics.posts.textContent = pendingPosts;
  elements.metrics.reviews.textContent = pendingReviews;
  elements.metrics.onboarding.textContent = selected ? `${onboardingProgress(selected)}%` : "0%";
}

function taskCard(title, body, status) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.innerHTML = `
    <header>
      <h3>${escapeHtml(title)}</h3>
      <span class="pill">${escapeHtml(status)}</span>
    </header>
    <p>${escapeHtml(body).replaceAll("\n", "<br>")}</p>
    <div class="task-actions">
      <button type="button" data-action="advance">Avancar estat</button>
      <button type="button" data-action="delete">Eliminar</button>
    </div>
  `;
  return card;
}

function emptyTask(text) {
  const node = document.createElement("p");
  node.className = "muted";
  node.textContent = text;
  return node;
}

function createRestaurant(input) {
  return {
    id: createId(),
    name: String(input.name || "").trim(),
    area: String(input.area || "").trim(),
    cuisine: String(input.cuisine || "").trim(),
    mapsUrl: String(input.mapsUrl || "").trim(),
    contact: String(input.contact || "").trim(),
    status: "Lead",
    ticket: "",
    goal: "",
    tone: "",
    notes: "",
    checklist: {},
    posts: [],
    reviews: [],
    createdAt: new Date().toISOString()
  };
}

function selectedRestaurant() {
  return state.restaurants.find((restaurant) => restaurant.id === selectedId) || null;
}

function onboardingProgress(restaurant) {
  const done = checklistItems.filter((item) => restaurant.checklist[item]).length;
  return Math.round((done / checklistItems.length) * 100);
}

function buildPostBody(restaurant, template) {
  const goal = restaurant.goal || "aconseguir mes reserves i visites locals";
  return `${template.body} Adaptar a ${restaurant.cuisine} a ${restaurant.area}. Objectiu: ${goal}.`;
}

function buildReply(restaurant, rating, sentiment) {
  if (sentiment === "Negativa" || Number(rating) <= 2) {
    return `Hola, gracies per explicar-nos-ho. Ens sap greu que l'experiencia no hagi estat a l'alcada. Ens agradaria revisar el cas amb l'equip i entendre millor que va passar. Pots contactar directament amb ${restaurant.name} per mirar-ho amb detall.`;
  }

  if (sentiment === "Neutra" || Number(rating) === 3) {
    return `Gracies per visitar ${restaurant.name} i per deixar-nos la teva opinio. Prenem nota del que comentes per seguir millorant l'experiencia.`;
  }

  return `Moltes gracies per la ressenya i per visitar ${restaurant.name}. Ens alegra saber que vas gaudir de l'experiencia. T'esperem aviat de nou.`;
}

function buildReport(restaurant) {
  const posts = restaurant.posts;
  const reviews = restaurant.reviews;
  const publishedPosts = posts.filter((post) => post.status === "Publicat").length;
  const pendingPosts = posts.length - publishedPosts;
  const pendingReviews = reviews.filter((review) => review.status !== "Resposta publicada").length;

  return [
    `Informe mensual - ${restaurant.name}`,
    "",
    `Zona: ${restaurant.area}`,
    `Tipus de cuina: ${restaurant.cuisine}`,
    `Estat: ${restaurant.status}`,
    `Objectiu del pilot: ${restaurant.goal || "pendent de definir"}`,
    "",
    "1. Resum executiu",
    `Aquest mes s'ha treballat la fitxa de Google Maps amb focus en visibilitat local, contingut recurrent i gestio de reputacio. L'onboarding esta al ${onboardingProgress(restaurant)}%.`,
    "",
    "2. Accions fetes",
    `- Posts creats: ${posts.length}`,
    `- Posts publicats: ${publishedPosts}`,
    `- Posts pendents: ${pendingPosts}`,
    `- Ressenyes registrades: ${reviews.length}`,
    `- Ressenyes pendents de resposta: ${pendingReviews}`,
    "",
    "3. Recomanacions pel proper mes",
    "- Publicar un post setmanal orientat a reserves o plat destacat.",
    "- Revisar ressenyes dues vegades per setmana.",
    "- Afegir fotos noves de plats, sala i facana.",
    "- Confirmar horaris especials abans de festius.",
    "",
    "4. Notes internes",
    restaurant.notes || "Sense notes internes."
  ].join("\n");
}

function nextPostStatus(status) {
  const statuses = ["Idea", "Pendent aprovacio", "Aprovat", "Publicat"];
  const index = statuses.indexOf(status);
  return statuses[Math.min(index + 1, statuses.length - 1)] || "Idea";
}

function nextReviewStatus(status) {
  const statuses = ["Resposta suggerida", "Pendent aprovacio", "Resposta publicada"];
  const index = statuses.indexOf(status);
  return statuses[Math.min(index + 1, statuses.length - 1)] || "Resposta suggerida";
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { restaurants: [] };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
