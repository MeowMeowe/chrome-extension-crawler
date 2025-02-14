// 用于存储用户的操作记录
let actions = [];
let actionStatus = 1; // 0: 暂停记录，1: 正在记录, 2: 已完成记录

// 记录点击事件
document.addEventListener('click', function (event) {
    const clickedElement = event.target;

    // 判断点击的是按钮、链接等可交互元素
    const action = {
        type: 'click',
        element: clickedElement.tagName, // 点击的元素类型，如 'BUTTON', 'A' 等
        id: clickedElement.id || null,
        class: clickedElement.className || null,
        text: clickedElement.innerText.trim() || null,
        timestamp: new Date().toISOString() // 记录点击时间
    };
    actions.push(action);
    console.log("记录点击行为: ", action);
});

// 记录输入事件
document.addEventListener('input', function (event) {
    const inputElement = event.target;

    // 仅记录输入框的值
    const action = {
        type: 'input',
        element: inputElement.tagName, // 输入的元素类型，如 'INPUT', 'TEXTAREA' 等
        id: inputElement.id || null,
        class: inputElement.className || null,
        value: inputElement.value.trim() || null,
        timestamp: new Date().toISOString() // 记录输入时间
    };
    actions.push(action);
    console.log("记录输入行为: ", action);
});

// 记录选择下拉框事件
document.addEventListener('change', function (event) {
    const selectElement = event.target;

    if (selectElement.tagName === 'SELECT') {
        const action = {
            type: 'change',
            element: selectElement.tagName, // 选择的元素类型 'SELECT'
            id: selectElement.id || null,
            class: selectElement.className || null,
            value: selectElement.value || null,
            timestamp: new Date().toISOString() // 记录选择时间
        };
        actions.push(action);
        console.log("记录选择行为: ", action);
    }
});

// 记录页面跳转行为（用户点击链接或表单提交）
document.addEventListener('submit', function (event) {
    const formElement = event.target;

    const action = {
        type: 'submit',
        element: formElement.tagName, // 表单类型 'FORM'
        id: formElement.id || null,
        class: formElement.className || null,
        timestamp: new Date().toISOString() // 记录提交时间
    };
    actions.push(action);
    console.log("记录表单提交行为: ", action);
});

// 记录页面跳转（点击链接）行为
document.addEventListener('click', function (event) {
    const clickedElement = event.target;

    if (clickedElement.tagName === 'A' && clickedElement.href) {
        const action = {
            type: 'navigate',
            element: clickedElement.tagName, // 链接元素 'A'
            href: clickedElement.href, // 跳转的 URL
            timestamp: new Date().toISOString() // 记录跳转时间
        };
        actions.push(action);
        console.log("记录跳转行为: ", action);
    }
});

// 将所有操作行为以 JSON 格式保存
function saveActions() {
    const actionsData = JSON.stringify(actions, null, 2);
    console.log("所有操作记录:", actionsData);

    // 将数据保存到本地存储（也可以上传到服务器）
    localStorage.setItem('actionsData', actionsData);
}

// 调用保存操作记录的函数
// 你可以在合适的时机调用这个函数，或者定期调用来保存数据
// 例如：当页面卸载时保存数据
window.addEventListener('beforeunload', function () {
    saveActions();
});
