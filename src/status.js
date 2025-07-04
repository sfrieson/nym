/**
 * @param {string} search
 * @returns {string}
 */
exports.randomStatus = function randomStatus(search) {
  const index = Math.floor(Math.random() * statuses.length);
  return statuses[index](search);
};

/**
 * @type {((search: string) => string)[]}
 */
const statuses = [
  (search) =>
    `Searching the ${section(
      search
    )} section... Oh wait... It's not alphabetized...`,
  () => `Searching the acronym archives...`,
  () => `Unrolling the jargon scroll...`,
  () => `Checking the Infinite Filing Cabinet™...`,
  () => `Asking middle management for clarification...`,
  () => `Okay Nymmy, you trained for this. Find the acronym.`,
  (search) =>
    `Oh no, not another ${section(search)}... I barely survived the one.`,
  (search) =>
    `Where did Brenda from Compliance say I could find the ${section(
      search
    )}s?`,
  (search) => {
    if (search.length < 3) {
      return `Oh nice... a short one!`;
    }
    const [l1, l2, l3] = search.slice(0, 3).toUpperCase().split("");
    const rest = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".replace(l3, "").split("");
    const random = rest[Math.floor(Math.random() * rest.length)];

    return `Looking up ${l1}... ${l2}... ${random}... Oh wait...Not ${random}!`;
  },
  () =>
    `Why are there two entirely different departments with the same acronym?!`,
  () => `I guess my bathroom break is over...`,
  () => `Why does this folder smell like burned synergy?`,
  () => `These acronyms aren't going to write themselves...`,
  () => `Wait... this acronym wasn’t on the onboarding exam... was it?`,
];

/**
 *
 * @param {string} search
 * @returns {string}
 */
const section = (search) => search[0].toUpperCase();
