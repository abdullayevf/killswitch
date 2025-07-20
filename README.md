<div align="center">

# 🔥 KillSwitch
### AI-Powered Freelance Proposal Generator

<p>
  <img src="https://img.shields.io/badge/TypeScript-89%25-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Lines-1.3k-green?style=flat-square" alt="Lines of Code" />
  <img src="https://img.shields.io/badge/Files-19-orange?style=flat-square" alt="File Count" />
  <img src="https://img.shields.io/badge/License-ISC-red?style=flat-square" alt="License" />
</p>

<p>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_v3-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/AI_APIs-4_Providers-FF6B35?style=flat-square" alt="AI APIs" />
</p>

*Generate winning freelance proposals in seconds using AI - context-aware, personalized, and conversion-optimized.*

</div>

---

## ✨ Features

- **🎯 Context Menu Integration**: Select job description text and generate proposals via right-click
- **🤖 Multi-AI Provider Support**: Choose from OpenAI, Groq, Gemini, or HuggingFace models
- **⚙️ Customizable Generation**: Fine-tune tone, goal, and language for each proposal
- **📋 Copy-to-Clipboard Workflow**: Generate, review, and copy proposals to paste anywhere
- **🧠 Feedback Learning System**: Rate proposals to help improve future generations
- **🌍 Multi-Platform Support**: Works on Upwork, Fiverr, Freelancer, and any job site

## Installation

### For Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Setup

1. **Choose your AI provider** and get an API key:
   - [OpenAI](https://platform.openai.com/api-keys) (GPT models)
   - [Groq](https://console.groq.com/keys) (Fast Llama models) 
   - [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini models)
   - [HuggingFace](https://huggingface.co/settings/tokens) (Open source models)

2. Click the extension icon and go to **Settings**
3. Select your AI provider and enter your API key
4. Configure default tone, goal, and language preferences

## 🚀 Usage

### Quick Start Workflow

1. **📝 Via Context Menu**: 
   - Select job description text on any freelance platform
   - Right-click and choose "Generate KillSwitch Proposal"
   - Extension popup opens with text pre-filled

2. **⚡ Manual Entry**:
   - Click the extension icon in Chrome toolbar
   - Paste or type the job description
   - Adjust tone, goal, and language settings
   - Click "Generate Proposal"

3. **📋 Copy & Use**:
   - Review the AI-generated proposal
   - Click "Copy Proposal" to clipboard
   - Paste into the job platform's proposal form

4. **🎯 Provide Feedback**:
   - Rate with ✅ "Sounds like me" or ❌ "Off the mark"
   - Extension learns your preferences for better future proposals

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview build

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + TailwindCSS 4
- **Build System**: Vite 7 with Chrome Extension Manifest v3
- **AI Providers**: OpenAI, Groq, Google Gemini, HuggingFace APIs
- **Storage**: Chrome Storage API (sync & local) for user settings
- **Extension APIs**: Context Menus, Tabs, Scripting permissions

## 📁 File Structure

```
src/
├── App.tsx              # Main popup component with AI integration
├── Settings.tsx         # Multi-provider settings configuration
├── background.ts        # Service worker (context menu handling)
├── content.ts          # Content script for platform detection
├── main.tsx            # Popup entry point
├── settings-main.tsx   # Settings page entry point
└── index.css           # TailwindCSS + custom styles

assets/                 # Extension assets
├── logo*.png          # Extension icons (16px, 48px, 128px)
├── Screenshot*.png    # Chrome Web Store screenshots
└── *-promo-*.png     # Store promotional images

manifest.json          # Chrome Extension Manifest v3
popup.html            # Extension popup interface
settings.html         # Settings page interface
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Run `npm run build` to ensure builds work
5. Submit a pull request with clear description

## 📄 License

**ISC** - See LICENSE file for details

---

<div align="center">

**⭐ Star this repo if KillSwitch helps you win more freelance jobs!**

*Built with ❤️ for the freelance community*

</div>