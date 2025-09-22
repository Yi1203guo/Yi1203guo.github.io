document.addEventListener('DOMContentLoaded', async () => {
    const statusDisplay = document.getElementById('current-status');
    const thisWeekDutyDisplay = document.getElementById('this-week-duty');
    const nextWeekDutyDisplay = document.getElementById('next-week-duty');
    const dutySection = document.getElementById('duty-section');
    const container = document.querySelector('.container');

    function showLoading(message) {
        statusDisplay.textContent = message;
    }

    async function render() {
        showLoading('加载中...');
        try {
            if (CONFIG.API_KEY === 'YOUR_API_KEY' || CONFIG.BIN_ID === 'YOUR_BIN_ID') {
                alert('应用配置不正确, 请联系管理员.');
                container.innerHTML = '<h1>配置不正确</h1>';
                return;
            }

            const data = await getLatestData();

            if (data.status === 'Holiday') {
                statusDisplay.textContent = '放假中';
                statusDisplay.classList.add('holiday');
                dutySection.style.display = 'none';
                return;
            }

            statusDisplay.textContent = '正常';
            statusDisplay.classList.remove('holiday');
            dutySection.style.display = 'block';

            const queue = data.queue;

            // 新的、简单的显示逻辑
            thisWeekDutyDisplay.textContent = (queue && queue.length > 0) ? queue[0] : '队列为空';
            nextWeekDutyDisplay.textContent = (queue && queue.length > 1) ? queue[1] : '无人';

        } catch (error) {
            console.error('加载失败:', error);
            statusDisplay.textContent = '加载失败';
            alert('数据加载失败, 请检查网络后刷新页面.');
        }
    }

    render();
});
