import React, { useState, useEffect } from 'react'

interface AIProvider {
  id: string
  name: string
  description: string
  models: string[]
  apiUrl: string
  freeLimit: string
  setupUrl: string
}

interface SettingsData {
  aiProvider: string
  apiKeys: { [provider: string]: string }
  selectedModel: string
  defaultTone: string
  defaultGoal: string
  defaultLanguage: string
  customPrompt: string
  autoInject: boolean
}

interface ValidationState {
  isValidating: boolean
  isValid: boolean
  error: string | null
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference, most generous free tier',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    freeLimit: '14,400 requests/day',
    setupUrl: 'https://console.groq.com/keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'High-quality responses from Google',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash-001'],
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
    freeLimit: '1,500 requests/day',
    setupUrl: 'https://aistudio.google.com/app/apikey'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Completely free, open-source models',
    models: ['meta-llama/Llama-3.1-8B-Instruct', 'deepseek-ai/DeepSeek-V3-0324'],
    apiUrl: 'https://api-inference.huggingface.co/models/',
    freeLimit: 'Unlimited (rate limited)',
    setupUrl: 'https://huggingface.co/settings/tokens'
  }
]

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    aiProvider: 'groq',
    apiKeys: {},
    selectedModel: '',
    defaultTone: 'Bold',
    defaultGoal: 'Fast Closure',
    defaultLanguage: 'Auto-detect',
    customPrompt: '',
    autoInject: false
  })
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: false,
    error: null
  })
  const [saved, setSaved] = useState(false)

  const currentProvider = AI_PROVIDERS.find(p => p.id === settings.aiProvider)
  const currentApiKey = settings.apiKeys[settings.aiProvider] || ''

  useEffect(() => {
    chrome.storage.sync.get([
      'aiProvider',
      'apiKeys',
      'selectedModel',
      'defaultSettings',
      'customPrompt',
      'autoInject'
    ], (result) => {
      setSettings({
        aiProvider: result.aiProvider || 'groq',
        apiKeys: result.apiKeys || {},
        selectedModel: result.selectedModel || '',
        defaultTone: result.defaultSettings?.tone || 'Bold',
        defaultGoal: result.defaultSettings?.goal || 'Fast Closure',
        defaultLanguage: result.defaultSettings?.language || 'Auto-detect',
        customPrompt: result.customPrompt || '',
        autoInject: result.autoInject || false
      })
    })

  }, [])

  // Reset validation when provider changes
  useEffect(() => {
    setValidation({
      isValidating: false,
      isValid: false,
      error: null
    })
  }, [settings.aiProvider])

  useEffect(() => {
    // Set default model when provider changes
    if (currentProvider && !settings.selectedModel) {
      setSettings(prev => ({ ...prev, selectedModel: currentProvider.models[0] }))
    }
  }, [settings.aiProvider, currentProvider, settings.selectedModel])

  const validateApiKey = async () => {
    if (!currentApiKey.trim()) {
      setValidation({ isValidating: false, isValid: false, error: 'API key is required' })
      return
    }

    setValidation({ isValidating: true, isValid: false, error: null })

    try {
      let isValid = false
      
      if (settings.aiProvider === 'groq') {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${currentApiKey}` }
        })
        isValid = response.ok
      } else if (settings.aiProvider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${currentApiKey}`)
        isValid = response.ok
      } else if (settings.aiProvider === 'huggingface') {
        const response = await fetch('https://huggingface.co/api/whoami', {
          headers: { 'Authorization': `Bearer ${currentApiKey}` }
        })
        isValid = response.ok
      }

      if (isValid) {
        setValidation({ isValidating: false, isValid: true, error: null })
      } else {
        setValidation({ isValidating: false, isValid: false, error: 'Invalid API key' })
      }
    } catch (error) {
      setValidation({ isValidating: false, isValid: false, error: 'Failed to validate API key' })
    }
  }

  const updateApiKey = (newKey: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [settings.aiProvider]: newKey
      }
    }))
    
    // Reset validation when key changes
    setValidation({ isValidating: false, isValid: false, error: null })
  }

  const handleSave = () => {
    if (!validation.isValid) {
      return // Don't save if not validated
    }

    chrome.storage.sync.set({
      aiProvider: settings.aiProvider,
      apiKeys: settings.apiKeys,
      selectedModel: settings.selectedModel || currentProvider?.models[0],
      defaultSettings: {
        tone: settings.defaultTone,
        goal: settings.defaultGoal,
        language: settings.defaultLanguage
      },
      customPrompt: settings.customPrompt,
      autoInject: settings.autoInject
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }


  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your AI provider and customize proposal generation</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Provider</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">
                Choose AI Provider
              </label>
              <div className="space-y-3">
                {AI_PROVIDERS.map((prov) => (
                  <div key={prov.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                       onClick={() => setSettings(prev => ({ ...prev, aiProvider: prov.id }))}>
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="provider"
                        value={prov.id}
                        checked={settings.aiProvider === prov.id}
                        onChange={() => setSettings(prev => ({ ...prev, aiProvider: prov.id }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-800">{prov.name}</h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {prov.freeLimit}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{prov.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentProvider && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    API Key for {currentProvider.name}
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={currentApiKey}
                        onChange={(e) => updateApiKey(e.target.value)}
                        placeholder={currentProvider.id === 'groq' ? 'gsk_...' : currentProvider.id === 'gemini' ? 'AI...' : 'hf_...'}
                        className={`flex-1 p-3 border rounded-md ${
                          validation.isValid 
                            ? 'border-green-500 bg-green-50' 
                            : validation.error 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      />
                      <button
                        onClick={validateApiKey}
                        disabled={validation.isValidating || !currentApiKey.trim()}
                        className={`px-4 py-3 rounded-md font-medium transition-colors ${
                          validation.isValidating
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : validation.isValid
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                        }`}
                      >
                        {validation.isValidating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Validating
                          </div>
                        ) : validation.isValid ? (
                          '✅ Valid'
                        ) : (
                          'Validate'
                        )}
                      </button>
                    </div>
                    
                    {validation.error && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ❌ {validation.error}
                      </p>
                    )}
                    
                    {validation.isValid && (
                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✅ API key validated successfully!
                      </p>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Get your free API key from{' '}
                    <a href={currentProvider.setupUrl} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      {currentProvider.name} Console
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.selectedModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, selectedModel: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    {currentProvider.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Preferences</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Tone</label>
              <select
                value={settings.defaultTone}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTone: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Bold">Bold</option>
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Confident">Confident</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Goal</label>
              <select
                value={settings.defaultGoal}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultGoal: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Fast Closure">Fast Closure</option>
                <option value="Build Rapport">Build Rapport</option>
                <option value="Show Expertise">Show Expertise</option>
                <option value="Competitive Edge">Competitive Edge</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Auto-detect">Auto-detect</option>
                <option value="English">English</option>
                <option value="Russian">Russian</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Prompt Template</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Customize AI Prompt (Optional)
            </label>
            <textarea
              value={settings.customPrompt}
              onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
              placeholder="You are an elite freelance proposal writer.&#10;&#10;Write a compelling proposal for: {jobDescription}&#10;&#10;Use tone: {tone}, Goal: {goal}, Language: {language}&#10;&#10;Make it persuasive and personalized..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none text-sm font-mono"
            />
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">💡 Available Variables:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <code className="bg-blue-100 px-2 py-1 rounded">{'{jobDescription}'}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{'{tone}'}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{'{goal}'}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{'{language}'}</code>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Leave empty to use the default template. Custom prompts override all default behavior.
              </p>
            </div>
          </div>
        </div>



        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex gap-3">
            <button
              onClick={() => window.close()}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!validation.isValid}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                validation.isValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saved ? '✅ Saved!' : validation.isValid ? 'Save Settings' : 'Validate API Key First'}
            </button>
          </div>
          
          {!validation.isValid && currentApiKey && !validation.error && (
            <p className="text-sm text-gray-600 mt-3 text-center">
              Please validate your API key before saving settings
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings