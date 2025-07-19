chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'injectProposal') {
    injectProposal(request.text)
    sendResponse({ success: true })
  }
})

function injectProposal(text: string): void {
  const selectors = [
    'textarea[name="proposal"]',
    'textarea[placeholder*="proposal"]',
    'textarea[placeholder*="cover letter"]',
    'textarea[data-test="cover-letter"]',
    'textarea[aria-label*="proposal"]',
    'textarea[aria-label*="cover letter"]',
    '#cover-letter',
    '[data-qa="cover-letter-text"]',
    '.cover-letter textarea',
    '.proposal-text textarea',
    'textarea.cover-letter',
    'textarea:not([readonly]):not([disabled])',
  ]

  let targetElement: HTMLTextAreaElement | null = null

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLTextAreaElement
    if (element && element.offsetHeight > 50) {
      targetElement = element
      break
    }
  }

  if (!targetElement) {
    const textareas = Array.from(document.querySelectorAll('textarea:not([readonly]):not([disabled])')) as HTMLTextAreaElement[]
    targetElement = textareas.find(ta => ta.offsetHeight > 50) || textareas[0] || null
  }

  if (targetElement) {
    targetElement.focus()
    
    targetElement.value = text
    
    const inputEvent = new Event('input', { bubbles: true })
    targetElement.dispatchEvent(inputEvent)
    
    const changeEvent = new Event('change', { bubbles: true })
    targetElement.dispatchEvent(changeEvent)
    
    if (targetElement.form) {
      const formEvent = new Event('input', { bubbles: true })
      targetElement.form.dispatchEvent(formEvent)
    }
    
    targetElement.style.backgroundColor = '#e6ffe6'
    setTimeout(() => {
      targetElement!.style.backgroundColor = ''
    }, 2000)
  } else {
    console.error('KillSwitch: Could not find a suitable textarea to inject the proposal')
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          if (element.matches('textarea') || element.querySelector('textarea')) {
            console.log('KillSwitch: New textarea detected')
          }
        }
      })
    }
  })
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})

console.log('KillSwitch content script loaded')