const baseUrl = process.env.BASE_URL;

async function getComponents(page, sectionUrl, type = "html") {
  // Go to section url
  await page.goto(sectionUrl);

  // Select react code
  try {
    // Page does not have this element if account did not purchage this module
    await page.waitForSelector('[x-model="activeSnippet"]', {
      timeout: 10 * 1000
    });
  } catch (error) {
    console.warn(`You do not have access this section components: ${sectionUrl}`);
  }

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
      el.querySelector('[x-ref="code"]')?.click();
    });
  }, []);

  // Wait until codeblock is visible
  await page.waitForSelector(`[x-ref="codeBlock${type}"]`);

  const components = await page.evaluate(
    ([type]) => {
      let components = [];
      document.querySelectorAll('section[id^="component-"]').forEach((el) => {
        const title = el.querySelector("h2 a").innerText;
        const component = el.querySelector(`[x-ref="codeBlock${type}"]`)?.innerText;
        component && components.push({ title, codeblocks: { [type]: component } });
      });
      return Promise.resolve(components);
    },
    [type]
  );

  // Back to home page
  await page.goto(baseUrl);

  return components;
}

module.exports = getComponents
