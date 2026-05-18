document.getElementById('exportFile').addEventListener('click', async () => {
  const format = document.getElementById('formatSelect').value;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: "download", format: format });
});

document.getElementById('copyClip').addEventListener('click', async () => {
  const format = document.getElementById('formatSelect').value;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: "copy", format: format });
});