
const iframe = document.getElementById('pageIframe');
const getPageButton = document.getElementById('getPageButton');
const urlInput = document.getElementById('urlInput');

// 监听按钮点击事件
getPageButton.addEventListener('click', () => {
    const url = urlInput.value;
    iframe.src = url;
});

