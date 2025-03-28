
// AI助手增强模块
class EnhancedAIAssistant {
    constructor() {
        this.context = [];
        this.maxContextLength = 10;
        this.learningHistory = [];
        this.knowledgeGraph = new Map();
    }

    // 初始化知识图谱
    initKnowledgeGraph(cards) {
        cards.forEach(card => {
            this.addToKnowledgeGraph(card);
        });
    }

    // 添加知识点到图谱
    addToKnowledgeGraph(card) {
        const keywords = this.extractKeywords(card.content);
        keywords.forEach(keyword => {
            if (!this.knowledgeGraph.has(keyword)) {
                this.knowledgeGraph.set(keyword, new Set());
            }
            this.knowledgeGraph.get(keyword).add(card.id);
        });
    }

    // 提取关键词（简单实现，实际项目中可使用NLP库）
    extractKeywords(text) {
        const stopWords = new Set(['的', '了', '和', '与', '或', '在', '是', '有']);
        return text
            .split(/\s+|[,，.。!！?？]/)
            .filter(word => word.length > 1 && !stopWords.has(word));
    }

    // 生成学习建议
    generateLearningSuggestions(userHistory) {
        const weakPoints = this.analyzeWeakPoints(userHistory);
        const suggestions = [];

        weakPoints.forEach(point => {
            const relatedCards = this.findRelatedCards(point);
            suggestions.push({
                topic: point,
                cards: relatedCards,
                priority: this.calculatePriority(point, userHistory)
            });
        });

        return this.formatSuggestions(suggestions);
    }

    // 分析薄弱点
    analyzeWeakPoints(history) {
        const weakPoints = new Map();

        history.forEach(record => {
            if (!record.remembered) {
                const keywords = this.extractKeywords(record.cardContent);
                keywords.forEach(keyword => {
                    weakPoints.set(keyword, (weakPoints.get(keyword) || 0) + 1);
                });
            }
        });

        return Array.from(weakPoints.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
    }

    // 查找相关卡片
    findRelatedCards(keyword) {
        return this.knowledgeGraph.get(keyword) || new Set();
    }

    // 计算优先级
    calculatePriority(topic, history) {
        const failureCount = history.filter(record =>
            !record.remembered &&
            this.extractKeywords(record.cardContent).includes(topic)
        ).length;

        const lastReview = history
            .filter(record => this.extractKeywords(record.cardContent).includes(topic))
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        const daysSinceLastReview = lastReview ?
            (Date.now() - lastReview.timestamp) / (1000 * 60 * 60 * 24) :
            Infinity;

        return (failureCount * 0.7) + (daysSinceLastReview * 0.3);
    }

    // 格式化学习建议
    formatSuggestions(suggestions) {
        return suggestions.map(suggestion => ({
            topic: suggestion.topic,
            message: `建议复习与"${suggestion.topic}"相关的知识点，这是你的薄弱环节。`,
            relatedCards: Array.from(suggestion.cards),
            priority: suggestion.priority
        }));
    }

    // 处理用户问题
    async processUserQuestion(question, currentContext = {}) {
        try {
            // 分析问题类型
            const questionType = this.analyzeQuestionType(question);

            // 准备上下文信息
            const context = this.prepareContext(question, currentContext, questionType);

            // 生成回答
            const response = await this.generateResponse(question, context, questionType);

            // 更新学习历史
            this.updateLearningHistory(question, response, questionType);

            return response;
        } catch (error) {
            console.error('处理问题时出错:', error);
            return {
                type: 'error',
                content: '抱歉，处理您的问题时出现了错误。请稍后重试。'
            };
        }
    }

    // 分析问题类型
    analyzeQuestionType(question) {
        const types = {
            resume: ['简历', '履历', 'CV', '自我介绍'],
            interview: ['面试', '问题', '回答', '技术面', 'HR面'],
            technical: ['编程', '算法', '数据结构', '设计模式'],
            career: ['职业规划', '发展', '方向', '选择']
        };

        for (const [type, keywords] of Object.entries(types)) {
            if (keywords.some(keyword => question.includes(keyword))) {
                return type;
            }
        }

        return 'general';
    }

    // 准备上下文信息
    prepareContext(question, currentContext, questionType) {
        return {
            type: questionType,
            recentHistory: this.learningHistory.slice(-5),
            relatedCards: this.findRelatedContent(question),
            userContext: currentContext,
            timestamp: Date.now()
        };
    }

    // 查找相关内容
    findRelatedContent(question) {
        const keywords = this.extractKeywords(question);
        const relatedContent = new Set();

        keywords.forEach(keyword => {
            const relatedCards = this.knowledgeGraph.get(keyword);
            if (relatedCards) {
                relatedCards.forEach(cardId => relatedContent.add(cardId));
            }
        });

        return Array.from(relatedContent);
    }

    // 生成回答
    async generateResponse(question, context, questionType) {
        // 这里是模拟响应，实际项目中应该调用真实的AI API
        const responses = {
            resume: {
                title: '简历编写建议',
                content: this.getResumeAdvice(context),
                suggestions: this.getRelatedSuggestions(context)
            },
            interview: {
                title: '面试技巧指导',
                content: this.getInterviewAdvice(context),
                suggestions: this.getRelatedSuggestions(context)
            },
            technical: {
                title: '技术知识解答',
                content: this.getTechnicalAdvice(context),
                suggestions: this.getRelatedSuggestions(context)
            },
            career: {
                title: '职业发展建议',
                content: this.getCareerAdvice(context),
                suggestions: this.getRelatedSuggestions(context)
            },
            general: {
                title: '一般建议',
                content: this.getGeneralAdvice(context),
                suggestions: this.getRelatedSuggestions(context)
            }
        };

        return responses[questionType];
    }

    // 获取简历建议
    getResumeAdvice(context) {
        return `
1. 突出你的核心竞争力
2. 使用数据量化你的成就
3. 针对目标职位定制内容
4. 确保简历格式清晰规范
5. 突出与职位相关的技能和经验`;
    }

    // 获取面试建议
    getInterviewAdvice(context) {
        return `
1. 充分准备公司背景
2. 准备常见问题的答案
3. 准备具体的项目案例
4. 注意表达的逻辑性
5. 准备问面试官的问题`;
    }

    // 获取技术建议
    getTechnicalAdvice(context) {
        return `
1. 掌握核心算法和数据结构
2. 理解设计模式的应用场景
3. 注重代码质量和可维护性
4. 持续学习新技术
5. 多动手实践`;
    }

    // 获取职业发展建议
    getCareerAdvice(context) {
        return `
1. 明确职业目标
2. 制定学习计划
3. 建立职业技能体系
4. 拓展人脉网络
5. 保持持续学习`;
    }

    // 获取一般建议
    getGeneralAdvice(context) {
        return `我理解你的问题。建议你：
1. 明确具体的问题点
2. 查看相关的知识卡片
3. 进行针对性练习
4. 及时总结反馈
5. 循序渐进地学习`;
    }

    // 获取相关建议
    getRelatedSuggestions(context) {
        return context.relatedCards.map(cardId => ({
            id: cardId,
            type: 'card_reference',
            message: '建议查看相关知识卡片'
        }));
    }

    // 更新学习历史
    updateLearningHistory(question, response, questionType) {
        this.learningHistory.push({
            timestamp: Date.now(),
            question,
            response,
            type: questionType
        });

        // 保持历史记录在合理范围内
        if (this.learningHistory.length > 100) {
            this.learningHistory = this.learningHistory.slice(-100);
        }
    }
}

// 导出模块
export default EnhancedAIAssistant;
