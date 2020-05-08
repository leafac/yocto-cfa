const child_process = require("child_process");

const [, , numberOfPages] = process.argv;

if (numberOfPages === undefined) {
  console.error("Missing number of pages");
  process.exit(1);
}

for (let page = 1; page <= numberOfPages; page++)
  child_process.execFileSync("inkscape", [
    "--export-plain-svg",
    "--export-area-drawing",
    `--pdf-page=${page}`,
    `--export-filename=${page}.svg`,
    "images.pdf",
  ]);
