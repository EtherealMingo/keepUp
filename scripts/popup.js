const startEl = document.querySelector('#start');
const pauseEl = document.querySelector('#pause');
const urlField = document.querySelector('#urlField');
const tbodyEl = document.querySelector('tbody');
const resetEl = document.querySelector('#reset');
const tfootEl = document.querySelector('tfoot');

// 获取本地存储数据
function getSites() {
  const str = window.localStorage.getItem('sites') || '[]';
  return JSON.parse(str);
}
function getStatus() {
  const str = window.localStorage.getItem('status') || '';
  return JSON.parse(str);
}

// URL 校验方法
function checkURL(url) {
  const urlReg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
  return urlReg.test(url);
}

function buttonDisable(sites, status) {
  if (sites.length) {
    tfootEl.classList.add('hidden');
    tbodyEl.classList.remove('hidden');
    resetEl.removeAttribute('disabled');
    if (status === 'running') {
      startEl.setAttribute('disabled', 'disabled');
      pauseEl.removeAttribute('disabled');
    } else {
      startEl.removeAttribute('disabled');
      pauseEl.setAttribute('disabled', 'disabled');
    }
  } else {
    tfootEl.classList.remove('hidden');
    tbodyEl.classList.add('hidden');
    resetEl.setAttribute('disabled', 'disabled');
    startEl.setAttribute('disabled', 'disabled');
    pauseEl.setAttribute('disabled', 'disabled');
  }
}

function createTbodyContent(sites) {
  tbodyEl.innerHTML = '';
  for (let item of sites) {
    const trEl = document.createElement('tr');
    trEl.innerHTML = `
      <td class='urlCol' title='${item}'>${item}</td>
      <td class='operationCol'>
        <div class='del' id='${item}' title='删除${item}'>删除</div>
      </td>`
    tbodyEl.prepend(trEl)
  }
}

// 接受 background 返回值并存储,同时确定按钮是否 disabled
function callbackSites(res) {
  const sites = JSON.parse(res).sites;
  createTbodyContent(sites);
  window.localStorage.setItem('sites', JSON.stringify(sites));
  buttonDisable(sites)
}
function callbackStatus(res) {
  window.localStorage.setItem('status', JSON.stringify(JSON.parse(res).status));
  buttonDisable(getSites(), JSON.parse(res).status);
}

createTbodyContent(getSites());
buttonDisable(getSites(), getStatus());

// 全局点击事件绑定
document.addEventListener("click", (e) => {
  if (checkURL(e.target.id)) {
    chrome.runtime.sendMessage({
      type: 'del',
      data: e.target.id
    }, callbackSites);
  }
  switch (e.target.id) {
    case 'save': {
      if (urlField.value.trim() === '') {
        alert('请输入 URL');
        return;
      }
      let result = checkURL(urlField.value.trim())
      if (result) {
        chrome.extension.sendMessage({
          type: 'save',
          data: urlField.value.trim()
        }, (res) => {
          callbackSites(res);
          urlField.value = '';
        });
      } else {
        alert('你输入的 URL 不正确')
      }
      break;
    }
    case 'start': {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, (tabs) => {
        chrome.extension.sendMessage({
          type: 'start',
          windowId: tabs[0].windowId,
          tabId: tabs[0].id,
        }, callbackStatus)
      })
      break;
    }
    case "pause": {
      chrome.extension.sendMessage({
        type: 'pause'
      }, callbackStatus)
      break;
    }
    case "reset": {
      chrome.extension.sendMessage({
        type: 'reset'
      }, callbackSites)
    }
  }
})