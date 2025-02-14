let currentState_meow = 'init';
let currentISSN_meow = '';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 'init-search':
            currentISSN_meow = message.issn;
            performSearch(message.issn);
            break;
    }
    return true;
});

async function performSearch(issn) {
    try {
        await waitForElement('#txt_1_sel', 30000);

        // 设置搜索类型
        const select = document.querySelector('#txt_1_sel');
        select.value = 'CN|=?';
        select.dispatchEvent(new Event('change'));

        // 输入ISSN
        const input = document.querySelector('#txt_1_value1');
        input.value = issn;

        // 随机延迟
        await delay(1000 + Math.random() * 2000);

        // 执行搜索
        document.querySelector('#btnSearch').click();

        // 等待结果
        await waitForElement('.result', 30000);
        currentState_meow = 'search-results';

        // 获取期刊链接
        const link = document.querySelector('.result dd:first-child .re_brief h1 a');
        const journalUrl = new URL(link.href, location.href).href;

        // 打开新标签处理期刊详情
        chrome.runtime.sendMessage({
            type: 'open-journal-tab',
            url: journalUrl,
            issn: issn
        });

    } catch (error) {
        chrome.runtime.sendMessage({
            type: 'task-failed',
            error: error.message
        });
    }
}

// // 页面加载完成处理
// if (document.readyState === 'complete') {
//     initPage();
// } else {
//     document.addEventListener('DOMContentLoaded', initPage);
// }

// async function initPage() {
//     await delay(1000);
//     alert('initPage');
//     chrome.runtime.sendMessage({ type: 'page-ready' });
// }

// 工具函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForElement(selector, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (document.querySelector(selector)) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error(`Element ${selector} not found`));
            } else {
                setTimeout(check, 500);
            }
        };
        check();
    });
}