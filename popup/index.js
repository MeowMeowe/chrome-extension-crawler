let currentData = {
    original: [],
    processed: [],
    remaining: [],
    currentTask: null
};

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const exportBtn = document.getElementById('export');
    const fileInput = document.getElementById('jsonUpload');

    // 初始化事件监听
    fileInput.addEventListener('change', handleFileSelect);
    startBtn.addEventListener('click', startCrawling);
    stopBtn.addEventListener('click', stopCrawling);
    exportBtn.addEventListener('click', exportResults);

    // 初始化日志
    logMessage('系统就绪，请选择JSON文件');
});

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            currentData.original = JSON.parse(e.target.result);
            currentData.remaining = [...currentData.original];
            updateUI();
            logMessage(`已加载文件：${file.name} (${currentData.original.length} 条记录)`);
        };
        reader.readAsText(file);
    } catch (error) {
        logMessage(`文件读取失败：${error.message}`, 'error');
    }
}

function updateUI() {
    document.getElementById('processed').textContent = currentData.processed.length;
    document.getElementById('remaining').textContent = currentData.remaining.length;

    const total = currentData.original.length;
    const progress = (currentData.processed.length / total) * 100 || 0;
    document.querySelector('.progress-bar').style.width = `${progress}%`;
    document.querySelector('.progress-text').textContent = `${progress.toFixed(1)}%`;
}

function logMessage(message, type = 'info') {
    const logOutput = document.getElementById('logOutput');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
      <span class="message">${message}</span>
    `;
    logOutput.prepend(logEntry);
    logOutput.scrollTop = 0;
}

async function startCrawling() {
    if (currentData.remaining.length === 0) {
        logMessage('没有待处理的任务', 'warning');
        return;
    }

    logMessage('开始采集任务...');
    chrome.runtime.sendMessage({
        type: 'start-crawl',
        data: currentData.remaining
    }, response => {
        if (response && response.status.includes('started')) {
            console.log('Crawling started successfully');
        } else {
            console.error('Failed to start crawling');
        }
    });
}

function stopCrawling() {
    chrome.runtime.sendMessage({ type: 'stop-crawl' });
    logMessage('采集任务已停止', 'warning');
}

function exportResults() {
    if (currentData.processed.length === 0) {
        logMessage('没有可导出的数据', 'warning');
        return;
    }

    const dataStr = JSON.stringify(currentData.processed, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `cnki-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logMessage('结果已导出');
}

// 接收来自background的处理结果
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'task-result') {
        currentData.processed.push(message.data);
        currentData.remaining = currentData.remaining.filter(
            item => item.CN_ISSN !== message.data.CN_ISSN
        );
        updateUI();
        logMessage(`已完成：${message.data.CN_ISSN}`);
    }

    if (message.type === 'task-error') {
        logMessage(`处理失败：${message.error}`, 'error');
    }
});