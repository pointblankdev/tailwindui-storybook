const fs = require("fs");
const playwright = require("playwright");

const baseUrl = "https://tailwindui.com";

const email = process.env.email;
const pass = process.env.password;

const outputDir = "output";

async function login(page, email, pass) {
  await page.goto(baseUrl + "/login");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', pass);
  await page.click('[type="submit"]');
}

async function getSections(page) {
  const sections = await page.evaluate(([]) => {
    let sections = [];
    document
      .querySelectorAll('#components [href^="/components"]')
      .forEach((el) => {
        const title = el.querySelector("p:nth-child(1)").innerText;
        const components = el.querySelector("p:nth-child(2)").innerText;
        const url = el.href;
        sections.push({ title, componentsCount: parseInt(components), url });
      });
    return Promise.resolve(sections);
  }, []);

  return sections;
}

async function getComponents(page, sectionUrl, type = "html") {
  // Go to section url
  await page.goto(sectionUrl);

  // Select react code
  await page.waitForSelector('[x-model="activeSnippet"]');
  await page.evaluate(
    ([type]) => {
      document.querySelectorAll('[x-model="activeSnippet"]').forEach((el) => {
        el.value = type;
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        el.dispatchEvent(evt);
      });
    },
    [type]
  );

  // Toggle all codeblocks (otherwise the `innerText` will be empty)
  await page.waitForSelector('[x-ref="code"]');
  await page.evaluate(([]) => {
    document.querySelectorAll('section[id^="component-"]').forEach((el) => {
      el.querySelector('[x-ref="code"]').click();
    });
  }, []);

  // Wait until codeblock is visible
  await page.waitForSelector(`[x-ref="codeBlock${type}"]`);

  const components = await page.evaluate(
    ([type]) => {
      let components = [];
      document.querySelectorAll('section[id^="component-"]').forEach((el) => {
        const title = el.querySelector("header h2").innerText;

        const component = el.querySelector(`[x-ref="codeBlock${type}"]`)
          .innerText;
        components.push({ title, codeblocks: { [type]: component } });
      });
      return Promise.resolve(components);
    },
    [type]
  );

  // Back to home page
  await page.goto(baseUrl);

  return components;
}

async function run() {
  const [, , componentType] = process.argv;

  if (!componentType) {
    console.error("[ERROR] please specify component type (html/react/vue).");
    console.error(`example: node tailwindui.js react`);
    process.exit(0);
  }

  const browser = await playwright["chromium"].launch({
    headless: false,
    // slowMo: 150,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, email, pass);

  await page.goto(baseUrl);

  console.log(`[INFO] fetching sections..`);
  let sections = await getSections(page).catch((e) => {
    console.log("[ERROR] getSections failed:", e);
  });

  const sumComponents = sections
    .map((s) => s.componentsCount)
    .reduce((a, b) => parseInt(a) + parseInt(b), [0]);

  console.log(
    `[INFO] ${sections.length} sections found (${sumComponents} components)`
  );

  for (const i in sections) {
    const { title, componentsCount, url } = sections[i];
    console.log(
      `[INFO] fetching ${componentType} components: ${title} (${componentsCount} components)`
    );

    const components = await getComponents(page, url, componentType).catch(
      (e) => {
        console.log("[ERROR] getComponent failed:", title, e.message);
      }
    );

    sections[i].components = components;
  }

  await browser.close();

  console.log("[INFO] writing json file..");

  fs.writeFileSync(
    `${outputDir}/tailwindui.${componentType}.json`,
    JSON.stringify(sections)
  );

  console.log("[INFO] done!");
}

run();
