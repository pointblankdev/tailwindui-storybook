const playwright = require("playwright");

const login = require("./lib/login");
const getSections = require("./lib/getSections");
const getComponents = require("./lib/getComponents");
const createDir = require("./util/createDir");
const writeToFile = require("./util/writeToFile");

const email = (process.env.email || "").trim();
const password = (process.env.password || "").trim();

const outputDir = "output";
const componentsPage = `${process.env.BASE_URL}/components`;

// Make sure email and password are provided
if (!email || !password) {
  console.log(
    "[ERROR] please provide email and password of your tailwind ui account as environment variable."
  );
  console.log(
    "example: email=myemail@example.com password=mypassword node tailwindui.js react"
  );
  process.exit(1);
}

async function run() {
  const [, , componentType] = process.argv;
  createDir(outputDir);

  if (!componentType) {
    console.error("[ERROR] please specify component type (html|react|vue).");
    console.error(`example: node tailwindui.js react`);
    process.exit(0);
  }

  const browser = await playwright["chromium"].launch({
    headless: !!process.env.headless,
    slowMo: process.env.slowmo ? 500 : undefined,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log("[INFO] logging in to tailwindui.com..");

  try {
    // Login to tailwindui.com. Throws error if failed.
    await login(page, email, password);
    await page.goto(componentsPage);
  } catch (e) {
    const maskPassword = password.replace(/.{4}$/g, "*".repeat(4));
    console.log(
      `[ERROR] login failed: ${e.message} (email: ${email}, pasword: ${maskPassword})`
    );
    process.exit(1);
  }

  console.log(`[INFO] fetching sections..`);
  const sections = await getSections(page).catch((e) => {
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
      `[${parseInt(i) + 1}/${sections.length
      }] fetching ${componentType} components: ${title} (${componentsCount} components)`
    );

    let components = [];
    try {
      components = await getComponents(page, url, componentType);
    } catch (e) {
      console.log("[ERROR] getComponent failed:", title, e.message);
      writeToFile(outputDir, componentType, sections, true);
      process.exit(1);
    }

    sections[i].components = components;
  }

  await browser.close();

  writeToFile(outputDir, componentType, sections);
  console.log("[INFO] done!");
}

run();
