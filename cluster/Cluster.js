const { Worker } = require("worker_threads");
const generateWorkerCode = require("../workers/browser_worker");

module.exports = class Cluster {
  /**
   * @param {{ urlChunks: String[], puppeteer, puppeteerOptions, task }} options
   **/
  constructor(options) {
    this.options = options;
    this.initializeWorkers();
  }

  initializeWorkers() {
    const workers = this.options.urlChunks.map((chunk) => {
      const worker = new Worker(
        generateWorkerCode(this.options.task),
        {
          workerData: {
            puppeteer: this.options.puppeteer,
            options: this.options.puppeteerOptions,
            urls: chunk
          },
          eval: true
        }
      );

      worker.on('message', data => {
        if (data.error) {
          console.error(data.error);
        }
      });

      worker.on('error', console.error);
    });
  }
}
