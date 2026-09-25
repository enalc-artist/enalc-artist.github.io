(function () {
  "use strict";

  var SUPPORTED_LOCALES = ["en", "es", "fr", "it", "de"];
  var STORAGE_KEY = "enalc-locale";
  var TRANSLATION_FILES = [
    "i18n-en-es.json",
    "i18n-fr-it.json",
    "i18n-de.json",
    "i18n-extra.json",
    "i18n-v8-archive.json",
    "i18n-new-works.json",
  ];
  var TRANSLATABLE_ATTRIBUTES = [
    "alt",
    "aria-label",
    "title",
    "placeholder",
  ];
  var SKIP_SELECTOR = [
    "script",
    "style",
    "noscript",
    "template",
    "studio",
    "#studio",
    ".studio",
    ".studio-page",
    ".studio-shell",
    "[data-studio]",
    "[data-i18n-skip]",
  ].join(",");

  var runtimeScript =
    document.currentScript ||
    document.querySelector('script[src$="/assets/site-runtime.js"], script[src$="assets/site-runtime.js"]');
  var assetBase = runtimeScript && runtimeScript.src
    ? new URL(".", runtimeScript.src)
    : new URL("assets/", document.baseURI);
  var catalog = new Map();
  var translations = Object.create(null);
  var sourceText = new WeakMap();
  var sourceAttributes = new WeakMap();
  var translatedContainers = new WeakSet();
  var editableValues = Object.create(null);
  var locale = readStoredLocale();
  var languageSelect = null;

  document.documentElement.lang = locale;

  SUPPORTED_LOCALES.forEach(function (code) {
    translations[code] = new Map();
  });

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .normalize("NFC")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeLocale(value) {
    var code = String(value || "").toLowerCase().split(/[-_]/)[0];
    return SUPPORTED_LOCALES.indexOf(code) === -1 ? "en" : code;
  }

  function readStoredLocale() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeLocale(stored) : "en";
    } catch (_error) {
      return "en";
    }
  }

  function storeLocale(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (_error) {
      // The site remains usable when storage is unavailable or blocked.
    }
  }

  function isTranslationLeaf(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value.es === "string" &&
        SUPPORTED_LOCALES.some(function (code) {
          return code !== "es" && typeof value[code] === "string";
        }),
    );
  }

  function collectTranslations(value) {
    if (!value || typeof value !== "object") return;

    if (isTranslationLeaf(value)) {
      var source = normalizeText(value.es);
      if (!source) return;
      var entry = catalog.get(source) || {};
      SUPPORTED_LOCALES.forEach(function (code) {
        if (typeof value[code] === "string") {
          entry[code] = value[code];
        }
      });
      entry.es = value.es;
      catalog.set(source, entry);
      return;
    }

    Object.keys(value).forEach(function (key) {
      if (key !== "_meta") collectTranslations(value[key]);
    });
  }

  function buildTranslationIndexes() {
    SUPPORTED_LOCALES.forEach(function (code) {
      translations[code].clear();
    });

    catalog.forEach(function (entry) {
      var aliases = [entry.es, entry.en]
        .filter(function (value) {
          return typeof value === "string" && normalizeText(value);
        })
        .map(normalizeText);

      SUPPORTED_LOCALES.forEach(function (code) {
        if (typeof entry[code] !== "string") return;
        aliases.forEach(function (alias) {
          translations[code].set(alias, entry[code]);
        });
      });
    });
  }

  function loadJson(url) {
    return fetch(url, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function loadTranslations() {
    return Promise.allSettled(
      TRANSLATION_FILES.map(function (filename) {
        return loadJson(new URL(filename, assetBase));
      }),
    ).then(function (results) {
      results.forEach(function (result) {
        if (result.status === "fulfilled") collectTranslations(result.value);
      });
      buildTranslationIndexes();
    });
  }

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function mergeContent(base, override) {
    var output = {};

    if (isPlainObject(base)) {
      Object.keys(base).forEach(function (key) {
        output[key] = isPlainObject(base[key])
          ? mergeContent(base[key], {})
          : base[key];
      });
    }

    if (isPlainObject(override)) {
      Object.keys(override).forEach(function (key) {
        if (isBlank(override[key]) && !isBlank(output[key])) return;
        output[key] =
          isPlainObject(override[key]) && isPlainObject(output[key])
            ? mergeContent(output[key], override[key])
            : override[key];
      });
    }

    return output;
  }

  function editableDefaults() {
    var exposed = window.ENALC_EDITABLE_CONTENT;
    if (!isPlainObject(exposed)) return {};
    if (isPlainObject(exposed.defaults)) return exposed.defaults;
    if (isPlainObject(exposed.EDITABLE_CONTENT_DEFAULTS)) {
      return exposed.EDITABLE_CONTENT_DEFAULTS;
    }
    return exposed;
  }

  function fetchPublicContent() {
    var controller = typeof AbortController === "function"
      ? new AbortController()
      : null;
    var timeout = controller
      ? window.setTimeout(function () {
          controller.abort();
        }, 4000)
      : null;
    var options = {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    };

    if (controller) options.signal = controller.signal;

    return fetch("/api/content", options)
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        var remote = isPlainObject(payload) && isPlainObject(payload.content)
          ? payload.content
          : {};
        return mergeContent(editableDefaults(), remote);
      })
      .catch(function () {
        return mergeContent(editableDefaults(), {});
      })
      .finally(function () {
        if (timeout !== null) window.clearTimeout(timeout);
      });
  }

  function valueAtPath(object, path) {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce(function (value, key) {
        return value != null && Object.prototype.hasOwnProperty.call(value, key)
          ? value[key]
          : undefined;
      }, object);
  }

  function valueForLocale(value, selectedLocale) {
    if (!isPlainObject(value)) return value;
    if (typeof value[selectedLocale] === "string") return value[selectedLocale];
    if (typeof value.es === "string") return value.es;
    if (typeof value.value === "string") return value.value;
    return undefined;
  }

  function isBlank(value) {
    return value == null || (typeof value === "string" && !value.trim());
  }

  function shouldSkip(element) {
    return !element || Boolean(element.closest(SKIP_SELECTOR));
  }

  function shouldSkipTranslation(element) {
    return shouldSkip(element) || Boolean(element.closest("[data-edit-key]"));
  }

  function rememberAttribute(element, attribute, value) {
    var remembered = sourceAttributes.get(element);
    if (!remembered) {
      remembered = Object.create(null);
      sourceAttributes.set(element, remembered);
    }
    if (!Object.prototype.hasOwnProperty.call(remembered, attribute)) {
      remembered[attribute] = value;
    }
    return remembered[attribute];
  }

  function findTranslation(value, selectedLocale) {
    var normalized = normalizeText(value);
    var map = translations[selectedLocale];
    var translated = map.get(normalized);
    if (typeof translated === "string") return translated;

    var withoutTerminalPeriod = normalized.replace(/\.$/, "");
    var alternate = withoutTerminalPeriod === normalized
      ? normalized + "."
      : withoutTerminalPeriod;
    return map.get(alternate);
  }

  function translateString(value, selectedLocale) {
    var original = String(value == null ? "" : value);
    var translated = findTranslation(original, selectedLocale);
    return typeof translated === "string" ? translated : original;
  }

  function translateTextNode(node, selectedLocale) {
    var parent = node.parentElement;
    if (!parent || shouldSkipTranslation(parent) || !normalizeText(node.nodeValue)) {
      return;
    }

    if (!sourceText.has(node)) sourceText.set(node, node.nodeValue);
    var original = sourceText.get(node);
    var translated = findTranslation(original, selectedLocale);
    if (typeof translated !== "string") {
      node.nodeValue = original;
      return;
    }

    var leading = String(original).match(/^\s*/)[0];
    var trailing = String(original).match(/\s*$/)[0];
    node.nodeValue = leading + translated + trailing;
  }

  function translateFragmentedText(root, selectedLocale) {
    var elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
    Array.prototype.push.apply(elements, root.querySelectorAll("*"));

    elements.forEach(function (element) {
      if (
        shouldSkipTranslation(element) ||
        element.childElementCount !== 0 ||
        (element.childNodes.length < 2 && !translatedContainers.has(element))
      ) {
        return;
      }

      if (!sourceText.has(element)) sourceText.set(element, element.textContent);
      var original = sourceText.get(element);
      var translated = findTranslation(original, selectedLocale);
      if (typeof translated !== "string") {
        if (translatedContainers.has(element)) element.textContent = original;
        return;
      }

      element.textContent = translated;
      translatedContainers.add(element);
    });
  }

  function translateAttributes(root, selectedLocale) {
    var elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
    Array.prototype.push.apply(elements, root.querySelectorAll("*"));

    elements.forEach(function (element) {
      if (shouldSkipTranslation(element)) return;
      TRANSLATABLE_ATTRIBUTES.forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        var original = rememberAttribute(
          element,
          attribute,
          element.getAttribute(attribute),
        );
        element.setAttribute(attribute, translateString(original, selectedLocale));
      });
    });
  }

  function translateTree(root, selectedLocale) {
    if (
      !root ||
      shouldSkipTranslation(
        root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement,
      )
    ) {
      return;
    }

    translateFragmentedText(root, selectedLocale);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return node.parentElement &&
          !translatedContainers.has(node.parentElement) &&
          !shouldSkipTranslation(node.parentElement)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    var node;
    while ((node = walker.nextNode())) translateTextNode(node, selectedLocale);
    translateAttributes(root, selectedLocale);
  }

  function setEditableElementValue(element, value) {
    var attribute = element.getAttribute("data-edit-attr");
    if (attribute) {
      element.setAttribute(attribute, value);
      var remembered = sourceAttributes.get(element);
      if (remembered) remembered[attribute] = value;
      return;
    }

    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) {
      element.value = value;
      return;
    }

    element.textContent = value;
    if (element.firstChild) sourceText.set(element.firstChild, value);
  }

  function applyEditableContent(selectedLocale) {
    document.querySelectorAll("[data-edit-key]").forEach(function (element) {
      if (shouldSkip(element)) return;
      var key = element.getAttribute("data-edit-key");
      var value = valueForLocale(valueAtPath(editableValues, key), selectedLocale);
      var fallback = element.getAttribute("data-edit-fallback");

      if (isBlank(value)) value = fallback;
      if (isBlank(value)) {
        if (!sourceText.has(element)) sourceText.set(element, element.textContent);
        value = sourceText.get(element);
      }
      if (isBlank(value)) return;

      var rendered = translateString(String(value), selectedLocale);
      setEditableElementValue(element, rendered);
    });
  }

  function translateMetadata(selectedLocale) {
    var titleElement = document.querySelector("head > title");
    if (titleElement) {
      if (!sourceText.has(titleElement)) sourceText.set(titleElement, titleElement.textContent);
      document.title = translateString(sourceText.get(titleElement), selectedLocale);
    }

    var description = document.querySelector('meta[name="description"]');
    if (description) {
      var original = rememberAttribute(
        description,
        "content",
        description.getAttribute("content") || "",
      );
      description.setAttribute("content", translateString(original, selectedLocale));
    }
  }

  function updateSelect(selectedLocale) {
    languageSelect = document.getElementById("language-select");
    if (languageSelect && languageSelect.value !== selectedLocale) {
      languageSelect.value = selectedLocale;
    }
  }

  function applyLocale(selectedLocale) {
    locale = normalizeLocale(selectedLocale);
    document.documentElement.lang = locale;
    applyEditableContent(locale);
    if (document.body) translateTree(document.body, locale);
    translateMetadata(locale);
    updateSelect(locale);
    window.dispatchEvent(
      new CustomEvent("enalc:localechange", { detail: { locale: locale } }),
    );
  }

  function setLocale(selectedLocale, persist) {
    locale = normalizeLocale(selectedLocale);
    if (persist !== false) storeLocale(locale);
    applyLocale(locale);
    return locale;
  }

  function bindLanguageSelect() {
    languageSelect = document.getElementById("language-select");
    if (!languageSelect || languageSelect.dataset.enalcLocaleBound === "true") {
      return;
    }

    languageSelect.dataset.enalcLocaleBound = "true";
    languageSelect.value = locale;
    languageSelect.addEventListener("change", function (event) {
      setLocale(event.target.value, true);
    });
  }

  function domReady() {
    if (document.readyState === "loading") {
      return new Promise(function (resolve) {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
      });
    }
    return Promise.resolve();
  }

  var ready = domReady()
    .then(function () {
      bindLanguageSelect();
      return Promise.all([loadTranslations(), fetchPublicContent()]);
    })
    .then(function (results) {
      editableValues = results[1];
      applyLocale(locale);
      document.documentElement.classList.add("i18n-ready");
      window.dispatchEvent(
        new CustomEvent("enalc:i18n-ready", { detail: { locale: locale } }),
      );
      return locale;
    })
    .catch(function () {
      document.documentElement.lang = locale;
      updateSelect(locale);
      return locale;
    });

  window.ENALC_I18N = {
    getLocale: function () {
      return locale;
    },
    setLocale: function (selectedLocale) {
      return setLocale(selectedLocale, true);
    },
    translate: function (value, selectedLocale) {
      return translateString(value, normalizeLocale(selectedLocale || locale));
    },
    ready: ready,
  };
})();
