document.addEventListener("DOMContentLoaded", () => {
  /*
   * ==================================================
   * MENÚ MÓVIL
   * ==================================================
   */

  const menuButton =
    document.querySelector(".menu-button");

  const nav =
    document.querySelector(".nav-links");

  function closeMenu() {
    if (!nav || !menuButton) {
      return;
    }

    nav.classList.remove("open");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    menuButton.setAttribute(
      "aria-label",
      "Abrir menú"
    );

    menuButton.innerHTML =
      '<i class="fa-solid fa-bars"></i>';
  }

  function toggleMenu() {
    if (!nav || !menuButton) {
      return;
    }

    const isOpen =
      nav.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuButton.setAttribute(
      "aria-label",
      isOpen
        ? "Cerrar menú"
        : "Abrir menú"
    );

    menuButton.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  }

  menuButton?.addEventListener(
    "click",
    toggleMenu
  );

  document
    .querySelectorAll(".nav-links a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeMenu
      );
    });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    }
  );


  /*
   * ==================================================
   * ANIMACIONES AL ENTRAR EN PANTALLA
   * ==================================================
   */

  const revealItems =
    document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );
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
   * ==================================================
   * CARRUSEL DE PREGUNTAS
   * Una tarjeta visible por vez
   * ==================================================
   */

  const questionTrack =
    document.querySelector("#questionTrack");

  const previousButton =
    document.querySelector("#questionPrev");

  const nextButton =
    document.querySelector("#questionNext");

  const questionCards = questionTrack
    ? Array.from(
        questionTrack.querySelectorAll(
          ".question-card"
        )
      )
    : [];

  /*
   * Buscar la tarjeta que ya tiene is-active
   * en el HTML.
   */
  let activeQuestionIndex =
    questionCards.findIndex((card) =>
      card.classList.contains("is-active")
    );

  /*
   * Si ninguna tiene is-active,
   * comenzar desde la primera.
   */
  if (activeQuestionIndex < 0) {
    activeQuestionIndex = 0;
  }

  function showQuestion(index) {
    if (questionCards.length === 0) {
      return;
    }

    /*
     * Mantener el índice entre:
     * 0 y la última pregunta.
     */
    activeQuestionIndex = Math.max(
      0,
      Math.min(
        index,
        questionCards.length - 1
      )
    );

    questionCards.forEach(
      (card, cardIndex) => {
        const isActive =
          cardIndex === activeQuestionIndex;

        card.classList.toggle(
          "is-active",
          isActive
        );

        card.setAttribute(
          "aria-hidden",
          String(!isActive)
        );

        /*
         * Evitar que el teclado entre
         * en textareas ocultos.
         */
        const note =
          card.querySelector(
            ".question-note"
          );

        if (note) {
          note.tabIndex =
            isActive ? 0 : -1;
        }
      }
    );

    if (previousButton) {
      previousButton.disabled =
        activeQuestionIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled =
        activeQuestionIndex ===
        questionCards.length - 1;
    }
  }

  previousButton?.addEventListener(
    "click",
    () => {
      showQuestion(
        activeQuestionIndex - 1
      );
    }
  );

  nextButton?.addEventListener(
    "click",
    () => {
      showQuestion(
        activeQuestionIndex + 1
      );
    }
  );

  /*
   * Mostrar la pregunta inicial.
   */
  showQuestion(activeQuestionIndex);


  /*
  * ==================================================
  * GUARDAR Y SINCRONIZAR RESPUESTAS
  * ==================================================
  */

  const storageKey =
    "mateo-web-question-notes";

  const questionNotes = Array.from(
    document.querySelectorAll(
      ".question-note"
    )
  );

  const messageFields = Array.from(
    document.querySelectorAll(
      ".js-contact-message"
    )
  );

  const automaticBlockPattern =
    /\n*Detalles seleccionados:\n(?:•[^\n]*(?:\n|$))*/;

  let isSynchronizingMessage = false;

  function removeAutomaticBlock(value) {
    return value
      .replace(
        automaticBlockPattern,
        ""
      )
      .trim();
  }

  let manualMessage =
    removeAutomaticBlock(
      messageFields[0]?.value ?? ""
    );

  function normalizeNote(value) {
    return value
      .replace(/\s+/g, " ")
      .trim();
  }

  /*
  * Guardar las respuestas en sessionStorage
  * y marcar visualmente las tarjetas respondidas.
  */
  function saveQuestionNotes() {
    const savedNotes = {};

    questionNotes.forEach((field) => {
      const topic =
        field.dataset.topic;

      const value =
        field.value.trim();

      if (topic && value) {
        savedNotes[topic] = value;
      }

      field
        .closest(".question-card")
        ?.classList.toggle(
          "has-note",
          Boolean(value)
        );
    });

    sessionStorage.setItem(
      storageKey,
      JSON.stringify(savedNotes)
    );
  }

  /*
  * Crear el bloque automático con las respuestas
  * y colocarlo en ambos formularios.
  */
  function updateContactMessages() {
    const selectedDetails =
      questionNotes
        .map((field) => {
          const topic =
            field.dataset.topic;

          const value =
            normalizeNote(field.value);

          if (!topic || !value) {
            return null;
          }

          return `• ${topic}: ${value}`;
        })
        .filter(Boolean);

    const automaticBlock =
      selectedDetails.length > 0
        ? (
            "Detalles seleccionados:\n" +
            selectedDetails.join("\n")
          )
        : "";

    const completeMessage = [
      manualMessage.trim(),
      automaticBlock
    ]
      .filter(Boolean)
      .join("\n\n");

    isSynchronizingMessage = true;

    messageFields.forEach((field) => {
      field.value = completeMessage;
    });

    isSynchronizingMessage = false;
  }

  function synchronizeQuestionNotes() {
    saveQuestionNotes();
    updateContactMessages();
  }

  /*
  * Recuperar las respuestas guardadas.
  */
  try {
    const storedNotes = JSON.parse(
      sessionStorage.getItem(
        storageKey
      ) ?? "{}"
    );

    questionNotes.forEach((field) => {
      const topic =
        field.dataset.topic;

      if (
        topic &&
        storedNotes[topic]
      ) {
        field.value =
          storedNotes[topic];
      }
    });
  } catch (error) {
    console.warn(
      "No fue posible recuperar las notas guardadas.",
      error
    );
  }

  /*
  * Actualizar los mensajes al escribir
  * en cualquiera de las tarjetas.
  */
  questionNotes.forEach((field) => {
    field.addEventListener(
      "input",
      synchronizeQuestionNotes
    );
  });

  /*
  * Al editar cualquiera de los dos mensajes,
  * conservar el texto manual y sincronizar el otro.
  */
  messageFields.forEach((field) => {
    field.addEventListener(
      "input",
      () => {
        if (isSynchronizingMessage) {
          return;
        }

        manualMessage =
          removeAutomaticBlock(
            field.value
          );

        updateContactMessages();
      }
    );
  });

  /*
  * Estado inicial.
  */
  synchronizeQuestionNotes();


  /*
   * ==================================================
   * COMPARADOR ANTES / DESPUÉS
   * ==================================================
   */

  const webComparison =
    document.querySelector(
      "#webComparison"
    );

  const webComparisonRange =
    document.querySelector(
      "#webComparisonRange"
    );

  function updateWebComparison() {
    if (
      !webComparison ||
      !webComparisonRange
    ) {
      return;
    }

    const percentage =
      Number(
        webComparisonRange.value
      );

    webComparison.style.setProperty(
      "--position",
      `${percentage}%`
    );
  }

  webComparisonRange?.addEventListener(
    "input",
    updateWebComparison
  );

  updateWebComparison();



  /*
   * ==================================================
   * AÑO AUTOMÁTICO
   * ==================================================
   */

  const yearElement =
    document.querySelector("#year");

  if (yearElement) {
    yearElement.textContent =
      String(
        new Date().getFullYear()
      );
  }

  /*
  * ==================================================
  * NAVEGACIÓN RÁPIDA FLOTANTE
  * ==================================================
  */

  const quickNav =
    document.querySelector("#quickNav");

  const quickNavToggle =
    document.querySelector("#quickNavToggle");

  function setQuickNav(open) {
    if (!quickNav || !quickNavToggle) {
      return;
    }

    quickNav.classList.toggle(
      "is-open",
      open
    );

    quickNavToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    quickNavToggle.setAttribute(
      "aria-label",
      open
        ? "Cerrar navegación rápida"
        : "Abrir navegación rápida"
    );

    quickNavToggle.innerHTML = open
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-thumbtack"></i>';
  }

  quickNavToggle?.addEventListener(
    "click",
    () => {
      const isOpen =
        quickNav?.classList.contains(
          "is-open"
        ) ?? false;

      setQuickNav(!isOpen);
    }
  );

  quickNav
    ?.querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        () => setQuickNav(false)
      );
    });

  document.addEventListener(
    "click",
    (event) => {
      if (
        quickNav &&
        !quickNav.contains(event.target)
      ) {
        setQuickNav(false);
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        setQuickNav(false);
      }
    }
  );

  /*
  * ==================================================
  * ENVIAR CUALQUIERA DE LOS DOS FORMULARIOS
  * ==================================================
  */

  const whatsappForms =
    document.querySelectorAll(
      ".js-whatsapp-form"
    );

  whatsappForms.forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const data =
          new FormData(form);

        const name = String(
          data.get("name") ?? ""
        ).trim();

        const company = String(
          data.get("company") ?? ""
        ).trim();

        const interest = String(
          data.get("interest") ?? ""
        ).trim();

        const message = String(
          data.get("message") ?? ""
        ).trim();

        if (!message) {
          alert(
            "Responde al menos una pregunta o escribe un mensaje."
          );

          return;
        }

        const text = [
          name
            ? `Hola Mateo, soy ${name}.`
            : "Hola Mateo.",
          company
            ? `Empresa: ${company}.`
            : "",
          interest
            ? `Área de interés: ${interest}.`
            : "",
          "",
          message
        ]
          .filter(Boolean)
          .join("\n");

        const whatsappUrl =
          "https://wa.me/526143497994" +
          `?text=${encodeURIComponent(text)}`;

        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  });

});
