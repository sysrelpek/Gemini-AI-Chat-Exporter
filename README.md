# Gemini Chat Exporter

A lightweight, privacy-focused Firefox extension designed to extract your active Gemini chat sessions and export them into multiple clean, structured formats. 

Whether you need a clean **Markdown** file for your note-taking apps, a raw **JSON** structure for your personal archives, or an **Official HTML layout** that replicates Google's native account history layout, this extension handles parsing dynamically without your data ever leaving your machine.

---

## ✨ Features & Functions

* **Multi-Format Export Support:**
    * **Official HTML Style:** Generates an HTML document that matches the official `MyActivity.html` layout from Google Takeout (complete with Material Design structural card layout panels).
    * **Markdown (`.md`):** Perfect for Obsidian, Notion, or GitHub documentation. Clean structural parsing preserving code blocks.
    * **Plain Text Layout (`.txt.html`):** Custom-formatted text block view maintaining distinct user configurations.
    * **Structured JSON (`.json`):** Clean key-value storage mapping rolls, data blocks, and timestamps for programmatic manipulation.
* **Copy to Clipboard:** Instantly copy your formatted chats directly into your clipboard without clogging up your local Downloads directory.
* **Code & Custom Typography Controls:** Features an editable developer runtime configuration object (`EXPORT_CONFIG`) right at the top of the content script. Easily modify the font family and sizing for standard text blocks and specialized programming code segments (e.g., Python, JavaScript) to control exact export layouts.
* **Privacy Centric:** No telemetry, zero tracking scripts, and restricted scope definitions (`host_permissions`) that only activate code logic when actively resting on the `gemini.google.com` domain dashboard.

---

## 🚀 How to Load and Test Temporarily in Firefox

To test the extension locally without sending it to the Mozilla marketplace:

1.  Clone this repository or download the source folder onto your computer.
2.  Open **Firefox** and type `about:debugging` into the URL address bar, then press Enter.
3.  Click on **"This Firefox"** in the left-hand sidebar menu.
4.  Click the **"Load Temporary Add-on..."** button.
5.  Navigate into your project folder and select the **`manifest.json`** file.

> ⚠️ **Note:** Temporarily loaded extensions are automatically discarded when you close Firefox. If you restart your browser, you will need to repeat this step to test code variations.

---

## 📦 How to Create a Permanent Extension in Firefox

If you want to use this tool permanently without it resetting when you close your browser, Firefox requires extensions to be digitally signed by Mozilla.

### Step 1: Package Your Code
Compress the contents of your extension folder into a standard ZIP archive. 
* *Note:* Ensure the `manifest.json` is at the root level of your ZIP folder, not nested inside an extra subfolder wrapper.

### Step 2: Submit for Self-Signing
1.  Go to the [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/) and log in with your Firefox account.
2.  Click **"Submit a New Add-on"**.
3.  Select **"On your own"** when asked how you want your add-on to be distributed (this means you want a private `.xpi` installer file rather than listing it publicly on the store marketplace).
4.  Upload your packaged `.zip` file.
5.  Mozilla's automated scanner will review your code for safety violations within a few minutes.

### Step 3: Install Permanently
Once approved, you will be able to download your signed **`.xpi` package file**. 
Drag and drop that `.xpi` file directly into any open Firefox tab, or go to `about:addons` and select *"Install Add-on From File"* from the settings gear icon to lock the extension permanently into your browser.

---

## 💡 Usage Instructions

1.  Navigate to **[gemini.google.com](https://gemini.google.com)** and open the conversation thread you want to archive.
2.  Click the **Gemini Chat Exporter** extension puzzle icon located up inside your browser's top toolbar menu.
3.  Choose your desired framework targets inside the **"Choose Format"** dropdown menu box.
4.  Click **Download File** to generate your document asset straight to your browser's local file tracking folder, or click **Copy to Clipboard** to pipe the raw data straight into your system clipboard storage cache.

### Customizing Styles (Advanced)
To alter fonts or styling arrays prior to generation, open `content.js` and alter the parameters matching your criteria inside the config scope declaration block:

```javascript
const EXPORT_CONFIG = {
  body: {
    fontType: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '14px'
  },
  code: {
    fontType: 'Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '13px'
  }
};