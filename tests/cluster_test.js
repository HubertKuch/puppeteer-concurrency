const Cluster = require('../index');

const cluster = new Cluster({
  puppeteer: 'puppeteer',
  urlChunks: [
    ["https://www.npmjs.com/search?q=keywords%3Atest"],
    ["https://www.npmjs.com/search?q=keywords%3Apuppeteer"],
    ["https://www.npmjs.com/search?q=keywords%3Arandom"]
  ],
  puppeteerOptions: {
    headless: 'new'
  },
  task: async (page, url) => {
    await page.goto(url);

    await page.waitForSelector("#main section a[target=_self][href*=\"/package\"]");
    const text = await page.$$eval("#main section a[target=_self][href*=\"/package\"]", nodes => nodes.map(n => n.innerText.trim()));

    console.log(text);
  }
});
