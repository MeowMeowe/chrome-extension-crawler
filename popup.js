document.getElementById('scrapeButton').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: scrapeContent
        });
    });
});

function scrapeContent() {
    const pageTitle = document.title;
    const pageContent = document.body.innerText;
    alert(`页面标题: ${pageTitle}\n页面内容: ${pageContent}`);
}
