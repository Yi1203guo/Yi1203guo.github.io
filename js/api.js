const API_URL = `https://api.jsonbin.io/v3/b/${CONFIG.BIN_ID}`;

const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': CONFIG.API_KEY
};

// 获取最新版本的数据
async function getLatestData() {
    // 不再使用 /latest, 直接获取 bin 的内容
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: headers
    });
    if (!response.ok) {
        // 如果是404,很可能是个新的bin,返回初始数据结构
        if (response.status === 404) {
            console.warn("Bin is new or empty. Initializing with default data.");
            return getInitialData();
        }
        throw new Error(`获取数据失败: ${response.statusText}`);
    }
    const data = await response.json();
    // record是jsonbin返回的数据实体, meta是元数据
    return data.record;
}

// 保存全部数据
async function saveData(data) {
    const response = await fetch(API_URL, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`保存数据失败: ${response.statusText}`);
    }
    return await response.json();
}

// 获取初始数据 (仅当bin为空时使用)
function getInitialData() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distance = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    const monday = new Date(today.setDate(today.getDate() - distance));
    monday.setHours(0, 0, 0, 0);

    return {
        personnel: ['张三', '李四', '王五'],
        queue: ['张三', '李四', '王五'],
        status: 'Normal',
        startDate: monday.toISOString(),
    };
}
