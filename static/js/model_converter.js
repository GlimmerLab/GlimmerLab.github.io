// 定义全局变量
let inputShapes, inputTypes, modelUpload, startBtn, frameworkSelect, closeButton;

// 初始化时设置默认值
document.addEventListener("DOMContentLoaded", function() {
  // 获取必要的DOM元素
  inputShapes = document.getElementById("input-shapes");
  inputTypes = document.getElementById("input-types");
  modelUpload = document.getElementById("model-upload");
  startBtn = document.getElementById("start-btn");
  frameworkSelect = document.getElementById("framework-select");
  closeButton = document.getElementById("close-error-popup");

  // 检查必要的DOM元素是否存在
  if (!inputShapes || !inputTypes || !modelUpload || !startBtn || !frameworkSelect || !closeButton) {
    console.error("缺少必要的DOM元素");
    return;
  }

  // 设置默认值
  inputShapes.value = "[1, 3, 640, 640]";
  inputTypes.value = "f32";

  // 移除所有实时格式化的监听器
  // 只在失去焦点时格式化input-shapes
  inputShapes.addEventListener("blur", function (event) {
    let inputValue = event.target.value.trim();

    // 如果输入为空，恢复默认值
    if (!inputValue) {
      event.target.value = "[1, 3, 640, 640]";
      return;
    }

    try {
      // 移除所有空格和方括号
      inputValue = inputValue.replace(/[\[\]\s]/g, "");
      // 分割数字
      const numbers = inputValue.split(",")
        .filter(v => v.length > 0) // 移除空字符串
        .map(v => {
          const num = parseInt(v);
          if (isNaN(num)) {
            throw new Error("无效的数字");
          }
          return num;
        });

      // 确保至少有一个数字
      if (numbers.length === 0) {
        throw new Error("请输入至少一个数字");
      }

      // 格式化为数组字符串
      event.target.value = "[" + numbers.join(", ") + "]";
    } catch (e) {
      // 发生任何错误时恢复默认值
      event.target.value = "[1, 3, 640, 640]";
      showError("请输入有效的数字序列（例如：1,3,640,640），已恢复默认值");
    }
  });

  // 监听 input-types 输入框的变化，自动格式化输入
  inputTypes.addEventListener("input", function (event) {
    let inputValue = event.target.value.trim();

    // 如果用户输入类似 "f32, f16"，自动转换成 JSON 数组格式
    if (inputValue.includes(",") && !inputValue.startsWith("[")) {
      inputValue = "[" + inputValue.split(",").map(v => `"${v.trim()}"`).join(", ") + "]";
      event.target.value = inputValue;
    }

    // 如果输入的是单个类型，移除意外的引号
    if (/^["']?\w+["']?$/.test(inputValue)) {
      event.target.value = inputValue.replace(/["']/g, "");
    }
  });

  // 文件上传预览
  modelUpload.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      const fileSize = formatFileSize(file.size);
      const fileName = file.name;
      const uploadLabel = document.querySelector("label[for='model-upload']");
      uploadLabel.innerHTML = `<i class="bi bi-file-earmark-arrow-up"></i> ${fileName} (${fileSize})`;
      uploadLabel.classList.add("file-selected");
    }
  });

  // 添加下载进度显示元素
  const progressContainer = document.querySelector('.progress-container');
  if (progressContainer) {
    const downloadProgressHTML = `
      <div class="download-progress" style="display: none;">
        <div class="download-progress-bar" style="width: 0%"></div>
        <div class="download-progress-text">准备下载...</div>
      </div>
    `;
    progressContainer.insertAdjacentHTML('afterend', downloadProgressHTML);
  }

  // 监听开始转换按钮的点击事件
  startBtn.addEventListener("click", async function () {
    const modelFile = modelUpload.files[0];
    const framework = frameworkSelect.value;
    const inputShapesValue = inputShapes.value.trim();
    let inputTypesValue = inputTypes.value.trim();

    const errorPopup = document.getElementById("error-popup");
    const progressBar = document.querySelector(".progress-bar");
    const progressContainer = document.querySelector(".progress-container");
    const progressMessage = document.querySelector(".progress-message");
    const downloadBtn = document.getElementById("download-btn");

    // 重置 UI
    downloadBtn.style.display = "none";
    progressBar.style.width = "0%";
    progressContainer.style.display = "block";
    progressMessage.textContent = "正在上传模型文件...";

    // 验证是否上传了文件
    if (!modelFile) {
        showError("请先上传模型文件！");
        return;
    }

    // 声明变量
    let parsedInputShapes, parsedInputTypes, formattedInputTypes;

    // 解析并验证 input_shapes 和 input_types
    try {
        parsedInputShapes = JSON.parse(inputShapesValue);
        if (!Array.isArray(parsedInputShapes)) {
            throw new Error("input_shapes 必须是列表格式");
        }

        if (inputTypesValue.startsWith("[")) {
            parsedInputTypes = JSON.parse(inputTypesValue);
        } else {
            parsedInputTypes = inputTypesValue;
        }

        if (Array.isArray(parsedInputShapes[0])) {
            if (!Array.isArray(parsedInputTypes) || parsedInputShapes.length !== parsedInputTypes.length) {
                throw new Error("多输入情况下，input_shapes 和 input_types 的长度必须匹配");
            }
        } else {
            if (Array.isArray(parsedInputTypes)) {
                throw new Error("单输入情况下，input_types 必须是字符串，不能是列表");
            }
        }

        formattedInputTypes = typeof parsedInputTypes === "string" ? parsedInputTypes : JSON.stringify(parsedInputTypes);
    } catch (e) {
        showError("输入格式无效，请使用正确的格式（例如：[1, 3, 224, 224] 和 f32 或 [f32, f32]）");
        return;
    }

    // 准备上传的 FormData
    const formData = new FormData();
    formData.append("file", modelFile);
    formData.append("framework", framework);
    formData.append("input_shapes", JSON.stringify(parsedInputShapes));
    formData.append("input_types", formattedInputTypes);

    let statusCheckInterval;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    try {
        // 上传模型文件
        progressBar.style.width = "20%";
        progressMessage.textContent = "正在上传模型文件...";

        const response = await fetch("/api/v1/model_converter/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '模型上传和转换失败');
        }

        const result = await response.json();
        if (!result.task_id) {
            throw new Error('服务器返回的任务ID无效');
        }

        progressBar.style.width = "40%";
        progressMessage.textContent = "模型转换中...";

        // 开始轮询转换状态
        statusCheckInterval = setInterval(async () => {
            try {
                const statusResponse = await fetch(`/api/v1/model_converter/status/${result.task_id}`);
                const statusData = await statusResponse.json();

                if (statusData.status === "completed") {
                    clearInterval(statusCheckInterval);
                    progressBar.style.width = "90%";
                    progressMessage.textContent = "正在准备下载...";

                    // 验证文件是否真的存在
                    const downloadUrl = `/api/v1/model_converter${statusData.download_url}`;
                    const fileCheckResponse = await fetch(downloadUrl, { method: 'HEAD' });

                    if (fileCheckResponse.ok) {
                        progressBar.style.width = "100%";
                        progressMessage.textContent = "转换完成，可以下载";

                        // 显示下载按钮
                        downloadBtn.style.display = "block";
                        downloadBtn.href = downloadUrl;
                        downloadBtn.download = downloadUrl.split('/').pop();

                        // 添加下载按钮点击事件
                        downloadBtn.addEventListener('click', async function(e) {
                            e.preventDefault();
                            await attemptDownload(downloadUrl);
                        });
                    } else {
                        throw new Error("文件准备中，请稍后重试");
                    }

                } else if (statusData.status === "processing") {
                    // 更新进度显示（40% - 80%）
                    const currentProgress = parseInt(progressBar.style.width) || 40;
                    if (currentProgress < 80) {
                        progressBar.style.width = `${currentProgress + 5}%`;
                    }
                    progressMessage.textContent = "模型转换中...";
                } else if (statusData.status === "error") {
                    clearInterval(statusCheckInterval);
                    throw new Error(statusData.error || "转换失败");
                }
            } catch (error) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    clearInterval(statusCheckInterval);
                    showError(`检查转换状态时出错: ${error.message}`);
                    progressContainer.style.display = "none";
                }
            }
        }, 2000); // 每2秒检查一次状态

    } catch (error) {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        console.error("错误:", error);
        showError(error.message);
        progressContainer.style.display = "none";
    }
  });

  // 初始化关闭按钮事件
  closeButton.addEventListener("click", () => {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.display = "none";
  });
});

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 错误提示相关变量
let errorPopupTimer = null;
const errorPopup = document.getElementById("error-popup");
const errorCloseButton = document.getElementById("close-error-popup");
const errorContent = errorPopup.querySelector(".error-content");

// 显示错误消息
function showError(message, type = "error") {
    // 清除之前的定时器
    if (errorPopupTimer) {
        clearTimeout(errorPopupTimer);
    }

    // 设置消息内容和类型
    errorContent.textContent = message;
    errorPopup.className = `error-popup ${type}`;

    // 显示弹窗
    errorPopup.classList.add("show");

    // 设置自动关闭定时器
    errorPopupTimer = setTimeout(() => {
        hideError();
    }, 5000);
}

// 隐藏错误消息
function hideError() {
    errorPopup.classList.remove("show");
}

// 添加关闭按钮事件监听
if (errorCloseButton) {
    errorCloseButton.addEventListener("click", hideError);
}

// 添加交互逻辑
document.addEventListener("DOMContentLoaded", function () {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".dropdown-menu");

    toggle.addEventListener("mouseenter", function () {
      if (window.innerWidth > 768) {
        menu.classList.add("show");
      }
    });
    dropdown.addEventListener("mouseleave", function () {
      if (window.innerWidth > 768) {
        menu.classList.remove("show");
      }
    });

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      menu.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target)) {
        menu.classList.remove("show");
      }
    });
  });
});

// 定义多语言翻译内容
const translations = {
  en: {
    home: "Home",
    frameworks: "Supported Frameworks ▼",
    howTo: "How to Use",
    models_zoo: "Supported Models ▼",
    privacy: "Privacy Policy ▼",
    community: "Community ▼",
    privacyWarning: "⚠️ This service does not store uploaded models. If concerned, please use it with caution!",
    heroTitle: "Convert Your Deep Learning Models with Ease",
    heroSubtitle: "Seamlessly convert models between various frameworks like PyTorch, ONNX and more.",
    uploadModel: "Upload Your Model",
    chooseFile: "Choose a Model File",
    selectFramework: "Select Target Framework",
    ncnn: "NCNN",
    onnx: "ONNX",
    startConverting: "Start Converting",
    downloadModel: "Download Converted Model",
    footer: "All rights reserved.",
    controlParameters: "Control Parameters",
    inputShapes: "Input Shapes:",
    inputTypes: "Input Types:"
  },
  zh: {
    home: "首页",
    frameworks: "支持的框架 ▼",
    howTo: "如何使用",
    models_zoo: "模型库 ▼",
    privacy: "隐私政策 ▼",
    community: "社区 ▼",
    privacyWarning: "⚠️ 本服务不会保存上传的模型，有顾虑的小伙伴请谨慎使用！",
    heroTitle: "轻松转换深度学习模型",
    heroSubtitle: "无缝转换各种框架模型，如PyTorch、ONNX等。",
    uploadModel: "上传模型",
    chooseFile: "选择模型文件",
    selectFramework: "选择目标框架",
    ncnn: "NCNN",
    onnx: "ONNX",
    startConverting: "开始转换",
    downloadModel: "下载转换后的模型",
    footer: "版权所有。",
    controlParameters: "控制参数",
    inputShapes: "输入形状:",
    inputTypes: "输入类型:"
  }
};

// 添加语言切换事件
document.querySelector(".language-toggle").addEventListener("click", () => {
  const currentLang = document.documentElement.lang;
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  document.documentElement.lang = newLang;

  const textElements = document.querySelectorAll("[data-i18n]");
  textElements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[newLang][key]) {
      el.textContent = translations[newLang][key];
    }
  });

  // 更新其他文本元素
  document.querySelector("label[for='input-shapes']").textContent = translations[newLang]["inputShapes"];
  document.querySelector("label[for='input-types']").textContent = translations[newLang]["inputTypes"];
  document.querySelector(".parameter-control h2").textContent = translations[newLang]["controlParameters"];
  document.querySelector("#framework-select option[value='ncnn']").innerText = translations[newLang]["ncnn"];
  document.querySelector(".modelflow-title").textContent = "ModelFlow";
  document.querySelector("footer p").textContent = `© 2024 ModelFlow. ${translations[newLang].footer}`;
});

// 初始化主题
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// 更新进度条
function updateProgress(progress, message) {
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressMessage = document.querySelector('.progress-message');

    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    progressMessage.textContent = message;
}

// 显示下载进度
function showDownloadProgress(progress) {
    const downloadProgress = document.querySelector('.download-progress');
    const downloadProgressBar = document.querySelector('.download-progress-bar');
    const downloadProgressText = document.querySelector('.download-progress-text');
    const downloadBtn = document.getElementById('download-btn');

    downloadProgress.style.display = 'block';
    downloadProgressBar.style.width = `${progress}%`;
    downloadProgressText.textContent = `${Math.round(progress)}%`;

    // 更新下载按钮状态
    if (progress === 100) {
        downloadBtn.innerHTML = '<i class="fas fa-check"></i> 下载完成';
        downloadBtn.classList.add('download-complete');
    } else if (progress > 0) {
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下载中...';
        downloadBtn.classList.add('downloading');
    }
}

// 隐藏下载进度
function hideDownloadProgress() {
    const downloadProgress = document.querySelector('.download-progress');
    const downloadBtn = document.getElementById('download-btn');

    downloadProgress.style.display = 'none';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载转换后的模型';
    downloadBtn.classList.remove('download-complete', 'downloading');
}

// 输入类型处理
document.getElementById('input-types').addEventListener('input', function(e) {
    const value = e.target.value;
    if (value.includes(',')) {
        const types = value.split(',').map(type => type.trim());
        e.target.value = JSON.stringify(types);
    }
});

// 开始转换
document.getElementById('start-btn').addEventListener('click', async function() {
    const fileInput = document.getElementById('model-upload');
    const file = fileInput.files[0];
    const framework = document.getElementById('framework-select').value;
    const inputShapes = document.getElementById('input-shapes').value;
    const inputTypes = document.getElementById('input-types').value;

    if (!file) {
        showError(translations[window.i18nManager.currentLang]["chooseFile"]);
        return;
    }

    try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        formData.append('framework', framework);
        formData.append('input_shapes', inputShapes);
        formData.append('input_types', inputTypes);

        // 显示进度条
        updateProgress(0, translations[window.i18nManager.currentLang]["loading"]);

        // 发送请求
        const response = await fetch('/api/v1/model_converter/upload'.replace(/\\/g, '/'), {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('转换失败');
        }

        const result = await response.json();
        const downloadUrl = `/api/v1/model_converter${result.download_url}`.replace(/\\/g, '/');

        // 更新进度
        updateProgress(100, translations[window.i18nManager.currentLang]["conversionComplete"]);

        // 显示下载按钮
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.style.display = 'block';
        downloadBtn.href = downloadUrl;

        // 添加下载进度监听
        downloadBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const url = this.href;

            try {
                const response = await fetch(url);
                const reader = response.body.getReader();
                const contentLength = +response.headers.get('Content-Length');
                let receivedLength = 0;

                showDownloadProgress(0);

                while(true) {
                    const {done, value} = await reader.read();

                    if (done) {
                        showDownloadProgress(100);
                        setTimeout(() => {
                            hideDownloadProgress();
                        }, 2000);
                        break;
                    }

                    receivedLength += value.length;
                    const progress = (receivedLength / contentLength) * 100;
                    showDownloadProgress(progress);
                }

                // 创建下载链接
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'converted_model.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(a);

            } catch (error) {
                showError(translations[window.i18nManager.currentLang]["downloadError"]);
                hideDownloadProgress();
            }
        });

    } catch (error) {
        showError(translations[window.i18nManager.currentLang]["conversionError"]);
        updateProgress(0, translations[window.i18nManager.currentLang]["conversionFailed"]);
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initTheme();

    // 绑定主题切换按钮
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 初始化多语言支持
    if (window.i18nManager) {
        window.i18nManager.init();
    }
});

async function attemptDownload(downloadUrl) {
  try {
    // 显示下载进度条
    const downloadProgress = document.querySelector('.download-progress');
    const downloadProgressBar = document.querySelector('.download-progress-bar');
    const downloadProgressText = document.querySelector('.download-progress-text');

    if (!downloadProgress || !downloadProgressBar || !downloadProgressText) {
      console.error('下载进度元素未找到');
      return;
    }

    downloadProgress.style.display = 'block';
    downloadProgressBar.style.width = '0%';
    downloadProgressText.textContent = '准备下载...';

    // 确保下载URL正确
    if (!downloadUrl) {
      throw new Error('下载URL无效');
    }

    // 直接使用 GET 请求下载文件
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    // 获取文件大小
    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    let loaded = 0;

    // 创建响应流读取器
    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      // 更新下载进度
      const progress = (loaded / total) * 100;
      downloadProgressBar.style.width = `${progress}%`;
      downloadProgressText.textContent = `下载中... ${Math.round(progress)}%`;
    }

    // 合并数据块并创建Blob
    const blob = new Blob(chunks, { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadUrl.split('/').pop(); // 使用URL中的文件名
    document.body.appendChild(a);
    a.click();

    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // 更新下载状态
    downloadProgressText.textContent = '下载完成！';
    setTimeout(() => {
      downloadProgress.style.display = 'none';
    }, 2000);

  } catch (error) {
    console.error('下载错误:', error);
    showError(`下载文件时出错: ${error.message}`);
    const downloadProgress = document.querySelector('.download-progress');
    if (downloadProgress) {
      downloadProgress.style.display = 'none';
    }
  }
}
