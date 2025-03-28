
// 全局状态管理
const state = {
    currentLanguage: 'zh', // zh: 中文, en: 英文
    currentMode: 'study', // study: 学习模式, test: 自测模式
    knowledgeCards: [], // 知识卡片数组
    currentCategory: null, // 当前选中的分类
};

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    initializeEventListeners();
    updateUILanguage();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 语言切换
    document.getElementById('switchLanguage').addEventListener('click', toggleLanguage);

    // 创建知识卡片
    document.getElementById('createCard').addEventListener('click', createKnowledgeCard);

    // 学习模式切换
    document.getElementById('studyMode').addEventListener('click', () => switchMode('study'));
    document.getElementById('testMode').addEventListener('click', () => switchMode('test'));

    // AI助手对话
    document.getElementById('sendQuestion').addEventListener('click', sendQuestionToAI);

    // 知识分类点击事件
    document.querySelectorAll('#knowledgeCategories a').forEach(category => {
        category.addEventListener('click', (e) => {
            e.preventDefault();
            switchCategory(e.target.textContent);
        });
    });
}

// 加载存储的数据
function loadStoredData() {
    const storedCards = localStorage.getItem('knowledgeCards');
    if (storedCards) {
        state.knowledgeCards = JSON.parse(storedCards);
    }

    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
        state.currentLanguage = storedLanguage;
    }
}

// 创建知识卡片
function createKnowledgeCard() {
    const content = document.getElementById('cardContent').value.trim();
    if (!content) return;

    const card = {
        id: Date.now(),
        content,
        category: state.currentCategory || '未分类',
        createdAt: new Date().toISOString(),
        language: state.currentLanguage,
    };

    state.knowledgeCards.push(card);
    saveCardsToStorage();
    renderKnowledgeCards();
    document.getElementById('cardContent').value = '';
}

// 切换语言
function toggleLanguage() {
    state.currentLanguage = state.currentLanguage === 'zh' ? 'en' : 'zh';
    localStorage.setItem('language', state.currentLanguage);
    updateUILanguage();
}

// 更新UI语言
function updateUILanguage() {
    const translations = {
        zh: {
            createCard: '创建卡片',
            studyMode: '学习模式',
            testMode: '自测模式',
            send: '发送',
            inputPlaceholder: '输入问题...',
            switchLanguage: '切换语言'
        },
        en: {
            createCard: 'Create Card',
            studyMode: 'Study Mode',
            testMode: 'Test Mode',
            send: 'Send',
            inputPlaceholder: 'Type your question...',
            switchLanguage: 'Switch Language'
        }
    };

    const currentTranslations = translations[state.currentLanguage];

    document.getElementById('createCard').textContent = currentTranslations.createCard;
    document.getElementById('studyMode').textContent = currentTranslations.studyMode;
    document.getElementById('testMode').textContent = currentTranslations.testMode;
    document.getElementById('sendQuestion').textContent = currentTranslations.send;
    document.getElementById('userInput').placeholder = currentTranslations.inputPlaceholder;
    document.getElementById('switchLanguage').textContent = currentTranslations.switchLanguage;
}

// 切换模式（学习/自测）
function switchMode(mode) {
    state.currentMode = mode;
    document.getElementById('studyMode').classList.toggle('active', mode === 'study');
    document.getElementById('testMode').classList.toggle('active', mode === 'test');
    renderContent();
}

// 切换分类
function switchCategory(category) {
    state.currentCategory = category;
    renderKnowledgeCards();
}

// 渲染知识卡片
function renderKnowledgeCards() {
    const contentArea = document.getElementById('contentArea');
    const filteredCards = state.knowledgeCards.filter(card =>
        !state.currentCategory || card.category === state.currentCategory
    );

    contentArea.innerHTML = filteredCards.map(card => `
        <div class="knowledge-card" data-id="${card.id}">
            <div class="card-content">${card.content}</div>
            <div class="card-footer">
                <span class="tag">${card.category}</span>
                <span class="date">${new Date(card.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// 保存卡片到本地存储
function saveCardsToStorage() {
    localStorage.setItem('knowledgeCards', JSON.stringify(state.knowledgeCards));
}

// AI助手对话功能
async function sendQuestionToAI() {
    const userInput = document.getElementById('userInput');
    const question = userInput.value.trim();
    if (!question) return;

    const chatContainer = document.getElementById('chatContainer');

    // 添加用户消息
    appendMessage('user', question);
    userInput.value = '';

    try {
        // 这里应该调用实际的AI API
        const response = await mockAIResponse(question);
        appendMessage('ai', response);
    } catch (error) {
        appendMessage('ai', '抱歉，处理您的问题时出现错误。');
    }
}

// 添加消息到聊天容器
function appendMessage(type, content) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 模拟AI响应（实际项目中应替换为真实API调用）
function mockAIResponse(question) {
    return new Promise(resolve => {
        setTimeout(() => {
            const responses = {
                zh: '这是一个模拟的AI响应。在实际项目中，这里应该调用真实的AI API。',
                en: 'This is a mock AI response. In a real project, this should call an actual AI API.'
            };
            resolve(responses[state.currentLanguage]);
        }, 1000);
    });
}

// 自测模式功能
function generateTest() {
    if (state.currentMode !== 'test') return;

    const cards = state.knowledgeCards.filter(card =>
        !state.currentCategory || card.category === state.currentCategory
    );

    if (cards.length === 0) return;

    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="test-question">
            <h5>测试问题</h5>
            <p>${randomCard.content}</p>
            <div class="mt-3">
                <button class="btn btn-success me-2" onclick="checkAnswer(true)">记得</button>
                <button class="btn btn-danger" onclick="checkAnswer(false)">不记得</button>
            </div>
        </div>
    `;
}

// 检查答案
function checkAnswer(remembered) {
    const feedback = remembered ?
        '太好了！继续保持！' :
        '没关系，这是学习的过程。我们待会再复习这个知识点。';

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML += `
        <div class="alert ${remembered ? 'alert-success' : 'alert-info'} mt-3">
            ${feedback}
        </div>
    `;

    setTimeout(generateTest, 2000);
}

// 初始渲染
renderKnowledgeCards();

// 导入增强的AI助手
import EnhancedAIAssistant from './ai-assistant.js';

// 创建AI助手实例
const aiAssistant = new EnhancedAIAssistant();
