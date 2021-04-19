const puppeteer = require('puppeteer');

class PuppeteerSandbox {
  // The puppeteer browser instance.
  browser = null;
  
  // The puppeteer page instance.
  page = null;
  
  // The script to execute within the page context.
  script = '';
  
  // A saved-state object that allows this sandbox to store data
  // between instantiations. Not all sandbox child types make use
  // of long-term memory, but it's integral enough to the function of
  // the sandbox that it's worth adding support for it in the base class.
  myLongTermMemory = '';
  
  // An error that was encountered during the run. Cleared when
  // a run is invoked. Set at some point during the run if an
  // uncaught error causes the run to abort.
  error = null;
  
  // A promise that's created when the script begins running. It gets
  // resolved (void) when the run completes (even if the run itself failed).
  runPromise = null;
  
  // A method, set by the framework, for handling console messages.
  // Presumably it can pass them to the spectator.
  onConsoleMessage = null;
  
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
      headless: true
    });
    
    this.page = await this.browser.newPage();

    // Listen for the page's console messages, so that we can display them
    // to the real console and/or save them for debugging purposes.
    this.page.on('console', (msg) => {
      if (this.onConsoleMessage) {
        this.onConsoleMessage(msg);
      }
    });

    // Prevent the browser from accessing the network!
    // This is critical, unless you want your players cheating and pulling
    // online resources (via bandwidth that you have to pay for.)
    // (And obviously, if they had network access, then instead of writing
    // game bots they'll instead just use this platform for running botnets,
    // ad networks, and bitcoin miners.)
    // We use Chrome Dev Tools options to set this Puppeteer instance
    // to work offline.
    // https://fdalvi.github.io/blog/2018-02-05-puppeteer-network-throttle/
    // NOTE: We can't just specify offline: true. We need to supply the 
    // entire configuration data structure. Other examples seen here:
    // https://gist.github.com/aslushnikov/8fc02205222e3dcf367cfd3f470ec554
    // NOTE: Puppeteer now supports emulating network conditions directly,
    // but it doesn't appear to have a predefined "offline" mode, and it
    // appears to just call Chrome DevTools anyway.
    // https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-pageemulatenetworkconditionsnetworkconditions
    
    const devtoolsession = await this.page.target().createCDPSession();
    await devtoolsession.send('Network.emulateNetworkConditions', {
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
      offline: true,
    });
    
    // Chrome DevTools network condition emulation doesn't affect WebSockets 
    // or RTCPeerConnection, so it's not a perfectly isolated sandbox. 
    // We still need to take extra measures.
    // It appears that this is a problem for Chrome DevTools as well.
    // Override the WebSocket and RTCPeerConnection interfaces
    // so the player can't form network connections.
    // These connection types are not yet handled by network throttling.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=563644
    await this.page.evaluate(
        `WebSocket = function() { throw new Error('Use of WebSocket is forbidden. Nice try.'); }`);
    await this.page.evaluate(
        `RTCPeerConnection = function() { throw new Error('Use of RTCPeerConnection is forbidden. Nice try.'); }`);
        
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
    
    let didForceShutdown = false;
    const whicheverPromiseResolvesFirst = [
      this.runPromise,
      this.page.waitForTimeout(ms).then(() => {
        this.error = new Error(`Puppeteer sandbox forced timeout after ${ms} ms.`);
      })      
    ];
    await Promise.race(whicheverPromiseResolvesFirst);
    await this.shutdown();
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
          `ChallengeBot.myLongTermMemory = ${JSON.stringify(this.myLongTermMemory || {})};`
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

