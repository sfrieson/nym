const form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const acronym = formData.get("q");
  if (!acronym) return;
  document.activeElement?.blur();
  const card = document.querySelector(".card");
  card.classList.add("thinking");

  const button = form.querySelector("button");
  button.disabled = true;
  const meaningsContainer = document.getElementById("meanings");
  meaningsContainer.innerHTML = "";

  try {
    document.dispatchEvent(RequestStartEvent);
    meaningsContainer.innerHTML = "";
    meaningsContainer.classList.remove("visible");
    meaningsContainer.style.height = "0px";

    const data = await queryAcronym(acronym);
    const meanings = data.meanings;

    const responses = document.createElement("div");
    responses.classList.add("meaning-list");
    meanings.forEach((meaning) => {
      const meaningTemplate = document.getElementById("meaning-template");
      const meaningElement = meaningTemplate.content.cloneNode(true);
      meaningElement.querySelector(".meaning-title").textContent =
        meaning.meaning;
      meaningElement.querySelector(".meaning-explanation").textContent =
        meaning.explanation;
      meaningElement.querySelectorAll("[data-feedback]").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const userSettings = getUserSettings();
          const sessionId = getRandomId();
          const button = e.target;
          /**
           * @type {"like" | "dislike"}
           */
          const feedback = button.dataset.feedback;
          navigator.sendBeacon(
            `/analytics`,
            JSON.stringify({
              event: "meaning_feedback_click",
              query: acronym,
              meaning: meaning.meaning,
              feedback,
              userId: userSettings.analytics ? userSettings.userId : "opt-out",
              sessionId,
            })
          );
        });
      });
      responses.appendChild(meaningElement);
    });

    meaningsContainer.appendChild(responses);

    const { height } = responses.getBoundingClientRect();
    meaningsContainer.style.height = `${height}px`;
    meaningsContainer.classList.add("visible");
  } catch (error) {
    console.error(error);
  } finally {
    card.classList.remove("thinking");
    button.disabled = false;
    document.dispatchEvent(RequestEndEvent);
  }
});

/**
 * @param {HTMLElement} el
 * @param {(el: HTMLElement) => void} modify
 * @returns {Promise<void>}
 */
function waitForAnimation(el, modify) {
  return new Promise((resolve) => {
    const on = () => {
      el.removeEventListener("animationend", resolve);
      el.removeEventListener("transitionend", resolve);
      resolve();
    };
    el.addEventListener("animationend", on);
    el.addEventListener("transitionend", on);
    modify(el);
  });
}

function queryAcronym(acronym) {
  return api(`/acronym?q=${acronym}`).then((res) => res.json());
}

const RequestStartEvent = new CustomEvent("request-start");
const RequestEndEvent = new CustomEvent("request-end");

function getRandomId() {
  try {
    return crypto.randomUUID();
  } catch (error) {
    return Math.random().toString(36).substring(2, 15);
  }
}
let sessionId = getRandomId();
function api(endpoint) {
  const id = getRandomId();
  let userSettings = getUserSettings();
  return fetch(endpoint, {
    headers: {
      "X-User-Id": userSettings.analytics ? userSettings.userId : "opt-out",
      "X-Session-Id": sessionId,
      "X-Request-Id": id,
    },
  });
}

function getUserSettings() {
  const userSettings = localStorage.getItem("user-settings");
  if (!userSettings) {
    const settings = {
      userId: getRandomId(),
      analytics: true,
    };
    localStorage.setItem("user-settings", JSON.stringify(settings));
    return settings;
  }

  return JSON.parse(userSettings);
}

window.addEventListener("storage", (e) => {
  if (e.key === "user-settings") {
    // Change the session ID to avoid having a way to track that the user changed their settings
    sessionId = getRandomId();
  }
});
