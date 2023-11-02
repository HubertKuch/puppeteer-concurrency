import { Worker } from "worker_threads";
import generateWorkerCode from "../workers/browser_worker.js";
import os from 'os';
import {createLogUpdate} from 'log-update';
import {Chalk} from 'chalk';

const chalk = new Chalk({level: 1});

export default class Cluster {
  pids = [];
  workers = [];
  state = {
    errors: 0,
    donePages: 0,
    of: 0
  };

  /**
   * @param {{
     * urlChunks: String[],
     * puppeteer: String,
     * puppeteerOptions,
     * task,
     * monitor?: Boolean,
     * puppeteerMiddleware
     * modules: String[]
   * }} options
   **/
  constructor(options) {
    if (!options.puppeteerMiddleware) {
      options.puppeteerMiddleware = () => {};
    }

    this.options = options;
    const allPages = options.urlChunks.flat().length;

    this.state.of = allPages;

    this.initializeWorkers();

    if (options.monitor) {
      this.monitor();
    }
  }

  monitor() {
    new Promise(() => {
      const update = createLogUpdate(process.stdout);

      setInterval(function (state){
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        const memUsageInMb = parseInt((totalMem - freeMem) / 1024 / 1024);
        const memTotalInMb = parseInt(totalMem / 1024 / 1024);

        const percentOfDonePages = parseInt((state.donePages * 100) / state.of);
        const percentOfErrors = parseInt((state.errors * 100) / state.donePages);
        
        const errorInfo = `(${state.errors} errors - ${isNaN(percentOfErrors) ? 0 : percentOfErrors}% of done page)`; 

        update(`
Ram usage => ${memUsageInMb}MB / ${memTotalInMb}MB
Scraped pages => ${state.donePages} of ${state.of} what is ${percentOfDonePages === 100 ? chalk.green(`${percentOfDonePages}`) : percentOfDonePages}% ${chalk.red(errorInfo)}`);

      if (state.donePages === state.of) {
          clearInterval(this)
      }

      }, 200, this.state);
    });
  }

  initializeWorkers() {
    this.workers = this.options.urlChunks.map((chunk) => {
      const worker = new Worker(
        generateWorkerCode(this.options.task, this.options.puppeteerMiddleware, this.options.modules ?? []),
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
          this.state.errors = this.state.errors + 1;
        }

        if (data.pid) {
          this.pids.push(data.pid);
        }

        if (data.done) {
          this.state.donePages = this.state.donePages + 1;
        }
      });

      worker.on('error', console.error);
    });
  }
}
