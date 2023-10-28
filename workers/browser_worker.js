function generateWorkerCode(task) {
  return `(async () => {
    const { kill } = require('process');
    const { workerData, parentPort } = require('worker_threads');
    const { default: puppeteer} = require(workerData.puppeteer);

    const browser = await puppeteer.launch(workerData.options);

    try {
      const page = await browser.newPage();

      for (const url of workerData.urls) {
        await (${task.toString()})(page, url);
      }
    } catch(error) {
      console.error(error)
      // parentPort.postMessage({ error });
    } finally {
      await browser.close();
    }
  })()`;
}

module.exports = generateWorkerCode;

