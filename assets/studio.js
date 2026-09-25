const { defaults: EDITABLE_CONTENT_DEFAULTS, fields: EDITABLE_CONTENT_FIELDS } =
  window.ENALC_EDITABLE_CONTENT;

const API_URL = "/api/content";
const SESSION_TOKEN_KEY = "enalc-studio-token";

const accessForm = document.querySelector("#access-form");
const tokenInput = document.querySelector("#access-token");
const forgetTokenButton = document.querySelector("#forget-token");
const contentForm = document.querySelector("#content-form");
const contentFields = document.querySelector("#content-fields");
const saveButton = document.querySelector("#save-content");
const reloadButton = document.querySelector("#reload-content");
const statusElement = document.querySelector("#studio-status");
let contentReady = false;

const fieldId = (groupKey, fieldKey) =>
  `content-${groupKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-${fieldKey}`;

const readSessionToken = () => {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const writeSessionToken = (token) => {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
};

const clearSessionToken = () => {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // The token input is still cleared when session storage is unavailable.
  }
};

const setStatus = (message, state = "info") => {
  statusElement.textContent = message;
  statusElement.dataset.state = state;
};

const setBusy = (busy) => {
  contentForm.setAttribute("aria-busy", String(busy));
  saveButton.disabled = busy || !contentReady;
  reloadButton.disabled = busy;
};

const getKnownValue = (source, groupKey, fieldKey) => {
  const group = source?.[groupKey];
  if (!group || typeof group !== "object") {
    return undefined;
  }

  return group[fieldKey];
};

const mergeWithDefaults = (published) => {
  const merged = {};

  for (const group of EDITABLE_CONTENT_FIELDS) {
    merged[group.key] = {};

    for (const field of group.fields) {
      const publishedValue = getKnownValue(published, group.key, field.key);
      const defaultValue = getKnownValue(
        EDITABLE_CONTENT_DEFAULTS,
        group.key,
        field.key,
      );

      if (publishedValue !== undefined) {
        merged[group.key][field.key] = publishedValue;
      } else if (defaultValue !== undefined) {
        merged[group.key][field.key] = defaultValue;
      }
    }
  }

  return merged;
};

const createField = (group, field, value) => {
  const row = document.createElement("div");
  const label = document.createElement("label");
  const input = document.createElement("input");
  const hint = document.createElement("small");
  const id = fieldId(group.key, field.key);

  row.className = "field-row";
  label.htmlFor = id;
  label.textContent = field.label;

  input.id = id;
  input.name = `${group.key}.${field.key}`;
  input.dataset.group = group.key;
  input.dataset.field = field.key;
  input.value = value === undefined ? "" : String(value);
  input.autocomplete = "off";

  if (field.type === "year") {
    input.type = "number";
    input.inputMode = "numeric";
    input.min = String(field.min);
    input.max = String(field.max);
    input.step = "1";
    hint.textContent = `Opcional; ${field.min}–${field.max}. Déjalo vacío si aún no está confirmado.`;
  } else {
    input.type = "text";
    input.maxLength = field.maxLength;
    hint.textContent = `Hasta ${field.maxLength} caracteres.`;
  }

  hint.className = "field-hint";
  row.append(label, input, hint);
  return row;
};

const renderFields = (content) => {
  const fragment = document.createDocumentFragment();

  for (const group of EDITABLE_CONTENT_FIELDS) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const description = document.createElement("p");

    fieldset.className = "content-group";
    legend.textContent = group.label;
    description.className = "group-description";
    description.textContent = group.description;
    fieldset.append(legend, description);

    for (const field of group.fields) {
      fieldset.append(
        createField(group, field, getKnownValue(content, group.key, field.key)),
      );
    }

    fragment.append(fieldset);
  }

  contentFields.replaceChildren(fragment);
};

const collectContent = () => {
  const content = {};

  for (const group of EDITABLE_CONTENT_FIELDS) {
    const values = {};

    for (const field of group.fields) {
      const input = document.querySelector(`#${fieldId(group.key, field.key)}`);
      const value = input.value.trim();

      if (!value) {
        continue;
      }

      values[field.key] = field.type === "year" ? Number(value) : value;
    }

    if (Object.keys(values).length) {
      content[group.key] = values;
    }
  }

  return content;
};

const readJsonResponse = async (response) => {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `La petición ha fallado (${response.status}).`);
  }

  if (!payload || typeof payload.content !== "object" || payload.content === null) {
    throw new Error("El servidor ha devuelto una respuesta inesperada.");
  }

  return payload;
};

const loadPublishedContent = async () => {
  contentReady = false;
  setBusy(true);
  setStatus("Cargando los datos publicados…");

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await readJsonResponse(response);
    renderFields(mergeWithDefaults(payload.content));
    contentReady = true;
    setStatus("Datos publicados cargados.", "success");
  } catch (error) {
    renderFields(mergeWithDefaults({}));
    setStatus(error instanceof Error ? error.message : "No se han podido cargar los datos.", "error");
  } finally {
    setBusy(false);
  }
};

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();

  if (!token) {
    setStatus("Introduce la clave de acceso antes de guardar.", "error");
    tokenInput.focus();
    return;
  }

  if (!writeSessionToken(token)) {
    setStatus("El navegador impide conservar la clave durante esta sesión.", "error");
    return;
  }

  setStatus("Clave guardada para esta sesión del navegador.", "success");
});

forgetTokenButton.addEventListener("click", () => {
  clearSessionToken();
  tokenInput.value = "";
  tokenInput.focus();
  setStatus("Clave olvidada.", "success");
});

reloadButton.addEventListener("click", loadPublishedContent);

contentForm.addEventListener("input", () => {
  setStatus("Hay cambios sin guardar.");
});

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contentReady) {
    setStatus("Reload the published values successfully before saving.", "error");
    return;
  }

  if (!contentForm.reportValidity()) {
    setStatus("Revisa el campo señalado antes de guardar.", "error");
    return;
  }

  const token = readSessionToken();
  if (!token) {
    setStatus("Introduce y activa la clave de acceso antes de guardar.", "error");
    tokenInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Guardando y publicando…");

  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: collectContent() }),
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await readJsonResponse(response);
    renderFields(mergeWithDefaults(payload.content));
    setStatus("Guardado. Los datos ya están publicados en la web.", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "No se han podido guardar los datos.", "error");
  } finally {
    setBusy(false);
  }
});

const storedToken = readSessionToken();
if (storedToken) {
  tokenInput.value = storedToken;
}

renderFields(mergeWithDefaults({}));
loadPublishedContent();
