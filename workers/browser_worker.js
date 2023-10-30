function generateWorkerCode(task, middleware, modules) {
  return `(async () => {
    const { kill } = require('process');
    const { workerData, parentPort } = require('worker_threads');
    const { default: puppeteer } = require(workerData.puppeteer);
    const path = require('path');

    const initModules = async (mods) => {
      const modules = {};
      
      for (const mod of mods) {
        const modPath = path.isAbsolute(mod.path) ? 'files://' + mod.path : mod.path;
        modules[mod.alias] = (await import(modPath)).default;
      }
      
      return modules;
    }
    
    const modules = await initModules(${JSON.stringify(modules)});

    (${middleware.toString()})(puppeteer);
  
    const browser = await puppeteer.launch(workerData.options);

    parentPort.postMessage({ pid: browser.process().pid })

    try {
      const page = await browser.newPage();

      for (const url of workerData.urls) {
        await (${task.toString()})(page, url, modules)
        
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
