const fs = require("fs");
const camelCase = require("lodash/camelCase");
const startCase = require("lodash/startCase");

const [, , jsonFile, componentType] = process.argv;

if (!jsonFile || !componentType) {
  console.log("usage: tailwind-storybook.js <jsonfile> <type>");
  console.log("example: tailwind-storybook.js tailwindui.react.json react");
  process.exit(0);
}

const sections = require(jsonFile);

const outputDir = `output/tailwindui-${componentType}`;

const storyFolder = `Tailwind UI`;

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log("[INFO] directory created:", dir);
  }
}

function pascalCase(str) {
  return startCase(camelCase(str)).replace(/ /g, "");
}

async function run() {
  createDir(outputDir);

  // Uncomment to see data structure
  console.log("sections[0]:", sections[0]);

  sections.forEach((section) => {
    const { title, components } = section;
    let sectionName = pascalCase(title.replace(/\s/g, "_"));
    if (sectionName.toLowerCase() === "faqs") {
      sectionName = "FAQs";
    }

    const sectionDir = `${outputDir}/${sectionName}`;
    createDir(sectionDir);

    const storyDir = `${sectionDir}/stories`;
    createDir(storyDir);

    const importComponents = [];
    const componentStories = [];

    components.forEach((component) => {
      const componentName = pascalCase(component.title);

      importComponents.push(
        `import ${componentName} from "./${componentName}";`
      );
      componentStories.push(`
<Story name="${componentName}">
    <${componentName} />
</Story>`);

      fs.writeFileSync(
        `${storyDir}/${componentName}.tsx`,
        component.codeblocks[componentType]
      );
    });

    // Create story file
    const storyIndex = `
import {
    Meta,
    Story,
} from "@storybook/addon-docs/blocks";

${importComponents.join("\n")}

<Meta title="${storyFolder} / ${sectionName}" />

${componentStories.join("\n")}
`;

    fs.writeFileSync(`${storyDir}/index.stories.mdx`, storyIndex);
  });
}

run();
