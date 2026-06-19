document.addEventListener("DOMContentLoaded", () => {
  /*
   * Menú móvil
   */
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav-links");

  function closeMenu() {
    if (!nav || !menuButton) return;

    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }

  function toggleMenu() {
    if (!nav || !menuButton) return;

    const isOpen = nav.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú" : "Abrir menú"
    );

    menuButton.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  }

  menuButton?.addEventListener("click", toggleMenu);

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  /*
   * Animaciones al entrar en pantalla
   */
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12
      }
    );

    revealItems.forEach((item) => {
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => {
      item.classList.add("visible");
    });
  }

  /*
   * Carrusel de preguntas
   */
  const questionTrack = document.querySelector("#questionTrack");
  const previousButton = document.querySelector("#questionPrev");
  const nextButton = document.querySelector("#questionNext");

  function getQuestionScrollAmount() {
  if (!questionTrack) {
    return 0;
  }

  return questionTrack.clientWidth;
}

  function updateCarouselButtons() {
    if (!questionTrack || !previousButton || !nextButton) return;

    const maximumScroll =
      questionTrack.scrollWidth - questionTrack.clientWidth;

    previousButton.disabled = questionTrack.scrollLeft <= 4;
    nextButton.disabled =
      questionTrack.scrollLeft >= maximumScroll - 4;
  }

  previousButton?.addEventListener("click", () => {
    questionTrack?.scrollBy({
      left: -getQuestionScrollAmount(),
      behavior: "smooth"
    });
  });

  nextButton?.addEventListener("click", () => {
    questionTrack?.scrollBy({
      left: getQuestionScrollAmount(),
      behavior: "smooth"
    });
  });

  questionTrack?.addEventListener("scroll", updateCarouselButtons);

  window.addEventListener("resize", updateCarouselButtons);

  updateCarouselButtons();

  /*
   * Guardar lo escrito en las tarjetas
   * y agregarlo al mensaje final
   */
  const storageKey = "mateo-web-question-notes";

  const questionNotes = Array.from(
    document.querySelectorAll(".question-note")
  );

  const messageField = document.querySelector(
    '#contactForm textarea[name="message"]'
  );

  const automaticBlockPattern =
    /\n*Detalles seleccionados:\n(?:•[^\n]*(?:\n|$))*/;

  let isSynchronizingMessage = false;

  function removeAutomaticBlock(value) {
    return value
      .replace(automaticBlockPattern, "")
      .trim();
  }

  let manualMessage = removeAutomaticBlock(
    messageField?.value ?? ""
  );

  function normalizeNote(value) {
    return value
      .replace(/\s+/g, " ")
      .trim();
  }

  function saveQuestionNotes() {
    const savedNotes = {};

    questionNotes.forEach((field) => {
      const topic = field.dataset.topic;
      const value = field.value.trim();

      if (topic && value) {
        savedNotes[topic] = value;
      }

      field
        .closest(".question-card")
        ?.classList.toggle("has-note", Boolean(value));
    });

    sessionStorage.setItem(
      storageKey,
      JSON.stringify(savedNotes)
    );
  }

  function updateContactMessage() {
    const selectedDetails = questionNotes
      .map((field) => {
        const value = normalizeNote(field.value);
        const topic = field.dataset.topic;

        if (!topic || !value) return null;

        return `• ${topic}: ${value}`;
      })
      .filter(Boolean);

    const automaticBlock = selectedDetails.length
      ? `Detalles seleccionados:\n${selectedDetails.join("\n")}`
      : "";

    if (!messageField) return;

    isSynchronizingMessage = true;

    messageField.value = [
      manualMessage.trim(),
      automaticBlock
    ]
      .filter(Boolean)
      .join("\n\n");

    isSynchronizingMessage = false;
  }

  function synchronizeQuestionNotes() {
    saveQuestionNotes();
    updateContactMessage();
  }

  try {
    const storedNotes = JSON.parse(
      sessionStorage.getItem(storageKey) ?? "{}"
    );

    questionNotes.forEach((field) => {
      const topic = field.dataset.topic;

      if (topic && storedNotes[topic]) {
        field.value = storedNotes[topic];
      }
    });
  } catch (error) {
    console.warn(
      "No fue posible recuperar las notas guardadas.",
      error
    );
  }

  questionNotes.forEach((field) => {
    field.addEventListener("input", synchronizeQuestionNotes);
  });

  messageField?.addEventListener("input", () => {
    if (isSynchronizingMessage) return;

    manualMessage = removeAutomaticBlock(messageField.value);
    updateContactMessage();
  });

  synchronizeQuestionNotes();

  const webComparison =
  document.querySelector("#webComparison");

const webComparisonRange =
  document.querySelector("#webComparisonRange");


function updateWebComparison() {
  if (!webComparison || !webComparisonRange) {
    return;
  }

  const percentage =
    Number(webComparisonRange.value);

  webComparison.style.setProperty(
    "--position",
    `${percentage}%`
  );
}


webComparisonRange?.addEventListener(
  "input",
  updateWebComparison
);


/*
 * Colocar inicialmente el comparador en 50%.
 */
updateWebComparison();

  /*
   * Formulario hacia WhatsApp
   */
  const contactForm = document.querySelector("#contactForm");

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const interest = String(data.get("interest") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !interest || !message) {
      alert("Completa los campos obligatorios.");
      return;
    }

    const text = [
      `Hola Mateo, soy ${name}.`,
      company ? `Empresa: ${company}.` : "",
      `Área de interés: ${interest}.`,
      "",
      message
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");

    const whatsappUrl =
      `https://wa.me/526143497994?text=${encodeURIComponent(text)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  });

  /*
   * Año automático
   */
  const yearElement = document.querySelector("#year");

  if (yearElement) {
    yearElement.textContent = String(
      new Date().getFullYear()
    );
  }
});