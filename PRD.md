**Technical Specification (TZ) — Freelance Proposal Chrome Extension**

---

**Project Name:** Freelance Proposal AI Extension ("KillSwitch")

**Purpose:**
An intelligent Chrome extension that allows freelancers to auto-generate highly tailored, conversion-optimized proposals for job posts (Upwork, Fiverr, Freelancer, etc.) directly via context menu, with no copy-paste required. It learns from user feedback to sound more like the user over time.

---

### 1. **Core Features**

#### 1.1 Right-Click Context Menu

* **Trigger:** User selects job description text
* **Action:** Right-click → select extension icon → opens extension popup
* **Behavior:** Automatically passes selected text into extension’s textarea

#### 1.2 Extension Popup (Popup.html/Popup.tsx)

* Minimalistic, elegant UI using shadcn/ui + Tailwind
* **Fields:**

  * Textarea (auto-filled from context selection)
  * Dropdown: Proposal Language (Optional — if not selected, language is auto-detected from job description)
  * Dropdown: Proposal Tone (Default: "Bold")
  * Dropdown: Proposal Goal (Default: "Fast Closure")
  * Button: "Generate Proposal"
  * Button: "Inject into Job Post"
* Displays loader during proposal generation
* Shows generated proposal in a stylized card with feedback buttons:

  * ✅ "Sounds like me"
  * ❌ "Off the mark"

#### 1.3 Settings Page (Standalone Tab)

* Accessible via extension settings or footer link
* Fields:

  * Custom Prompt Override (optional)
  * Default Tone, Language, and Goal settings
  * Toggle: Auto-inject vs. manual copy
  * Clear Feedback History

---

### 2. **Prompt Engine**

#### 2.1 Prompt Builder Logic (Client-side or Backend API)

Generates structured prompt string to send to LLM:

```ts
function buildPrompt({ jobDescription, tone, goal, language, userTraits }) {
  const detectedLanguage = language || detectLanguage(jobDescription);
  return `You are an elite freelance proposal writer.\n\nYour task is to write a short, persuasive freelance proposal that:\n- Mirrors the tone of the job post\n- Shows deep understanding of the client\n- Highlights only relevant experience\n- Avoids vague fluff\n- Uses this tone: ${tone || 'Bold'}\n- Aims to: ${goal || 'Fast Closure'}\n- In: ${detectedLanguage}\n\nJob Description:\n${jobDescription}\n\nUser Traits:\n${userTraits.join("\n")}`;
}
```

#### 2.2 Feedback Loop

* Every proposal includes binary feedback:

  * ✅ adds +1 to tone/goal alignment score
  * ❌ triggers a record of divergence (stores JD, tone, and poor score)
* Learns over time:

  * Stores user preferences (locally or via Supabase/Cloud)
  * Updates prompt weightings based on trends (e.g., prefers shorter closers, bold hooks, etc.)

---

### 3. **Tech Stack**

* **Frontend (Popup + Settings Page):**

  * React + TypeScript
  * TailwindCSS
  * shadcn/ui
  * Vite or Next.js

* **Chrome APIs:**

  * `contextMenus`
  * `storage`
  * `tabs`
  * `scripting` (for content script injection)

* **LLM API:**

  * OpenAI (gpt-4o) or Claude v3 (via fetch request)
  * Use `fetch('/api/generate')` endpoint

* **Backend (Optional, if storing preferences):**

  * Node.js + Express
  * Supabase/PostgreSQL or Firebase

---

### 4. **Proposal Injection (Content Script)**

* `content.js`
* Injects proposal text into the first visible `<textarea>` or known selector on job site (Upwork etc.)
* Simulates keyboard events to trigger site updates (if needed)

Example:

```js
document.querySelector('textarea[name="proposal"]')?.focus();
document.execCommand('insertText', false, generatedText);
```

---

### 5. **Build & Deployment**

* Bundle using Vite/Webpack (with Manifest v3)
* Dev script with hot-reload for popup
* Deployment:

  * Package as `.zip` for Chrome Web Store
  * Optional: CI/CD via GitHub + Extension CLI

---

### 6. **Future Add-ons (Not in MVP)**

* Proposal Snippet Library
* Team Sync (shared prompt config)
* Proposal Performance Analytics
* Platform Auto-Detection (Upwork/Fiverr injection logic)

---

### 7. **Monetization Roadmap**

* Freemium: X proposals/day + locked settings
* Pro Tier: Unlimited + personalization + auto-inject
* Enterprise: Team-wide config sync
* One-time Lifetime: For local-only users

---

**Conclusion:**
You're building the ultimate freelance weapon—part AI, part chrome extension, part dark wizardry. This spec defines every piece needed to make it real, scalable, and ruthlessly effective.
