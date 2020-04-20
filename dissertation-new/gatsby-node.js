const Prince = require("prince");

exports.onPostBuild = async () => {
  try {
    await new Prince()
      .option("pdf-profile", "PDF/A-1b")
      .inputs("public/index.html")
      .output("yocto-cfa.pdf")
      .execute();
  } catch ({ error }) {
    throw new Error(error);
  }
};
