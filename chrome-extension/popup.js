const s = document.getElementById("s");
const show = (r) => (s.textContent = !r?.paired ? "غير مقترن — افتح صفحة الربط في الموقع" : r.enabled ? "متصل ويستقبل الأوامر" : "متوقف");
chrome.runtime.sendMessage({ type: "status" }, show);
document.getElementById("start").onclick = () => chrome.runtime.sendMessage({ type: "start" }, show);
document.getElementById("stop").onclick = () => chrome.runtime.sendMessage({ type: "stop" }, show);
