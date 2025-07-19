# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KillSwitch** is a Chrome extension that auto-generates tailored freelance proposals for job posts on platforms like Upwork, Fiverr, and Freelancer. The extension uses AI to create conversion-optimized proposals directly via context menu with learning capabilities from user feedback.

## Project Status

This is a greenfield project with only the PRD.md specification file currently present. No code has been implemented yet.

## Planned Architecture

Based on the technical specification in PRD.md:

### Frontend Components
- **Chrome Extension Popup** (React + TypeScript + shadcn/ui + Tailwind)
  - Context menu integration for job description selection
  - Proposal generation interface with tone/goal/language settings
  - Feedback system (✅ "Sounds like me" / ❌ "Off the mark")
- **Settings Page** (Standalone tab)
  - Custom prompt overrides
  - Default preferences configuration
  - Feedback history management

### Core Systems
- **Prompt Engine**: Client-side or backend API for structured LLM prompts
- **Feedback Loop**: Binary feedback system for personalization learning
- **Content Script**: Proposal injection into job site textareas

### Tech Stack (Planned)
- React + TypeScript
- TailwindCSS + shadcn/ui
- Vite or Next.js for bundling
- Chrome APIs: contextMenus, storage, tabs, scripting
- LLM API: OpenAI GPT-4o or Claude v3
- Optional backend: Node.js + Express with Supabase/PostgreSQL

## Development Commands

No package.json or build scripts exist yet. When implementing, typical Chrome extension development would involve:
- `npm run dev` - Development with hot-reload
- `npm run build` - Production bundle for Chrome Web Store
- `npm run test` - Unit tests (framework TBD)
- `npm run lint` - Code linting (ESLint + TypeScript)

## Key Implementation Notes

1. **Manifest v3 Compliance**: Chrome extension must use latest manifest version
2. **Content Security Policy**: Handle LLM API calls appropriately for extension context
3. **Site-Specific Injection**: Content script must handle different freelance platform layouts
4. **Local vs Cloud Storage**: User preferences and feedback can be stored locally or in cloud
5. **Language Detection**: Auto-detect job post language when not specified by user

## Security Considerations

- API keys for LLM services must be handled securely
- User data (feedback, preferences) should be stored with appropriate privacy protections
- Content script injection should be limited to known freelance platforms