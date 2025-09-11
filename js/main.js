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
            // 检查配置
            if (CONFIG.API_KEY === 'YOUR_API_KEY' || CONFIG.BIN_ID === 'YOUR_BIN_ID') {
                alert('应用配置不正确, 请联系管理员.');
                container.innerHTML = '<h1>配置不正确</h1>';
                return;
            }

            const data = await getLatestData();

            // 渲染状态
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
            if (!queue || queue.length === 0) {
                thisWeekDutyDisplay.textContent = '无人值日';
                nextWeekDutyDisplay.textContent = '无人值日';
                return;
            }

            // 计算当前周
            const now = new Date();
            const startDate = new Date(data.startDate);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const weekIndex = Math.floor((now - startDate) / oneWeek);

            // 计算当前和下一个值日者
            const thisWeekIndex = weekIndex % queue.length;
            const nextWeekIndex = (weekIndex + 1) % queue.length;

            thisWeekDutyDisplay.textContent = queue[thisWeekIndex] || '无人值日';
            nextWeekDutyDisplay.textContent = queue[nextWeekIndex] || '无人值日';

        } catch (error) {
            console.error('加载失败:', error);
            statusDisplay.textContent = '加载失败';
            alert('数据加载失败, 请检查网络后刷新页面.');
        }
    }

    render();
});