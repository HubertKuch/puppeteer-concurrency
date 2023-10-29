function generateWorkerCode(task, middleware) {
  return `(async () => {
    const { kill } = require('process');
    const { workerData, parentPort } = require('worker_threads');
    const { default: puppeteer } = require(workerData.puppeteer);

    (${middleware.toString()})(puppeteer);

    const browser = await puppeteer.launch(workerData.options);

    parentPort.postMessage({ pid: browser.process().pid })

    try {
      const page = await browser.newPage();

      for (const url of workerData.urls) {
        await (${task.toString()})(page, url)
        
parentPort.postMessage({ done: true });
      }
    } catch(error) {
      console.error(error)
      parentPort.postMessage({ error });
    } finally {
      await browser.close();
    }
  })()`;
}

export default generateWorkerCode;

