chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateProposal',
    title: 'Generate KillSwitch Proposal',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'generateProposal' && info.selectionText) {
    chrome.storage.local.set({ selectedText: info.selectionText })
    
    chrome.action.openPopup()
  }
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    chrome.storage.local.get(['selectedText'], (result) => {
      sendResponse({ selectedText: result.selectedText || '' })
    })
    return true
  }
})