const GithubSlugger = require("github-slugger");

// Add timestamp in title page

document
  .querySelector(".title-page")
  .insertAdjacentHTML(
    "beforeend",
    `<p class="draft">${new Date().toISOString()}</p>`
  );

// Slugify headings

const slugger = new GithubSlugger();
document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element) => {
  element.id = slugger.slug(element.textContent);
});

// Number headings

const headingsCounter = [];
document
  .querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")
  .forEach((element) => {
    const level = Number(element.tagName[1]);
    headingsCounter.splice(level);
    while (headingsCounter.length < level) headingsCounter.push(0);
    headingsCounter[headingsCounter.length - 1]++;
    element.innerHTML = `<span class="heading-counter">${headingsCounter.join(
      "."
    )}</span> <span class="heading-content">${
      element.innerHTML
    }</span><code class="draft"> (#${element.id})</code>`;
  });

// Resolve references

document.querySelectorAll(`a[href^="#"]`).forEach((element) => {
  const href = element.getAttribute("href");
  const target = document.querySelector(href);
  if (target !== null) {
    element.innerHTML = `§ ${
      target.querySelector(".heading-counter").textContent
    }<span class="draft"> (${
      target.querySelector(".heading-content").innerHTML
    })</span>`;
  } else {
    console.error(`Undefined reference: ${href}`);
    element.innerHTML = `§ ??`;
  }
});

// Add table of contents

document.querySelector(".table-of-contents").innerHTML = [
  ...document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
]
  .map(
    (element) =>
      `<li><a href="#${element.id}" data-section="${[
        "header",
        "main",
        "footer",
      ].find((section) => element.closest(section) !== null)}">${
        element.innerHTML
      }</a></li>`
  )
  .join("");

// Remove draft

if (document.body.dataset.draft !== "true")
  document.querySelectorAll(".draft").forEach((element) => {
    element.remove();
  });
