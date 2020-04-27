const puppeteer = require("puppeteer");
const fs = require("fs");
const child_process = require("child_process");

exports.onPostBuild = compilePDF;
exports.onCreateDevServer = () => {
  compilePDF(); // Don’t await on the promise to let server start listening
};
exports.createPages = compilePDF;

async function compilePDF() {
  let input = "public/index.html";
  if (process.env.NODE_ENV === "development") {
    input = "public/index-rendered.html";
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
      await page.goto("http://localhost:8000", { waitUntil: "networkidle2" });
      fs.writeFileSync(input, await page.content());
    } catch {
    } finally {
      await browser.close();
    }
  }
  if (fs.existsSync(input))
    child_process.execFileSync(
      "node_modules/prince/prince/lib/prince/bin/prince",
      [
        "--fileroot=public",
        "--pdf-profile=PDF/A-1b",
        "--no-artificial-fonts",
        "--fail-dropped-content",
        "--fail-missing-resources",
        "--fail-missing-glyphs",
        input,
        "--output=yocto-cfa.pdf",
      ]
    );
}
