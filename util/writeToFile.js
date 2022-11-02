const fs = require("fs");

function writeToFile(outputDir, componentType, sections, error = false) {
  const jsonFile = error ? `${outputDir}/incomplete-tailwindui.${componentType}.json` : `${outputDir}/tailwindui.${componentType}.json`;
  console.log("[INFO] writing json file:", jsonFile);

  fs.writeFileSync(jsonFile, JSON.stringify(sections));
}

module.exports = writeToFile
