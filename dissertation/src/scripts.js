const GithubSlugger = require("github-slugger");

// Add timestamp in title page

document
  .querySelector(".title-page")
  .insertAdjacentHTML(
    "beforeend",
    `<p class="draft">${new Date().toISOString()}</p>`
  );

// Slugify headings & collect table of contents + references

const tableOfContents = [];
const references = {};
const referencesCounter = [];
const slugger = new GithubSlugger();
for (const element of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
  element.id = slugger.slug(element.textContent);
  if (element.closest("main") !== null) {
    const level = Number(element.tagName[1]);
    referencesCounter.splice(level);
    while (referencesCounter.length < level) referencesCounter.push(0);
    referencesCounter[referencesCounter.length - 1]++;
    const referencesCounterString = referencesCounter.join(".");
    element.insertAdjacentHTML(
      "afterbegin",
      `<span class="heading-counter">${referencesCounterString}</span> `
    );
    element.insertAdjacentHTML(
      "beforeend",
      ` <code class="draft">(#${element.id})</code>`
    );
    references[element.id] = referencesCounterString;
  }
  tableOfContents.push({
    id: element.id,
    section: ["header", "main", "footer"].find(
      (section) => element.closest(section) !== null
    ),
    innerHTML: element.innerHTML,
  });
}

// Resolve references

for (const element of document.querySelectorAll(`a[href^="#"]`)) {
  const href = element.getAttribute("href");
  let reference = references[href.slice(1)];
  if (reference === undefined) {
    console.error(`Undefined reference: ${href}`);
    reference = "??";
  }
  element.innerHTML = `§ ${reference}`;
}

// Add table of contents

document
  .querySelector(".table-of-contents")
  .insertAdjacentHTML(
    "afterbegin",
    tableOfContents
      .map(
        ({ id, section, innerHTML }) =>
          `<li><a href="#${id}" data-section="${section}">${innerHTML}</a></li>`
      )
      .join("")
  );

// Remove draft

if (document.body.dataset.draft !== "true")
  for (const element of document.querySelectorAll(".draft")) element.remove();
