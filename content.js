// =========================================================================
// ⚙️ USER SETTINGS: ADJUST FONT-TYPES, SIZES, AND THEMES HERE
// =========================================================================
const EXPORT_CONFIG = {
  theme: 'dark',
  body: {
    fontType: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '12px'
  },
  code: {
    fontType: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontSize: '10px'
  }
};
// =========================================================================

// 1. Core Scraper: Recursively parses layout elements chronologically
function scrapeGeminiChat() {
  const prompts = document.querySelectorAll('user-query');
  const replies = document.querySelectorAll('.model-response-text message-content');
  const chatData = [];

  if (prompts.length === 0 && replies.length === 0) {
    alert("No chat messages found. Make sure you are on an active Gemini chat page!");
    return null;
  }

  const iterations = Math.max(prompts.length, replies.length);

  for (let i = 0; i < iterations; i++) {
    const replyNode = replies[i];
    let markdownResponse = "";

    if (replyNode) {
      // Create an isolated snapshot copy of the node to manipulate safely in memory
      const clone = replyNode.cloneNode(true);
      let paragraphs = [];

      // Recursive HTML to Markdown Converter preserving exact chronological flow
      function convertNodeToMarkdown(node, listContext = null, listIndex = 1) {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }

        const tagName = node.tagName.toLowerCase();

        // 1. Target Code Blocks
        if (tagName === 'pre') {
          let languageTitle = "";

          // Dig out the official code language header from Gemini's block wrappers
          const container = node.closest('.code-block, .code-code-block') || node.parentElement;
          if (container) {
            const headerTextNode = container.querySelector('.code-block-decoration, .code-block-decoration-header, .code-block-sub-header');
            if (headerTextNode) {
              let rawHeaderText = headerTextNode.innerText.replace(/copy/gi, '').replace(/code/gi, '').trim();
              if (rawHeaderText && rawHeaderText.length < 30) {
                languageTitle = rawHeaderText.charAt(0).toUpperCase() + rawHeaderText.slice(1).toLowerCase();
              }
            }
          }

          if (!languageTitle) {
            const codeElem = node.querySelector('code') || node;
            const classList = Array.from(codeElem.classList || []);
            const langClass = classList.find(c => c.startsWith('lang-') || c.startsWith('language-'));
            if (langClass) {
              const rawLang = langClass.replace('lang-', '').replace('language-', '').trim();
              languageTitle = rawLang.charAt(0).toUpperCase() + rawLang.slice(1).toLowerCase();
            }
          }

          let rawLines = node.innerText.split('\n');
          if (rawLines.length > 0 && languageTitle && rawLines[0].trim().toLowerCase() === languageTitle.toLowerCase()) {
            rawLines = rawLines.slice(1);
          }

          const cleanCodeLines = rawLines.filter(line => {
            const t = line.trim();
            return t !== "Copy code" && t !== "content_copy";
          });
          const coreCodePayload = cleanCodeLines.join('\n');

          // Return pure Markdown code fence block with Title on line 1 and 2 blank lines
          if (languageTitle) {
            return `\n\n\`\`\`\n${languageTitle}\n\n\n${coreCodePayload}\n\`\`\`\n\n`;
          } else {
            return `\n\n\`\`\`\n${coreCodePayload}\n\`\`\`\n\n`;
          }
        }

        // 2. Target Ordered/Unordered Lists containers
        if (tagName === 'ul' || tagName === 'ol') {
          let listResult = "\n";
          let idx = 1;
          node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'li') {
              listResult += convertNodeToMarkdown(child, tagName, idx) + "\n";
              idx++;
            }
          });
          return listResult + "\n";
        }

        // 3. Target List Items
        if (tagName === 'li') {
          let itemContent = "";
          node.childNodes.forEach(child => {
            itemContent += convertNodeToMarkdown(child, listContext);
          });
          if (listContext === 'ol') {
            return `${listIndex}. ${itemContent.trim()}`;
          } else {
            return `* ${itemContent.trim()}`;
          }
        }

        // 4. Target Structural Block Elements (Paragraphs, Headers)
        if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'blockquote') {
          let blockContent = "";
          node.childNodes.forEach(child => {
            blockContent += convertNodeToMarkdown(child, listContext);
          });

          let cleanBlock = blockContent.replace(/\r/g, '').trim();
          if (!cleanBlock || cleanBlock === "Copy code" || cleanBlock === "content_copy") return "";

          // Flatten manual breaks inside the text so paragraph lines fluid-wrap in PyCharm
          cleanBlock = cleanBlock.split('\n').map(l => l.trim()).join(' ');

          if (tagName === 'h1') return `\n\n# ${cleanBlock}\n\n`;
          if (tagName === 'h2') return `\n\n## ${cleanBlock}\n\n`;
          if (tagName === 'h3') return `\n\n### ${cleanBlock}\n\n`;
          if (tagName === 'blockquote') return `\n\n> ${cleanBlock}\n\n`;
          return `\n\n${cleanBlock}\n\n`;
        }

        // 5. Inline Formatting Layouts (Bold, Code spans)
        if (tagName === 'strong' || tagName === 'b') {
          return ` **${node.innerText.trim()}** `;
        }
        if (tagName === 'code') {
          return ` \`${node.innerText.trim()}\` `;
        }

        // Drop native Gemini decoration headers or copy buttons that clutter output
        if (node.classList && (node.classList.contains('code-block-decoration') || node.classList.contains('code-block-decoration-header') || node.classList.contains('code-block-sub-header') || tagName === 'button' || tagName === 'mat-icon')) {
          return "";
        }

        // For all other generic wrappers (div, span), keep processing children in chronological sequence
        let fallbackContent = "";
        node.childNodes.forEach(child => {
          fallbackContent += convertNodeToMarkdown(child, listContext);
        });
        return fallbackContent;
      }

      // Initialize recursive parsing of the response root node chronologically
      clone.childNodes.forEach(child => {
        markdownResponse += convertNodeToMarkdown(child);
      });

      // Format globally to fix extra spaces and maintain double-newline paragraph separation rules
      markdownResponse = markdownResponse
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line returns safely
        .replace(/```\n\n/g, '```\n') // Fix spacing on closing code blocks
        .trim();
    }

    chatData.push({
      prompt: prompts[i] ? prompts[i].innerText.trim() : "[No Prompt Found]",
      timestamp: new Date().toLocaleString('en-US', { hour12: true }),
      response: replies[i] ? replies[i].innerHTML.trim() : "[No Response Captured]",
      plainResponse: markdownResponse || "[No Response Captured]"
    });
  }

  return chatData;
}

// 2. Main Formatter engine
function formatData(data, format) {
  switch (format) {
    case 'activity_html': return generateMyActivityHtml(data);
    case 'json': return JSON.stringify({ exportedAt: new Date().toLocaleString(), chat: data }, null, 2);
    case 'txt': return generateConfiguredTextFile(data);
    case 'md':
    default: return generateConfiguredMarkdown(data);
  }
}

// 3. Official Google Activity Theme Generator
function generateMyActivityHtml(data) {
  const isDark = EXPORT_CONFIG.theme === 'dark';
  const colors = {
    bg: isDark ? '#121212' : '#EEEEEE', cardBg: isDark ? '#1e1e1e' : '#FFFFFF',
    text: isDark ? '#e0e0e0' : '#333333', subText: isDark ? '#aaaaaa' : 'rgba(0,0,0,0.54)',
    title: isDark ? '#8ab4f8' : '#1a73e8', border: isDark ? '#333333' : 'rgba(0,0,0,0.1)',
    codeBg: isDark ? '#2d2d2d' : '#f5f5f5', codeBorder: isDark ? '#444444' : '#e0e0e0'
  };

  const cardsHtml = data.map(item => `
    <div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp">
      <div class="mdl-grid">
        <div class="header-cell mdl-cell mdl-cell--12-col"><p class="mdl-typography--title">Gemini Apps<br></p></div>
        <div class="content-cell mdl-cell mdl-cell--12-col mdl-typography--body-1">
          <strong style="color: ${colors.title};">Prompted:</strong> ${escapeHtml(item.prompt)}<br>
          <span class="timestamp-sub">${item.timestamp}</span>
          <hr style="border:0; border-top:1px solid ${colors.border}; margin:12px 0;">
          <div class="response-payload">${item.response}</div><br>
        </div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>My Activity History</title><style>
html,body{font-family: ${EXPORT_CONFIG.body.fontType}; font-size: ${EXPORT_CONFIG.body.fontSize}; font-weight:400; line-height:22px; background:${colors.bg}; color: ${colors.text}; margin:0; padding:15px;}
.mdl-grid{display:flex; flex-flow:row wrap; max-width:900px; margin:0 auto; gap:20px;}
.outer-cell{background-color:${colors.cardBg}; border-radius:4px; width:100%; box-sizing:border-box; padding:20px;}
pre, code, pre * , code * { font-family: ${EXPORT_CONFIG.code.fontType} !important; font-size: ${EXPORT_CONFIG.code.fontSize} !important; }
pre { background-color:${colors.codeBg}; padding:12px; border-radius:4px; display:block; white-space:pre; overflow-x:auto; margin: 12px 0; border: 1px solid ${colors.codeBorder}; color:${colors.text}; }
</style></head><body><div class="mdl-grid">${cardsHtml}</div></body></html>`;
}

// 4. Custom Markdown Generator
function generateConfiguredMarkdown(data) {
  const timestampStr = new Date().toLocaleString();
  let markdown = `---\ntheme: ${EXPORT_CONFIG.theme}\nfont-family: ${EXPORT_CONFIG.body.fontType.replace(/"/g, '')}\nfont-size: ${EXPORT_CONFIG.body.fontSize}\nexported_at: ${timestampStr}\n---\n\n# Gemini Chat Export\n\n`;
  data.forEach(m => {
    markdown += `## 👤 User (Prompted)\n${m.prompt}\n\n## ♊ Gemini\n${m.plainResponse}\n\n---\n\n`;
  });
  return markdown;
}

// 5. Custom Text File Engine
function generateConfiguredTextFile(data) {
  const fileContent = data.map(m => {
    let sanitizedResponse = m.response.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, codeBlock) => {
      return `\n[--- CODE CONFIG BLOCK ---]\n${codeBlock.replace(/<[^>]*>/g, '')}\n[------------------------]\n`;
    }).replace(/<[^>]*>/g, '');
    return `PROMPTED:\n${m.prompt}\n\nRESPONSE:\n${sanitizedResponse}`;
  }).join('\n\n' + '='.repeat(60) + '\n\n');
  return `<!DOCTYPE html><html><body>${escapeHtml(fileContent)}</body></html>`;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 6. Downloader and Messenger Handlers
function triggerDownload(content, format) {
  let extension = format === 'activity_html' ? 'html' : format;
  if (format === 'txt') extension = 'txt.html';
  const mime = (format === 'activity_html' || format === 'txt') ? 'text/html' : (format === 'json' ? 'application/json' : 'text/plain');
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Gemini_Export_${new Date().toISOString().slice(0,10)}.${extension}`;
  a.click(); URL.revokeObjectURL(url);
}

browser.runtime.onMessage.addListener((request) => {
  const rawData = scrapeGeminiChat();
  if (!rawData) return;
  const formattedContent = formatData(rawData, request.format);
  if (request.action === "download") { triggerDownload(formattedContent, request.format); }
  else if (request.action === "copy") {
    navigator.clipboard.writeText(formattedContent).then(() => { alert(`Chat copied to clipboard!`); });
  }
});