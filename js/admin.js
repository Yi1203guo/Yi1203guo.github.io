document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const container = document.querySelector('.container');
    const personnelInput = document.getElementById('personnel-input');
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const personnelList = document.getElementById('personnel-list');
    const queueInput = document.getElementById('queue-input');
    const addToQueueBtn = document.getElementById('add-to-queue-btn');
    const dutyQueueList = document.getElementById('duty-queue-list');
    const resetQueueBtn = document.getElementById('reset-queue-btn');
    const statusSelect = document.getElementById('status-select');

    let currentData = null;
    let isSaving = false;

    // --- Loading/Saving Feedback ---
    function showLoading(message) {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.8); display: flex; justify-content: center;
            align-items: center; z-index: 999; font-size: 1.2em;
        `;
        overlay.textContent = message;
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // --- Data Operations ---
    async function updateAndSaveData(updateFunction) {
        if (isSaving) return;
        isSaving = true;
        showLoading('保存中...');
        try {
            if (updateFunction) {
                updateFunction();
            }
            await saveData(currentData);
        } catch (error) {
            console.error('保存失败:', error);
            alert('数据保存失败, 请检查网络和配置后重试.');
        } finally {
            isSaving = false;
            hideLoading();
        }
    }

    // --- Render Functions ---
    function renderAll() {
        renderPersonnelList();
        renderDutyQueue();
        statusSelect.value = currentData.status;
    }

    function renderPersonnelList() {
        personnelList.innerHTML = '';
        currentData.personnel.forEach((person, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${person}</span><div><button class="edit-btn" data-index="${index}">编辑</button><button class="delete-btn" data-index="${index}">删除</button></div>`;
            personnelList.appendChild(li);
        });
    }

    function renderDutyQueue() {
        dutyQueueList.innerHTML = '';
        currentData.queue.forEach((person, index) => {
            const li = document.createElement('li');
            li.className = 'draggable';
            li.setAttribute('draggable', true);
            li.setAttribute('data-index', index);
            li.innerHTML = `<span>${person}</span><button class="delete-btn" data-index="${index}">删除</button>`;
            dutyQueueList.appendChild(li);
        });
        addDragAndDropListeners();
    }

    // --- Event Handlers ---
    addPersonnelBtn.addEventListener('click', () => {
        const name = personnelInput.value.trim();
        if (name) {
            updateAndSaveData(() => {
                currentData.personnel.push(name);
                renderPersonnelList();
                personnelInput.value = '';
            });
        }
    });

    personnelList.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        if (e.target.classList.contains('delete-btn')) {
            if (confirm(`确定要删除 "${currentData.personnel[index]}" 吗?`)) {
                updateAndSaveData(() => {
                    currentData.personnel.splice(index, 1);
                    renderPersonnelList();
                });
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const oldName = currentData.personnel[index];
            const newName = prompt('输入新的名字:', oldName);
            if (newName && newName.trim() !== '' && newName.trim() !== oldName) {
                updateAndSaveData(() => {
                    currentData.personnel[index] = newName.trim();
                    renderPersonnelList();
                });
            }
        }
    });

    addToQueueBtn.addEventListener('click', () => {
        const name = queueInput.value.trim();
        if (name) {
            updateAndSaveData(() => {
                currentData.queue.push(name);
                renderDutyQueue();
                queueInput.value = '';
            });
        }
    });

    dutyQueueList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            if (confirm(`确定要从队列中删除 "${currentData.queue[index]}" 吗?`)) {
                updateAndSaveData(() => {
                    currentData.queue.splice(index, 1);
                    renderDutyQueue();
                });
            }
        }
    });

    resetQueueBtn.addEventListener('click', () => {
        if (confirm('确定要根据人员列表重置队列吗? 这将覆盖当前的队列.')) {
            updateAndSaveData(() => {
                currentData.queue = [...currentData.personnel];
                renderDutyQueue();
            });
        }
    });

    statusSelect.addEventListener('change', () => {
        updateAndSaveData(() => {
            currentData.status = statusSelect.value;
        });
    });

    // --- Drag and Drop ---
    let dragStartIndex;
    function dragStart() { dragStartIndex = +this.getAttribute('data-index'); }
    function dragOver(e) { e.preventDefault(); }
    function drop() {
        const dragEndIndex = +this.getAttribute('data-index');
        if (dragStartIndex === dragEndIndex) return;
        updateAndSaveData(() => {
            const item = currentData.queue.splice(dragStartIndex, 1)[0];
            currentData.queue.splice(dragEndIndex, 0, item);
            renderDutyQueue();
        });
    }
    function addDragAndDropListeners() {
        const draggables = dutyQueueList.querySelectorAll('.draggable');
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', dragStart);
            draggable.addEventListener('dragover', dragOver);
            draggable.addEventListener('drop', drop);
        });
    }

    // --- Initialization ---
    async function init() {
        showLoading('加载数据中...');
        try {
            // 检查配置
            if (CONFIG.API_KEY === 'YOUR_API_KEY' || CONFIG.BIN_ID === 'YOUR_BIN_ID') {
                alert('请先在 js/config.js 文件中设置您的 API Key 和 Bin ID!');
                container.innerHTML = '<h1>配置不正确</h1><p>请根据 js/config.js 文件中的指示完成配置.</p>';
                return;
            }
            currentData = await getLatestData();

            // 检查并更新周开始日期 (安全地在管理端执行)
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const now = new Date();
            const startDate = new Date(currentData.startDate);
            if (now - startDate >= oneWeek) {
                const newStartDate = new Date(startDate.getTime() + Math.floor((now - startDate) / oneWeek) * oneWeek);
                currentData.startDate = newStartDate.toISOString();
                await saveData(currentData); // 保存更新后的日期
            }

            renderAll();
        } catch (error) {
            console.error('初始化失败:', error);
            alert('数据加载失败, 请检查网络和配置后刷新页面.');
            container.innerHTML = '<h1>加载失败</h1>';
        } finally {
            hideLoading();
        }
    }

    init();
});