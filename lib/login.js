const baseUrl = process.env.BASE_URL;
const selector = {
  email: 'input#email',
  password: 'input#password',
  submit: 'button[type=submit]',
}

async function login(page, email, password) {
  await page.goto(baseUrl + "/login");
  await page.locator(selector.email).fill(email);
  await page.locator(selector.password).fill(password);
  await page.locator(selector.submit).click();

  // Assert login succeeded
  const loginFailedToken = "These credentials do not match our records";
  const el = await page.$$(`:text("${loginFailedToken}")`);
  if (el.length) {
    throw new Error("invalid credentials");
  }
}

module.exports = login
