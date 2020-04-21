const Prince = require("prince");

exports.onPostBuild = async () => {
  await new Prince()
    .option("pdf-profile", "PDF/A-1b")
    .option("fileroot", "public")
    .inputs("public/index.html")
    .output("yocto-cfa.pdf")
    .execute()
    .catch(({ error }) => {
      throw new Error(error);
    });
};
