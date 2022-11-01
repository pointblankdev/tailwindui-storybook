async function getSections(page) {
  const sections = await page.evaluate(([]) => {
    const buildSections = [];
    document
      .querySelectorAll('a[href^="/components"]')
      .forEach((el) => {
        const title = el.children[1]?.innerText;
        const countComponents = el.parentElement?.nextElementSibling?.innerText;
        const url = el.href;
        title && countComponents && buildSections.push({ title, componentsCount: parseInt(countComponents), url });
      });
    return Promise.resolve(buildSections);
  }, []);

  return sections;
}

module.exports = getSections
