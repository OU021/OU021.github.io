(function () {
  "use strict";

  const root = document.documentElement;
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function readStoredTheme() {
    try {
      const value = window.localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem("theme", theme);
    } catch (error) {
      // The selected theme still applies for this visit if storage is unavailable.
    }
  }

  const storedTheme = readStoredTheme();
  if (storedTheme) {
    root.dataset.theme = storedTheme;
  }

  function currentTheme() {
    return root.dataset.theme || (darkModeQuery.matches ? "dark" : "light");
  }

  function syncThemeControls() {
    const theme = currentTheme();
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      const label = button.querySelector("[data-theme-label]");
      button.setAttribute("aria-label", "Switch to " + nextTheme + " theme");
      button.setAttribute("aria-pressed", String(theme === "dark"));
      if (label) {
        label.textContent = nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1);
      }
    });
  }

  function initializeTheme() {
    syncThemeControls();

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        const nextTheme = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        writeStoredTheme(nextTheme);
        syncThemeControls();
      });
    });

    darkModeQuery.addEventListener("change", function () {
      if (!readStoredTheme()) {
        root.removeAttribute("data-theme");
        syncThemeControls();
      }
    });
  }

  function initializeMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-site-menu]");
    const mobileQuery = window.matchMedia("(max-width: 760px)");

    if (!toggle || !menu) {
      return;
    }

    const toggleLabel = toggle.querySelector(".sr-only");

    function setMenu(open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open && mobileQuery.matches);
      if (toggleLabel) {
        toggleLabel.textContent = open ? "Close navigation" : "Open navigation";
      }
      if (!open && returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true", false);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileQuery.matches) {
          setMenu(false, false);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (
        mobileQuery.matches &&
        toggle.getAttribute("aria-expanded") === "true" &&
        !menu.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setMenu(false, false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false, true);
      }
    });

    mobileQuery.addEventListener("change", function (event) {
      if (!event.matches) {
        setMenu(false, false);
      }
    });
  }

  function initializeLightbox() {
    const items = Array.from(document.querySelectorAll("[data-gallery-item]"));
    const dialog = document.querySelector("[data-lightbox]");

    if (!items.length || !dialog) {
      return;
    }

    const lightboxImage = dialog.querySelector("[data-lightbox-image]");
    const lightboxCaption = dialog.querySelector("[data-lightbox-caption]");
    const lightboxCount = dialog.querySelector("[data-lightbox-count]");
    const closeButton = dialog.querySelector("[data-lightbox-close]");
    const previousButton = dialog.querySelector("[data-lightbox-prev]");
    const nextButton = dialog.querySelector("[data-lightbox-next]");
    let currentIndex = 0;
    let activeTrigger = null;
    let pointerStartX = null;

    function normalizeIndex(index) {
      return (index + items.length) % items.length;
    }

    function preload(index) {
      const item = items[normalizeIndex(index)];
      const image = new Image();
      image.src = item.dataset.full;
    }

    function showItem(index) {
      currentIndex = normalizeIndex(index);
      const item = items[currentIndex];
      const thumbnail = item.querySelector("img");
      const caption = item.dataset.caption || "Photograph";

      lightboxImage.src = item.dataset.full;
      lightboxImage.alt = thumbnail ? thumbnail.alt : caption;
      if (thumbnail) {
        lightboxImage.width = Number(thumbnail.getAttribute("width"));
        lightboxImage.height = Number(thumbnail.getAttribute("height"));
      }
      lightboxCaption.textContent = caption;
      lightboxCount.textContent = String(currentIndex + 1);

      preload(currentIndex - 1);
      preload(currentIndex + 1);
    }

    function openLightbox(index, trigger) {
      if (typeof dialog.showModal !== "function") {
        window.location.href = items[index].dataset.full;
        return;
      }

      activeTrigger = trigger;
      showItem(index);
      dialog.showModal();
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    }

    function closeLightbox() {
      if (dialog.open) {
        dialog.close();
      }
    }

    items.forEach(function (item, index) {
      item.addEventListener("click", function () {
        openLightbox(index, item);
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    previousButton.addEventListener("click", function () {
      showItem(currentIndex - 1);
    });
    nextButton.addEventListener("click", function () {
      showItem(currentIndex + 1);
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeLightbox();
      }
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
      if (activeTrigger) {
        activeTrigger.focus();
      }
      activeTrigger = null;
    });

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeLightbox();
    });

    document.addEventListener(
      "keydown",
      function (event) {
        if (dialog.open && event.key === "Escape") {
          event.preventDefault();
          closeLightbox();
        }
      },
      true
    );

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showItem(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showItem(currentIndex + 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }
    });

    dialog.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" && !event.target.closest("button")) {
        pointerStartX = event.clientX;
      }
    });

    dialog.addEventListener("pointerup", function (event) {
      if (pointerStartX === null) {
        return;
      }

      const distance = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(distance) < 50) {
        return;
      }
      showItem(distance > 0 ? currentIndex - 1 : currentIndex + 1);
    });

    dialog.addEventListener("pointercancel", function () {
      pointerStartX = null;
    });
  }

  function initialize() {
    initializeTheme();
    initializeMenu();
    initializeLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
