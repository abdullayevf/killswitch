import React, { useState, useEffect } from 'react'

interface ProposalSettings {
  tone: string
  goal: string
  language: string
}

interface GeneratedProposal {
  text: string
  timestamp: number
}

interface DebugInfo {
  apiKey: string
  requestUrl: string
  requestBody: any
  responseStatus: number
  responseHeaders: any
  responseBody: any
  errorDetails: string
}

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('')
  const [settings, setSettings] = useState<ProposalSettings>({
    tone: 'Bold',
    goal: 'Fast Closure',
    language: 'Auto-detect'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProposal, setGeneratedProposal] = useState<GeneratedProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        setJobDescription(result.selectedText)
        chrome.storage.local.remove(['selectedText'])
      }
    })

    chrome.storage.sync.get(['defaultSettings'], (result) => {
      if (result.defaultSettings) {
        setSettings(result.defaultSettings)
      }
    })
  }, [])

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    setIsGenerating(true)
    setError(null)
    setDebugInfo(null)
    setShowDebug(false)

    const requestUrl = 'https://api.openai.com/v1/chat/completions'
    let debugData: Partial<DebugInfo> = {
      requestUrl,
      apiKey: '',
      requestBody: null,
      responseStatus: 0,
      responseHeaders: {},
      responseBody: null,
      errorDetails: ''
    }

    try {
      console.log('🔄 Starting proposal generation...')
      
      const aiConfig = await getAIConfig()
      debugData.apiKey = aiConfig.apiKey ? `${aiConfig.apiKey.substring(0, 10)}...` : 'No key found'
      console.log('🔑 AI Provider:', aiConfig.provider)
      console.log('🔑 Model:', aiConfig.model)
      console.log('🔑 API Key length:', aiConfig.apiKey ? aiConfig.apiKey.length : 'No key found')
      
      if (!aiConfig.apiKey || aiConfig.apiKey.trim() === '') {
        const error = `${aiConfig.provider} API key not configured. Please go to Settings and add your API key.`
        debugData.errorDetails = error
        setDebugInfo(debugData as DebugInfo)
        throw new Error(error)
      }

      const prompt = await buildPrompt(jobDescription, settings)
      console.log('📝 Generated prompt:', prompt)

      let response: Response
      let proposalText: string

      if (aiConfig.provider === 'groq') {
        debugData.requestBody = {
          model: aiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        }
        console.log('📤 Groq API Request:', debugData.requestBody)
        
        response = await callGroqAPI(aiConfig.apiKey, aiConfig.model, prompt)
        
        debugData.responseStatus = response.status
        debugData.responseHeaders = Object.fromEntries(response.headers.entries())
        
        const responseText = await response.text()
        console.log('📥 Raw response text:', responseText)

        if (!response.ok) {
          debugData.responseBody = responseText
          debugData.errorDetails = `HTTP ${response.status}: ${responseText}`
          setDebugInfo(debugData as DebugInfo)
          throw new Error(`Groq API error (Status: ${response.status})`)
        }

        const data = JSON.parse(responseText)
        debugData.responseBody = data
        proposalText = data.choices[0].message.content

      } else if (aiConfig.provider === 'gemini') {
        debugData.requestBody = {
          contents: [{ parts: [{ text: prompt }] }]
        }
        console.log('📤 Gemini API Request:', debugData.requestBody)
        
        response = await callGeminiAPI(aiConfig.apiKey, aiConfig.model, prompt)
        
        debugData.responseStatus = response.status
        debugData.responseHeaders = Object.fromEntries(response.headers.entries())
        
        const responseText = await response.text()
        console.log('📥 Raw response text:', responseText)

        if (!response.ok) {
          debugData.responseBody = responseText
          debugData.errorDetails = `HTTP ${response.status}: ${responseText}`
          setDebugInfo(debugData as DebugInfo)
          throw new Error(`Gemini API error (Status: ${response.status})`)
        }

        const data = JSON.parse(responseText)
        debugData.responseBody = data
        proposalText = data.candidates[0].content.parts[0].text

      } else if (aiConfig.provider === 'huggingface') {
        debugData.requestBody = {
          inputs: prompt,
          parameters: { max_new_tokens: 500, temperature: 0.7 }
        }
        console.log('📤 HuggingFace API Request:', debugData.requestBody)
        
        response = await callHuggingFaceAPI(aiConfig.apiKey, aiConfig.model, prompt)
        
        debugData.responseStatus = response.status
        debugData.responseHeaders = Object.fromEntries(response.headers.entries())
        
        const responseText = await response.text()
        console.log('📥 Raw response text:', responseText)

        if (!response.ok) {
          debugData.responseBody = responseText
          debugData.errorDetails = `HTTP ${response.status}: ${responseText}`
          setDebugInfo(debugData as DebugInfo)
          throw new Error(`HuggingFace API error (Status: ${response.status})`)
        }

        const data = JSON.parse(responseText)
        debugData.responseBody = data
        proposalText = Array.isArray(data) ? data[0].generated_text : data.generated_text

      } else {
        throw new Error(`Unsupported AI provider: ${aiConfig.provider}`)
      }

      setDebugInfo(debugData as DebugInfo)
      console.log('✅ API Success response')
      console.log('📄 Generated proposal text:', proposalText)

      setGeneratedProposal({
        text: proposalText,
        timestamp: Date.now()
      })
      
      console.log('🎉 Proposal generation completed successfully!')
    } catch (err) {
      console.error('💥 Error in handleGenerate:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      
      if (!debugData.errorDetails) {
        debugData.errorDetails = errorMessage
      }
      setDebugInfo(debugData as DebugInfo)
      
      console.error('💥 Final error message:', errorMessage)
      setError(errorMessage)
      setShowDebug(true) // Auto-show debug info on error
    } finally {
      setIsGenerating(false)
      console.log('🏁 Generation process finished')
    }
  }

  const handleCopy = async () => {
    if (!generatedProposal) return
    
    try {
      await navigator.clipboard.writeText(generatedProposal.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }


  return (
    <div style={{ width: '400px', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(to right, #4f46e5, #9333ea)', 
        padding: '20px', 
        color: 'white' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>KillSwitch</h1>
            <p style={{ color: '#e0e7ff', fontSize: '14px', margin: '4px 0 0 0' }}>AI Proposal Generator</p>
          </div>
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })}
            style={{
              color: '#ffffffb3',
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#ffffffb3'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Job Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151', 
            marginBottom: '8px' 
          }}>
            Job Description
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              style={{
                width: '100%',
                height: '128px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'none',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '8px', 
              right: '8px', 
              fontSize: '12px', 
              color: '#9ca3af' 
            }}>
              {jobDescription.length}/2000
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#4b5563', 
              marginBottom: '4px' 
            }}>Tone</label>
            <select
              value={settings.tone}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="Bold">Bold</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Confident">Confident</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#4b5563', 
              marginBottom: '4px' 
            }}>Goal</label>
            <select
              value={settings.goal}
              onChange={(e) => setSettings({ ...settings, goal: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="Fast Closure">Fast Closure</option>
              <option value="Build Rapport">Build Rapport</option>
              <option value="Show Expertise">Show Expertise</option>
              <option value="Competitive Edge">Competitive Edge</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#4b5563', 
              marginBottom: '4px' 
            }}>Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="Auto-detect">Auto-detect</option>
              <option value="English">English</option>
              <option value="Russian">Russian</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !jobDescription.trim()}
          style={{
            width: '100%',
            background: isGenerating || !jobDescription.trim() 
              ? '#9ca3af' 
              : 'linear-gradient(to right, #4f46e5, #9333ea)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '500',
            fontSize: '14px',
            cursor: isGenerating || !jobDescription.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && jobDescription.trim()) {
              e.currentTarget.style.background = 'linear-gradient(to right, #4338ca, #7c3aed)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && jobDescription.trim()) {
              e.currentTarget.style.background = 'linear-gradient(to right, #4f46e5, #9333ea)'
            }
          }}
        >
          {isGenerating ? (
            <>
              <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              Generate Proposal
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700 font-medium">{error}</p>
                {debugInfo && (
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug Info
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo && showDebug && (
          <div className="p-4 bg-gray-50 border rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🔍 Debug Information</h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-gray-600">API Key:</span> 
                <span className="ml-2 font-mono text-gray-800">{debugInfo.apiKey}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Request URL:</span> 
                <span className="ml-2 font-mono text-gray-800 break-all">{debugInfo.requestUrl}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Response Status:</span> 
                <span className="ml-2 font-mono text-gray-800">{debugInfo.responseStatus}</span>
              </div>
              {debugInfo.requestBody && (
                <div>
                  <span className="font-medium text-gray-600">Request Body:</span>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.requestBody, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.responseHeaders && Object.keys(debugInfo.responseHeaders).length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Response Headers:</span>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.responseHeaders, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.responseBody && (
                <div>
                  <span className="font-medium text-gray-600">Response Body:</span>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                    {typeof debugInfo.responseBody === 'string' 
                      ? debugInfo.responseBody 
                      : JSON.stringify(debugInfo.responseBody, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.errorDetails && (
                <div>
                  <span className="font-medium text-gray-600">Error Details:</span>
                  <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    {debugInfo.errorDetails}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Proposal */}
        {generatedProposal && (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '16px', 
            backgroundColor: '#f9fafb' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#22c55e', 
                borderRadius: '50%' 
              }}></div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151' 
              }}>Generated Proposal</span>
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#1f2937', 
              lineHeight: '1.625', 
              whiteSpace: 'pre-wrap', 
              backgroundColor: 'white', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #e5e7eb', 
              marginBottom: '16px' 
            }}>
              {generatedProposal.text}
            </div>
            
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: copied ? '#22c55e' : '#4f46e5',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = '#4338ca'
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = '#4f46e5'
                }
              }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Proposal'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

async function getAIConfig(): Promise<{provider: string, apiKey: string, model: string}> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aiProvider', 'apiKeys', 'selectedModel'], (result) => {
      const provider = result.aiProvider || 'groq'
      const apiKeys = result.apiKeys || {}
      resolve({
        provider,
        apiKey: apiKeys[provider] || '',
        model: result.selectedModel || 'llama-3.3-70b-versatile'
      })
    })
  })
}

async function callGroqAPI(apiKey: string, model: string, prompt: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })
  })
  
  return response
}

async function callGeminiAPI(apiKey: string, model: string, prompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  })
  
  return response
}

async function callHuggingFaceAPI(apiKey: string, model: string, prompt: string) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7
      }
    })
  })
  
  return response
}

async function buildPrompt(jobDescription: string, settings: ProposalSettings): Promise<string> {
  const detectedLanguage = settings.language === 'Auto-detect' 
    ? detectLanguage(jobDescription) 
    : settings.language

  // Check for custom prompt
  const customPrompt = await getCustomPrompt()
  
  if (customPrompt && customPrompt.trim()) {
    // Replace variables in custom prompt
    return customPrompt
      .replace(/{jobDescription}/g, jobDescription)
      .replace(/{tone}/g, settings.tone)
      .replace(/{goal}/g, settings.goal)
      .replace(/{language}/g, detectedLanguage)
  }

  // Default prompt - optimized for effectiveness
  return `You are a top-performing freelance proposal writer with a 90% win rate.

Write a compelling freelance proposal that gets hired. Your proposal must:

STRUCTURE:
1. Strong opening hook that mirrors their exact needs
2. 2-3 bullet points of relevant experience/results
3. Clear next steps and timeline
4. Professional closing

REQUIREMENTS:
- Tone: ${settings.tone}
- Goal: ${settings.goal}
- Language: ${detectedLanguage}
- Length: 150-200 words maximum
- No generic phrases or filler words
- Include specific technical skills mentioned in the job
- Show understanding of their business/industry

JOB POST:
${jobDescription}

Write the proposal now. Be direct, confident, and results-focused.`
}

async function getCustomPrompt(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['customPrompt'], (result) => {
      resolve(result.customPrompt || '')
    })
  })
}

function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase()
  
  // Russian detection
  const russianWords = ['и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'о', 'об', 'за', 'при', 'без', 'работа', 'опыт', 'проект']
  const russianCount = russianWords.filter(word => lowerText.includes(word)).length
  
  // Spanish detection  
  const spanishWords = ['que', 'para', 'con', 'una', 'por', 'como', 'trabajo', 'de', 'la', 'el', 'en', 'y']
  const spanishCount = spanishWords.filter(word => lowerText.includes(word)).length
  
  // French detection
  const frenchWords = ['que', 'pour', 'avec', 'une', 'par', 'comme', 'travail', 'de', 'la', 'le', 'et', 'dans']
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length
  
  if (russianCount > 3) return 'Russian'
  if (spanishCount > 3) return 'Spanish'
  if (frenchCount > 3) return 'French'
  return 'English'
}

export default App