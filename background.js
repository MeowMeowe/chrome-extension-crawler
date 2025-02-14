const TARGET_URL = 'https://navi.cnki.net/knavi/all/index';
const POST_API = 'http://wjgs.shanghairanking.cn/api2/v1/cnki';

let currentTask = null;       // 当前处理任务
let taskQueue = [];           // 待处理任务队列
let isCrawling = false;       // 爬取状态标志

let articleQueue = [];           // 待处理文章队列
let activeArticleTabs = new Map(); // 存储当前打开的article tab

// 消息监听处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'start-crawl':
            taskQueue = message.data;
            currentTask = taskQueue.shift()
            startCrawling(TARGET_URL, currentTask.CN_ISSN, 1);
            sendResponse({ status: 'index started' }); // 添加响应
            break;
        case 'crawl-next':
            currentTask = taskQueue.shift()
            startCrawling(TARGET_URL, currentTask.CN_ISSN, 1);
            sendResponse({ status: 'next started' }); // 添加响应
            break;

        case 'stop-crawl':
            stopCrawling();
            sendResponse({ status: 'stopped' }); // 添加响应
            break;

        case 'open-journal-tab':
            startCrawling(message.url, message.issn, 2);
            sendResponse({ status: 'journal started' }); // 添加响应
            break;

        case 'article-batch-process':
            articleQueue = message.data;
            startArticleCrawling(message.data, message.issn, 3);
            sendResponse({ status: 'article started' }); // 添加响应
            break;


        case 'article-data':
            handleArticleData(message.data, message.tabId)
                .then(() => sendResponse({ status: 'ok' })) // 添加响应
                .catch(error => sendResponse({ status: 'error', error }));
            return true; // 保持连接等待异步操作

        default:
            sendResponse({ status: 'error', message: 'Unknown message type' });
    }

});

// 停止爬取
function stopCrawling() {
    isCrawling = false;
    taskQueue.pop(currentTask)
}


async function startArticleCrawling(list, issn, step) {
    for (const item of list) {
        try {
            await startCrawling(item.url, issn, step); // 你的实际处理逻辑
        } catch (error) {
            console.error(`处理失败 ${item.url}:`, error);
        }
    }

}

// 创建任务标签页
async function startCrawling(url, issn, step) {
    if (step === 1 || step === 2) {
        chrome.tabs.update({
            url: url,
            active: true
        }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error(JSON.stringify(chrome.runtime.lastError));
                return chrome.runtime.lastError;
            }
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    handlePageReady(tabId, issn, step)
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    } else if (step == 3) {
        chrome.tabs.create({
            url: url,
            active: false
        }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error(JSON.stringify(chrome.runtime.lastError));
                return chrome.runtime.lastError;
            }
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    handlePageReady(tabId, issn, step)
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }
}

// 处理页面准备就绪
async function handlePageReady(tabId, issn, step) {
    console.log('页面准备就绪', tabId, issn)
    try {
        if (step === 1) {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });

            await chrome.tabs.sendMessage(tabId, {
                type: 'init-search',
                issn: issn
            });
        } else if (step === 2) {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content2.js']
            });

            await chrome.tabs.sendMessage(tabId, {
                type: 'msg-get',
                issn: issn
            });
        } else if (step === 3) {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content3.js']
            });

            await chrome.tabs.sendMessage(tabId, {
                type: 'article-get',
                issn: issn
            });
        }


    } catch (error) {
        await handleTaskError(issn, error, tabId);
        throw error; // 重新抛出错误以便调用者处理
    }
}

// 处理文章数据
async function handleArticleData(data, tabId) {
    const tabData = activeTabs.get(tabId);
    if (!tabData) {
        throw new Error(`Tab ${tabId} not found in active tabs`);
    }

    try {
        const response = await fetch(POST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        chrome.runtime.sendMessage({
            type: 'task-progress',
            task: tabData.task,
            status: 'completed'
        });

        await chrome.tabs.remove(tabId);
        activeTabs.delete(tabId);

        processQueue();

    } catch (error) {
        await handleTaskError(tabData.task, error, tabId);
        throw error; // 重新抛出错误以便调用者处理
    }
}

// 错误处理
async function handleTaskError(task, error, tabId) {
    console.error(`任务错误: ${task.CN_ISSN}`, error);

    const tabData = activeTabs.get(tabId) || {};
    if (tabData.retryCount < 3) {
        // 重试逻辑
        tabData.retryCount++;
        activeTabs.set(tabId, tabData);
        await chrome.tabs.reload(tabId);
    } else {
        // 最终失败处理
        chrome.runtime.sendMessage({
            type: 'task-progress',
            task,
            status: 'failed',
            error: error.message
        });

        if (tabId) {
            await chrome.tabs.remove(tabId);
            activeTabs.delete(tabId);
        }
        processQueue();
    }
}

// 标签页状态监控
chrome.tabs.onRemoved.addListener((tabId) => {
    if (activeTabs.has(tabId)) {
        const task = activeTabs.get(tabId).task;
        handleTaskError(task, new Error('标签页意外关闭'), tabId);
    }
});