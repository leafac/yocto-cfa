const Prince = require("prince");

exports.onPostBuild = async () => {
  const { stdout, stderr } = await new Prince()
    .option("pdf-profile", "PDF/A-1b")
    .option("fileroot", `${__dirname}/public`)
    .inputs("public/index.html")
    .output("yocto-cfa.pdf")
    .execute()
    .catch(({ error }) => {
      throw new Error(error);
    });
  console.log(stdout.toString());
  console.error(stderr.toString());
};
