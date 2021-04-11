const puppeteer = require('puppeteer');

class PuppeteerSandbox {
  // The puppeteer browser instance.
  browser = null;
  
  // The puppeteer page instance.
  page = null;
  
  // The script to execute within the page context.
  script = '';
  
  // A saved-state object that allows this sandbox to store data
  // between instantiations.
  myLongTermMemory = '';
  
  // An error that was encountered during the run. Cleared when
  // a run is invoked. Set at some point during the run if an
  // uncaught error causes the run to abort.
  error = null;
  
  // A promise that's set when the script begins running. It gets
  // resolved (void) when the run completes (even if the run itself failed).
  runPromise = null;
  
  // Internal tracker that prevents sandbox from being double-initialized.
  __initialized = false;  
  
  // Launches the puppeteer instance. This must be called before
  // any functions are injected and before the run method is invoked.
  async init() {
    if (this.__initialized) {
      throw new Error('Cannot call init twice on the same PuppeteerSandbox object.');
    }
    this.__initialized = true;
    
    this.browser = await puppeteer.launch({
      headless: false
    });
    this.page = await this.browser.newPage();
    
    // Inject a global ChallengeBot object that will be used
    // as a namespace for aliases for exposed methods.
    await this.page.evaluate(`const ChallengeBot = {};`);
    
    // Give the poor schmucks a sleep function.
    await this.injectFunction('sleep', async (ms) => {
      ms = Math.ceil(Math.max(1, ms));
      await this.page.waitForTimeout(ms);
    });
  }
  
  // Gracefun shutdown.
  async shutdown() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
  
  // Abort execution and close the browser if more tha the given number
  // of milliseconds go by.
  async ensureTimedShutdown(ms) {
    if (!this.runPromise) {
      // In theory this means we're already down.
      await this.shutdown();
      return;
    }
    
    // We would use Promise.any, but apparently that doesn't exist yet.
    // https://forums.meteor.com/t/promise-any-is-not-a-function/54603
    let didForceShutdown = false;
    const whicheverPromiseResolvesFirst = [
      this.runPromise,
      this.page.waitForTimeout(ms).then(() => {
        didForceShutdown = true;
      })      
    ];
    await Promise.race(whicheverPromiseResolvesFirst);
    await this.shutdown();
    
    if (didForceShutdown) {
      this.error = new Error(`Puppeteer sandbox forced timeout after ${ms} ms.`);
    }
  }  
  
  // Injects a function of the given name into the puppeteer instance.
  // Must be run after the init method. Should be run before the run
  // method is invoked.
  async injectFunction(name, fn) {
    await this.page.exposeFunction(name, fn);
    await this.page.evaluate(`ChallengeBot.${name} = ${name};`);
  }
  
  // Runs the given JavaScript (or the object's "script" contents)
  // in the puppeteer instance. You will typically call this without
  // awaiting the results. Must be run after the init method.
  // Must be run after all functions are injected (doesn't have to 
  // be, but it's usually a good idea).
  async run(script, shouldShutdownAfterFinish = true) {
    let fnResolve = null;
    this.runPromise = new Promise((resolve, reject) => {
      // TODO: Find a way to return the actual promise of this function.
      fnResolve = resolve;
    });
    
    if (typeof script === 'undefined') {
      script = this.script;
    }
    this.script = script || '';

    this.error = null;
    
    try {
      // Inject long-term memory.
      await this.page.evaluate(
          `ChallengeBot.myLongTermMemory = ${JSON.stringify(this.myLongTermMemory)};`
      );
      
      // Run the script!
      await this.page.evaluate(`(async () => { ${script} })()`);
      
      // Retrieve long-term memory when finished.
      this.myLongTermMemory = await this.page.evaluate(
          `ChallengeBot.myLongTermMemory || ''`
      );
      
    } catch (err) {
      this.error = err;
      
    } finally {
      if (shouldShutdownAfterFinish) {
        await this.shutdown();
      }
      this.runPromise = null;
      fnResolve();
    }
  }
}

module.exports = PuppeteerSandbox;

