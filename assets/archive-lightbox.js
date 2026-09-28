(function () {
  "use strict";

  var COPY = {
    en: {
      close: "Close image",
      open: "Open full-size image",
      dialog: "Full-size image",
    },
    es: {
      close: "Cerrar imagen",
      open: "Abrir imagen a tamaño completo",
      dialog: "Imagen a tamaño completo",
    },
    fr: {
      close: "Fermer l’image",
      open: "Ouvrir l’image en grand format",
      dialog: "Image en grand format",
    },
    it: {
      close: "Chiudi immagine",
      open: "Apri l’immagine a grandezza intera",
      dialog: "Immagine a grandezza intera",
    },
    de: {
      close: "Bild schließen",
      open: "Bild in voller Größe öffnen",
      dialog: "Bild in voller Größe",
    },
  };

  function locale() {
    var code = String(document.documentElement.lang || "en")
      .toLowerCase()
      .split(/[-_]/)[0];
    return COPY[code] ? code : "en";
  }

  function imageTitle(image) {
    var explicit = String(image.dataset.lightboxCaption || "").trim();
    if (explicit) return explicit;

    var scope = image.closest(
      ".timeline-entry, .featured-work, .artwork-entry, .dog-variation-card, .image-study, .process-studies-grid figure, .project-sheet",
    );
    if (scope) {
      var heading = scope.querySelector("h1, h2, h3");
      if (heading && heading.textContent.trim()) return heading.textContent.trim();

      var caption = scope.querySelector("figcaption strong, figcaption");
      if (caption && caption.textContent.trim()) return caption.textContent.trim();
    }

    return image.alt || "";
  }

  function imageSource(image) {
    var explicit = String(image.dataset.lightboxSrc || "").trim();
    if (explicit) return new URL(explicit, document.baseURI).href;
    return image.currentSrc || image.src;
  }

  function init() {
    var images = Array.prototype.slice.call(
      document.querySelectorAll("img[data-lightbox]"),
    );
    if (!images.length || typeof HTMLDialogElement === "undefined") return;

    var dialog = document.createElement("dialog");
    dialog.id = "archive-lightbox";
    dialog.className = "archive-lightbox";
    dialog.setAttribute("data-i18n-skip", "");

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "archive-lightbox__close";
    closeButton.textContent = "×";

    var figure = document.createElement("figure");
    figure.className = "archive-lightbox__figure";

    var media = document.createElement("div");
    media.className = "archive-lightbox__media";

    var enlarged = document.createElement("img");
    enlarged.className = "archive-lightbox__image";

    var caption = document.createElement("figcaption");
    caption.className = "archive-lightbox__caption";

    media.appendChild(enlarged);
    figure.appendChild(media);
    figure.appendChild(caption);
    dialog.appendChild(closeButton);
    dialog.appendChild(figure);
    document.body.appendChild(dialog);

    var activeTrigger = null;

    function updateLabels() {
      var copy = COPY[locale()];
      closeButton.setAttribute("aria-label", copy.close);
      dialog.setAttribute("aria-label", copy.dialog);
      images.forEach(function (image) {
        var title = imageTitle(image);
        image.setAttribute(
          "aria-label",
          title ? copy.open + ": " + title : copy.open,
        );
      });
    }

    function open(image) {
      activeTrigger = image;
      enlarged.src = imageSource(image);
      enlarged.alt = image.alt || "";
      caption.textContent = imageTitle(image);
      media.classList.toggle(
        "archive-lightbox__media--red-night-woman",
        image.dataset.lightboxCrop === "red-night-woman",
      );
      dialog.showModal();
      closeButton.focus();
    }

    images.forEach(function (image) {
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute("aria-controls", dialog.id);
      image.addEventListener("click", function () {
        open(image);
      });
      image.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open(image);
      });
    });

    closeButton.addEventListener("click", function () {
      dialog.close();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", function () {
      enlarged.removeAttribute("src");
      if (activeTrigger && document.contains(activeTrigger)) {
        activeTrigger.focus();
      }
      activeTrigger = null;
    });

    window.addEventListener("enalc:localechange", function () {
      updateLabels();
      if (dialog.open && activeTrigger) {
        enlarged.alt = activeTrigger.alt || "";
        caption.textContent = imageTitle(activeTrigger);
      }
    });

    updateLabels();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
