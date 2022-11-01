const baseUrl = process.env.BASE_URL;

async function getComponents(page, sectionUrl, type = "html") {
  // Go to section url. Example: https://tailwindui.com/components/marketing/sections/heroes
  await page.goto(sectionUrl);

  const toggleCodeSelector = '[role=tablist] > [id^=headlessui-tabs-tab-]:nth-child(2)'
  try {
    // Element to toggle code snippet (hint: ../docs/hints/toggle-code.png). 
    // The element won't exist if the user doesn't have access to the paid component.
    await page.waitForSelector(toggleCodeSelector, { timeout: 10 * 1000 });
  } catch (error) {
    console.warn(`You do not have access this section components: ${sectionUrl}`);
  }

  const components = await page.evaluate(([toggleCodeSelector, type]) => {
    let components = [];
    document.querySelectorAll('section[id^="component-"]').forEach((el) => {
      // Toggle code block
      el.querySelector(toggleCodeSelector)?.click();

      // Change the type of code snippet to HTML/React/Vue (hint: ../docs/hints/toggle-code-format.png)
      el.querySelector('select.form-select').value = type;

      // Extract code blocks (hint: ../docs/hints/codeblock.png)
      const title = el.querySelector("h2 a").innerText;
      const codeblock = el.querySelector('pre code')?.innerText;
      codeblock && components.push({ title, codeblocks: { [type]: codeblock } });
    });
    return Promise.resolve(components);
  }, [toggleCodeSelector, type]);

  // Back to home page
  await page.goto(baseUrl);

  return components;
}

module.exports = getComponents
