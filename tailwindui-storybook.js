const fs = require("fs");
const camelCase = require("lodash/camelCase");
const startCase = require("lodash/startCase");

const createDir = require("./util/createDir");

const componentType = process.argv[process.argv.length - 1];
if (!componentType.match(/react|html|vue/)) {
  console.log("usage: tailwind-storybook.js <react|html|vue>");
  console.log("example: tailwind-storybook.js react");
  process.exit(0);
}

const jsonFile = `./output/tailwindui.${componentType}.json`
if (!fs.existsSync(jsonFile)) {
  console.error("[ERROR] could not find json file at", jsonFile)
  console.log(`→ Have you run 'yarn start ${componentType}'?`)
  process.exit(1)
}

const sections = require(jsonFile)
const storyFolder = `Tailwind UI`;
const outputDir = `output/tailwindui-${componentType}`;

async function run() {
  createDir(outputDir);

  // Uncomment to see data structure
  // console.log("sections[0]:", sections[0]);

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

function pascalCase(str) {
  return startCase(camelCase(str)).replace(/ /g, "");
}

run();
