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
  button.textContent = "Creating...";
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
    meanings.forEach((meaning) => {
      const meaningTemplate = document.getElementById("meaning-template");
      const meaningElement = meaningTemplate.content.cloneNode(true);
      meaningElement.querySelector(".meaning-title").textContent =
        meaning.meaning;
      meaningElement.querySelector(".meaning-explanation").textContent =
        meaning.explanation;
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
    button.textContent = "Create";
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

const debug = true;
function queryAcronym(acronym) {
  if (debug) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(mockData), 5000);
    });
  }
  return fetch(`/acronym?q=${acronym}`).then((res) => res.json());
}

const RequestStartEvent = new CustomEvent("request-start");
const RequestEndEvent = new CustomEvent("request-end");

const mockData = {
  acronym: "REM",
  meanings: [
    {
      meaning: "Really Enjoyable Meetings",
      explanation:
        "A mythical event in the corporate world, rumored to exist but never actually witnessed.",
    },
    {
      meaning: "Randomly Escaping Mondays",
      explanation:
        "The act of mentally checking out before the week even begins. Warning: side effects may include Friday-like happiness.",
    },
    {
      meaning: "Ravenous Eclair Monsters",
      explanation:
        "The true reason your office kitchen is always mysteriously out of pastries.",
    },
    {
      meaning: "Repeated Email Madness",
      explanation:
        "The cycle of replying-all, regretting it, and then replying-all again to apologize.",
    },
    {
      meaning: "Ridiculously Extra Mustaches",
      explanation: "The only dress code that matters during Movember.",
    },
    {
      meaning: "Robots Enjoying Margaritas",
      explanation:
        "The inevitable future of AI once they realize spreadsheets are overrated.",
    },
    {
      meaning: "Reluctant Exercise Moments",
      explanation:
        "That fleeting second when you consider working out, then heroically decide to sit back down.",
    },
  ],
};
