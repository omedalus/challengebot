const puppeteer = require('puppeteer');

class PuppeteerSandbox {
  // The puppeteer browser instance.
  browser = null;
  
  // The puppeteer page instance.
  page = null;
  
  // The script to execute within the page context.
  script = '';
  
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
  // Should be run after all functions are injected (doesn't have to 
  // be, but it's usually a good idea).
  async run(script) {
    if (typeof script === 'undefined') {
      script = this.script;
    }
    this.script = script;

    await this.page.evaluate(`(async () => { ${script} })()`);
  }
}

module.exports = PuppeteerSandbox;

