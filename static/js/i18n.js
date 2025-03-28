// 国际化配置
const i18n = {
    zh: {
        // 通用
        loading: "加载中...",
        success: "成功",
        error: "错误",
        confirm: "确认",
        cancel: "取消",

        // 导航
        home: "首页",
        research: "研究方向",
        projects: "项目展示",
        tools: "工具与应用",
        modelConverter: "模型转换器",
        careerHelper: "职多多",
        paperReader: "今日Paper",

        // 模型转换器
        modelConverterTitle: "模型转换器",
        modelConverterSubtitle: "轻松转换深度学习模型",
        uploadModel: "上传模型",
        chooseFile: "选择模型文件",
        supportedFormats: "支持的格式：ONNX, PyTorch",
        selectFramework: "选择目标框架",
        controlParameters: "控制参数",
        inputShapes: "输入形状",
        inputTypes: "输入类型",
        startConverting: "开始转换",
        downloadModel: "下载转换后的模型",
        conversionProgress: "转换进度",
        conversionComplete: "转换完成",
        conversionFailed: "转换失败",
        privacyWarning: "⚠️ 本服务不会保存上传的模型，有顾虑的小伙伴请谨慎使用！",

        // 错误信息
        fileTooLarge: "文件大小超过限制",
        invalidFileType: "不支持的文件类型",
        invalidInputFormat: "输入格式无效",
        conversionError: "模型转换失败",
        downloadError: "下载失败",

        // 用户相关
        login: "登录",
        register: "注册",
        logout: "退出",
        profile: "个人中心",
        settings: "设置",

        // 主题
        lightTheme: "浅色主题",
        darkTheme: "深色主题",

        // 语言
        language: "语言",
        zh: "中文",
        en: "English"
    },
    en: {
        // Common
        loading: "Loading...",
        success: "Success",
        error: "Error",
        confirm: "Confirm",
        cancel: "Cancel",

        // Navigation
        home: "Home",
        research: "Research",
        projects: "Projects",
        tools: "Tools & Apps",
        modelConverter: "Model Converter",
        careerHelper: "Career Helper",
        paperReader: "Paper Reader",

        // Model Converter
        modelConverterTitle: "Model Converter",
        modelConverterSubtitle: "Convert Deep Learning Models with Ease",
        uploadModel: "Upload Model",
        chooseFile: "Choose Model File",
        supportedFormats: "Supported formats: ONNX, PyTorch, TensorFlow, TFLite",
        selectFramework: "Select Target Framework",
        controlParameters: "Control Parameters",
        inputShapes: "Input Shapes",
        inputTypes: "Input Types",
        startConverting: "Start Converting",
        downloadModel: "Download Converted Model",
        conversionProgress: "Conversion Progress",
        conversionComplete: "Conversion Complete",
        conversionFailed: "Conversion Failed",
        privacyWarning: "⚠️ This service does not store uploaded models. Please use with caution!",

        // Error Messages
        fileTooLarge: "File size exceeds limit",
        invalidFileType: "Unsupported file type",
        invalidInputFormat: "Invalid input format",
        conversionError: "Model conversion failed",
        downloadError: "Download failed",

        // User Related
        login: "Login",
        register: "Register",
        logout: "Logout",
        profile: "Profile",
        settings: "Settings",

        // Theme
        lightTheme: "Light Theme",
        darkTheme: "Dark Theme",

        // Language
        language: "Language",
        zh: "中文",
        en: "English"
    }
};

// 国际化管理器
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'zh';
        this.init();
    }

    init() {
        this.updateLanguage();
        this.setupLanguageToggle();
    }

    updateLanguage() {
        document.documentElement.lang = this.currentLang;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (i18n[this.currentLang][key]) {
                element.textContent = i18n[this.currentLang][key];
            }
        });
    }

    setupLanguageToggle() {
        const languageToggle = document.querySelector('.language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
                localStorage.setItem('language', this.currentLang);
                this.updateLanguage();
            });
        }
    }
}

// 初始化多语言支持
document.addEventListener('DOMContentLoaded', () => {
    window.i18nManager = new I18nManager();
});

// 导出i18n实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
} else {
    window.i18n = i18n;
}
