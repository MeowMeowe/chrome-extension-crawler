let currentState_meow = 'init';
let currentISSN_meow = '';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 'msg-get':
            currentISSN_meow = message.issn;
            performSearch(message.issn);
            break;
    }
    return true;
});

async function performSearch(issn) {
    try {
        await waitForElement('#yearissue0', 30000);
        // 获取期刊链接
        document.querySelector('#J_sumBtn-stretch').click();

        const yearList = document.querySelectorAll('#YearIssueTree #yearissue0 dl');
        for (const yearWrap of yearList) {
            const year = yearWrap.querySelector('dt');
            const yearText = year.textContent.trim();
            if (![2024].includes(parseInt(yearText))) continue;
            year.click();
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 200));
            const yearContent = yearWrap.querySelectorAll('dd a');
            for (const month of yearContent) {
                let tempList = [];
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 100));
                month.click();
                await waitForElement('.name', false, 60000);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
                await waitForElement('.name', false, 60000);
                const version = document.querySelector('.date-list')?.innerText.trim() || '';
                const articlelist = document.querySelectorAll('#rightCataloglist #CataLogContent .row');
                for (const content of articlelist) {
                    const title = content.querySelector('.name a')?.innerText.trim() || '';
                    const author = content.querySelector('.author')?.innerText.trim() || '';
                    const contentUrl = content.querySelector('.name a')?.getAttribute('href') || '';
                    tempList.push({ url: contentUrl, version, issn, title, author });
                }
                console.log(tempList);
                await processTempList(tempList);
            }
        }

    } catch (error) {
        chrome.runtime.sendMessage({
            type: 'task-failed',
            error: error.message
        });
    }
}



async function processTempList(tempList) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'article-batch-process',
            data: tempList,
            issn: currentISSN_meow
        }, (response) => {
            if (response?.done) {
                resolve();
            }
        });
    });
}


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