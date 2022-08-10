let index = 0;
let handle;

function getSites() {
  let str = window.localStorage.getItem('sites') || '[]';
  return JSON.parse(str);
}

function start(tabId, windowId, sites) {
  if (tabId && windowId) {
    handle = setInterval(() => {
      let url = sites[index % sites.length];
      chrome.tabs.update(tabId, {
        url
      });
      index++;
    }, 6000)
  } else {
    clearInterval(handle);
  }
}

function run(tabId, sites) {
  let url = sites[index % sites.length];
  chrome.tabs.update(tabId, {
    url
  });
  index++;
}

chrome.extension.onMessage.addListener((resquest, sender, callback) => {
  let sites = getSites();
  let newSites;
  switch (resquest.type) {
    case 'save':
      newSites = [resquest.data, ...sites];
      callback && callback(`{"sites": ${JSON.stringify(newSites)} }`);
      break;
    case 'del':
      newSites = sites.filter((val) => val !== resquest.data);
      callback && callback(`{"sites": ${JSON.stringify(newSites)} }`);
      break;
    case 'start':
      run(resquest.tabId, sites)
      start(resquest.tabId, resquest.windowId, sites);
      callback && callback('{ "status": "running" }');
      break;
    case 'pause':
      clearInterval(handle);
      callback && callback('{ "status": "pause" }');
      break;
    case 'reset':
      clearInterval(handle);
      newSites = [];
      callback && callback(`{"sites": ${JSON.stringify(newSites)} }`);
      break;
  }
});