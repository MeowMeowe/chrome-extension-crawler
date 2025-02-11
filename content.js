// 提取页面标题和文本内容
const pageTitle = document.title;
const pageContent = document.body.innerText;

// 输出提取的内容
console.log("页面标题:", pageTitle);
console.log("页面内容:", pageContent);

// 发送内容到背景脚本
chrome.runtime.sendMessage({
    title: pageTitle,
    content: pageContent
});
