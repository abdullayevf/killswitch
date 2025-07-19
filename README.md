# KillSwitch - Freelance Proposal Generator

An intelligent Chrome extension that auto-generates highly tailored, conversion-optimized proposals for freelance job posts on platforms like Upwork, Fiverr, and Freelancer.

## Features

- **Context Menu Integration**: Select job description text and generate proposals via right-click
- **AI-Powered Generation**: Uses OpenAI GPT-4 to create personalized proposals
- **Customizable Settings**: Choose tone, goal, and language for proposals
- **Smart Injection**: Automatically inject proposals into freelance platform forms
- **Learning System**: Provide feedback to improve future proposals
- **Multi-Platform Support**: Works on Upwork, Fiverr, Freelancer, and more

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

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click the extension icon and go to Settings
3. Enter your API key and configure default preferences

## Usage

1. **Via Context Menu**: 
   - Select job description text on any webpage
   - Right-click and choose "Generate KillSwitch Proposal"
   - The extension popup will open with the text pre-filled

2. **Manual Entry**:
   - Click the extension icon
   - Paste or type the job description
   - Adjust tone, goal, and language settings
   - Click "Generate Proposal"

3. **Inject Proposal**:
   - After generation, click "Inject into Page" to automatically fill proposal forms
   - Or copy the text manually

4. **Provide Feedback**:
   - Use ✅ "Sounds like me" or ❌ "Off the mark" to help improve future proposals

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview build

## Architecture

- **Frontend**: React + TypeScript + TailwindCSS
- **Build**: Vite with Chrome extension configuration
- **AI**: OpenAI GPT-4 API integration
- **Storage**: Chrome storage API for settings and feedback

## File Structure

```
src/
├── App.tsx              # Main popup component
├── Settings.tsx         # Settings page component
├── background.ts        # Background script (context menu)
├── content.ts          # Content script (proposal injection)
├── main.tsx            # Popup entry point
├── settings-main.tsx   # Settings entry point
└── index.css           # Global styles

manifest.json           # Chrome extension manifest
popup.html             # Popup HTML
settings.html          # Settings page HTML
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## License

ISC