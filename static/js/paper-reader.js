
// PDF.js 工作器配置
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// 全局状态管理
const state = {
    currentPDF: null,
    currentPage: 1,
    zoom: 1.0,
    isTranslationVisible: false,
    isAnnotationMode: false,
    papers: [],
    notes: [],
    annotations: [],
    language: 'zh',
    translations: {
        zh: {
            importPaper: '导入论文',
            translate: '翻译',
            annotate: '标注',
            save: '保存',
            cancel: '取消',
            loading: '加载中...'
        },
        en: {
            importPaper: 'Import Paper',
            translate: 'Translate',
            annotate: 'Annotate',
            save: 'Save',
            cancel: 'Cancel',
            loading: 'Loading...'
        }
    }
};

// PDF查看器类
class PDFViewer {
    constructor() {
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentPage = 1;
        this.pdfDoc = null;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.0;
    }

    // 加载PDF文件
    async loadPDF(url) {
        try {
            showLoading();
            const loadingTask = pdfjsLib.getDocument(url);
            this.pdfDoc = await loadingTask.promise;
            document.getElementById('totalPages').textContent = this.pdfDoc.numPages;
            await this.renderPage(1);
            hideLoading();
        } catch (error) {
            hideLoading();
            showError('PDF加载失败');
            console.error('PDF加载错误:', error);
        }
    }

    // 渲染页面
    async renderPage(num) {
        this.pageRendering = true;
        try {
            const page = await this.pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: this.scale });

            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;
            this.pageRendering = false;
            this.currentPage = num;
            document.getElementById('currentPage').textContent = num;

            if (this.pageNumPending !== null) {
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
        } catch (error) {
            this.pageRendering = false;
            showError('页面渲染失败');
            console.error('渲染错误:', error);
        }
    }

    // 切换到上一页
    previousPage() {
        if (this.currentPage <= 1) return;
        this.queueRenderPage(this.currentPage - 1);
    }

    // 切换到下一页
    nextPage() {
        if (this.currentPage >= this.pdfDoc.numPages) return;
        this.queueRenderPage(this.currentPage + 1);
    }

    // 队列渲染页面
    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }

    // 缩放
    zoom(factor) {
        this.scale *= factor;
        this.renderPage(this.currentPage);
    }
}

// 翻译管理器类
class TranslationManager {
    constructor() {
        this.translationLayer = document.getElementById('translationLayer');
        this.translations = new Map();
    }

    // 翻译文本
    async translateText(text) {
        try {
            showLoading();
            // 这里应该调用实际的翻译API
            const translation = await this.mockTranslation(text);
            hideLoading();
            return translation;
        } catch (error) {
            hideLoading();
            showError('翻译失败');
            console.error('翻译错误:', error);
        }
    }

    // 模拟翻译（实际项目中替换为真实API调用）
    async mockTranslation(text) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `这是"${text}"的模拟翻译结果。实际项目中应该调用真实的翻译API。`;
    }

    // 显示翻译
    showTranslation(translation) {
        this.translationLayer.innerHTML = translation;
        this.translationLayer.classList.add('active');
    }

    // 隐藏翻译
    hideTranslation() {
        this.translationLayer.classList.remove('active');
    }

    // 切换翻译显示
    toggleTranslation() {
        this.translationLayer.classList.toggle('active');
    }
}

// 标注管理器类
class AnnotationManager {
    constructor() {
        this.annotations = [];
        this.isAnnotationMode = false;
        this.currentSelection = null;
    }

    // 启用标注模式
    enableAnnotationMode() {
        this.isAnnotationMode = true;
        document.body.classList.add('annotation-mode');
    }

    // 禁用标注模式
    disableAnnotationMode() {
        this.isAnnotationMode = false;
        document.body.classList.remove('annotation-mode');
    }

    // 添加标注
    addAnnotation(selection, note) {
        const annotation = {
            id: Date.now(),
            text: selection.toString(),
            note: note,
            page: state.currentPage,
            position: this.getSelectionPosition(selection),
            timestamp: new Date().toISOString()
        };

        this.annotations.push(annotation);
        this.saveAnnotations();
        this.renderAnnotation(annotation);
    }

    // 获取选择区域位置
    getSelectionPosition(selection) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const canvas = document.getElementById('pdfCanvas');
        const canvasRect = canvas.getBoundingClientRect();

        return {
            top: rect.top - canvasRect.top,
            left: rect.left - canvasRect.left,
            width: rect.width,
            height: rect.height
        };
    }

    // 渲染标注
    renderAnnotation(annotation) {
        const highlight = document.createElement('div');
        highlight.className = 'annotation-highlight';
        highlight.dataset.annotationId = annotation.id;
        highlight.style.position = 'absolute';
        highlight.style.top = `${annotation.position.top}px`;
        highlight.style.left = `${annotation.position.left}px`;
        highlight.style.width = `${annotation.position.width}px`;
        highlight.style.height = `${annotation.position.height}px`;

        document.getElementById('pdfViewer').appendChild(highlight);
    }

    // 保存标注
    saveAnnotations() {
        localStorage.setItem('paperAnnotations', JSON.stringify(this.annotations));
    }

    // 加载标注
    loadAnnotations() {
        const saved = localStorage.getItem('paperAnnotations');
        if (saved) {
            this.annotations = JSON.parse(saved);
            this.annotations.forEach(annotation => {
                if (annotation.page === state.currentPage) {
                    this.renderAnnotation(annotation);
                }
            });
        }
    }
}

// 论文管理器类
class PaperManager {
    constructor() {
        this.papers = [];
        this.loadPapers();
    }

    // 加载论文列表
    loadPapers() {
        const saved = localStorage.getItem('papers');
        if (saved) {
            this.papers = JSON.parse(saved);
            this.renderPaperList();
        }
    }

    // 添加论文
    async addPaper(file) {
        try {
            const paper = {
                id: Date.now(),
                title: file.name,
                path: URL.createObjectURL(file),
                addedAt: new Date().toISOString()
            };

            this.papers.push(paper);
            this.savePapers();
            this.renderPaperList();
            return paper;
        } catch (error) {
            showError('添加论文失败');
            console.error('添加论文错误:', error);
        }
    }

    // 从arXiv获取论文
    async fetchFromArxiv(arxivId) {
        try {
            showLoading();
            // 这里应该调用实际的arXiv API
            // 现在使用模拟数据
            await new Promise(resolve => setTimeout(resolve, 1500));
            const paper = {
                id: Date.now(),
                title: `arXiv:${arxivId}`,
                path: `https://arxiv.org/pdf/${arxivId}.pdf`,
                addedAt: new Date().toISOString()
            };

            this.papers.push(paper);
            this.savePapers();
            this.renderPaperList();
            hideLoading();
            return paper;
        } catch (error) {
            hideLoading();
            showError('获取论文失败');
            console.error('arXiv获取错误:', error);
        }
    }

    // 保存论文列表
    savePapers() {
        localStorage.setItem('papers', JSON.stringify(this.papers));
    }

    // 渲染论文列表
    renderPaperList() {
        const paperList = document.getElementById('paperList');
        paperList.innerHTML = this.papers.map(paper => `
            <div class="paper-item" data-id="${paper.id}">
                <div class="paper-title">${paper.title}</div>
                <div class="paper-date">${new Date(paper.addedAt).toLocaleDateString()}</div>
            </div>
        `).join('');

        // 添加点击事件
        paperList.querySelectorAll('.paper-item').forEach(item => {
            item.addEventListener('click', () => {
                const paper = this.papers.find(p => p.id === parseInt(item.dataset.id));
                if (paper) {
                    pdfViewer.loadPDF(paper.path);
                }
            });
        });
    }
}

// 工具函数
function showLoading() {
    document.querySelector('.loading-spinner').style.display = 'block';
}

function hideLoading() {
    document.querySelector('.loading-spinner').style.display = 'none';
}

function showError(message) {
    // 使用Bootstrap的toast显示错误信息
    const toast = new bootstrap.Toast(document.querySelector('.toast'));
    document.querySelector('.toast-body').textContent = message;
    toast.show();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const pdfViewer = new PDFViewer();
    const translationManager = new TranslationManager();
    const annotationManager = new AnnotationManager();
    const paperManager = new PaperManager();

    // 初始化事件监听器
    document.getElementById('prevPage').addEventListener('click', () => pdfViewer.previousPage());
    document.getElementById('nextPage').addEventListener('click', () => pdfViewer.nextPage());
    document.getElementById('zoomIn').addEventListener('click', () => pdfViewer.zoom(1.2));
    document.getElementById('zoomOut').addEventListener('click', () => pdfViewer.zoom(0.8));

    // 翻译按钮
    document.getElementById('translateToggle').addEventListener('click', () => {
        translationManager.toggleTranslation();
    });

    // 标注按钮
    document.getElementById('annotationMode').addEventListener('click', () => {
        if (annotationManager.isAnnotationMode) {
            annotationManager.disableAnnotationMode();
        } else {
            annotationManager.enableAnnotationMode();
        }
    });

    // 文件导入
    document.getElementById('fileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const paper = await paperManager.addPaper(file);
            if (paper) {
                pdfViewer.loadPDF(paper.path);
            }
        }
    });

    // arXiv导入
    document.getElementById('fetchArxiv').addEventListener('click', async () => {
        const arxivId = document.getElementById('arxivId').value.trim();
        if (arxivId) {
            const paper = await paperManager.fetchFromArxiv(arxivId);
            if (paper) {
                pdfViewer.loadPDF(paper.path);
            }
        }
    });

    // 语言切换
    document.getElementById('languageToggle').addEventListener('click', () => {
        state.language = state.language === 'zh' ? 'en' : 'zh';
        updateUILanguage();
    });
});

// 更新UI语言
function updateUILanguage() {
    const translations = state.translations[state.language];
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
}
