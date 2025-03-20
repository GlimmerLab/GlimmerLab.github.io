// 监听 input-types 输入框的变化，自动格式化输入
document.getElementById("input-types").addEventListener("input", function (event) {
  let inputValue = event.target.value.trim();

  // 如果用户输入类似 "f32, f16"，自动转换成 JSON 数组格式
  if (inputValue.includes(",") && !inputValue.startsWith("[")) {
    inputValue = "[" + inputValue.split(",").map(v => `"${v.trim()}"`).join(", ") + "]";
    event.target.value = inputValue;
  }

  // 如果输入的是单个类型，移除意外的引号
  if (/^["']?\w+["']?$/.test(inputValue)) {
    event.target.value = inputValue.replace(/["']/g, ""); // 移除引号
  }
});


// 监听开始转换按钮的点击事件
document.getElementById("start-btn").addEventListener("click", async function () {
  const modelFile = document.getElementById("model-upload").files[0];
  const framework = document.getElementById("framework-selector").value;
  const inputShapes = document.getElementById("input-shapes").value.trim();
  let inputTypes = document.getElementById("input-types").value.trim();

  const errorPopup = document.getElementById("error-popup");
  const errorMessage = document.getElementById("error-message");
  const progressBar = document.getElementById("progress-bar");
  const progressContainer = document.getElementById("progress-container");
  const downloadBtn = document.getElementById("download-btn");

  // 重置 UI
  downloadBtn.style.display = "none";
  progressBar.style.width = "0%";
  progressContainer.style.display = "none";

  // 验证是否上传了文件
  if (!modelFile) {
    showError("Please upload a model before converting!");
    return;
  }

  // 声明变量
  let parsedInputShapes, parsedInputTypes, formattedInputTypes;

  // 解析并验证 input_shapes 和 input_types
  try {
    // 解析 input_shapes，确保是列表
    parsedInputShapes = JSON.parse(inputShapes);
    if (!Array.isArray(parsedInputShapes)) {
      throw new Error("input_shapes must be a list");
    }

    // 解析 input_types，支持单个字符串或列表
    if (inputTypes.startsWith("[")) {
      parsedInputTypes = JSON.parse(inputTypes); // 解析为数组
    } else {
      parsedInputTypes = inputTypes; // 单个字符串
    }

    // 确保 input_shapes 和 input_types 长度匹配
    if (Array.isArray(parsedInputShapes[0])) { // **多个输入**
      if (!Array.isArray(parsedInputTypes) || parsedInputShapes.length !== parsedInputTypes.length) {
        throw new Error("Length of input_shapes and input_types must match for multiple inputs.");
      }
    } else { // **单个输入**
      if (Array.isArray(parsedInputTypes)) {
        throw new Error("For single input, input_types must be a string, not a list.");
      }
    }

    // 确保 inputTypes 传输时是正确 JSON 格式
    formattedInputTypes = typeof parsedInputTypes === "string" ? parsedInputTypes : JSON.stringify(parsedInputTypes);
  } catch (e) {
    showError("Invalid input shapes or types format. Please use a valid format (e.g., [1, 3, 224, 224] and f32 or [f32, f32]).");
    return;
  }

  // 准备上传的 FormData
  const formData = new FormData();
  formData.append("file", modelFile);
  formData.append("framework", framework);
  formData.append("input_shapes", JSON.stringify(parsedInputShapes)); // 确保是 JSON 字符串
  formData.append("input_types", formattedInputTypes); // 单个字符串时不需要 JSON.stringify()

  // 显示进度条
  progressContainer.style.display = "block";

  try {
    // 上传模型文件
    const response = await fetch('/api/upload_model/', {
      method: 'POST',
      body: formData,
    });

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload and convert model');
    }

    // 获取上传成功的响应信息
    const result = await response.json();
    const downloadUrl = result.download_url; // 从后端获取动态下载链接

    // 模拟进度条更新
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += 10;
        progressBar.style.width = `${progress}%`;
      } else {
        clearInterval(interval);

        // 在进度条完成后显示下载按钮
        downloadBtn.style.display = "block";

        // 配置按钮点击事件，触发文件下载
        downloadBtn.onclick = async function () {
          try {
            const downloadResponse = await fetch(downloadUrl);

            if (!downloadResponse.ok) {
              throw new Error('Failed to download the converted file');
            }

            // 创建文件下载链接
            const blob = await downloadResponse.blob();
            const downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.download = "model_conversion_results.zip"; // 默认文件名
            downloadLink.click();

            // 下载完成后，重置并隐藏进度条
            progressBar.style.width = "0%";
            progressContainer.style.display = "none";
          } catch (error) {
            console.error("Error during file download:", error);
            showError(error.message);
          }
        };
      }
    }, 1000);
  } catch (error) {
    console.error("Error:", error);

    // 显示错误提示
    showError(error.message);

    // 隐藏进度条
    progressContainer.style.display = "none";
  }
});

// 初始化关闭按钮事件
const closeButton = document.getElementById("close-error-popup");
closeButton.addEventListener("click", () => {
  const errorPopup = document.getElementById("error-popup");
  errorPopup.style.display = "none";
});

// 显示错误提示的函数
function showError(message) {
  const errorPopup = document.getElementById("error-popup");
  const errorMessage = document.getElementById("error-message");

  // 显示错误提示
  errorPopup.style.display = "block";
  errorMessage.innerHTML = message;

  // 设置自动隐藏的定时器
  const autoCloseTimer = setTimeout(() => {
    errorPopup.style.display = "none";
  }, 3000);

  // 手动关闭时清除定时器
  closeButton.addEventListener(
    "click",
    () => {
      clearTimeout(autoCloseTimer);
    },
    { once: true } // 确保事件只触发一次
  );
}

   // 添加交互逻辑
   document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".dropdown");

    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".dropdown-toggle");
      const menu = dropdown.querySelector(".dropdown-menu");

      // 鼠标悬停（仅桌面端）
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

      // 点击展开/折叠（适配移动端）
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        menu.classList.toggle("show");
      });

      // 点击页面其他地方关闭下拉菜单
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
    heroSubtitle: "Seamlessly convert models between various frameworks like TensorFlow, PyTorch, and more.",
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
    privacyWarning: "⚠️ 本服务不会保存上传的模型，有顾虑的小伙伴请谨慎使用！⚠️",
    heroTitle: "轻松转换深度学习模型",
    heroSubtitle: "无缝转换各种框架模型,如TensorFlow、PyTorch等。",
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
document.getElementById("language-selector").addEventListener("change", (event) => {
  const selectedLanguage = event.target.value;
  const textElements = document.querySelectorAll("[data-key]");

  // 更新页面文本内容
  textElements.forEach(el => {
    const key = el.getAttribute("data-key");
    if (translations[selectedLanguage][key]) {
      el.textContent = translations[selectedLanguage][key];
    }
  });

  // 更新 <label> 标签的文本
  document.querySelector("label[for='input-shapes']").textContent = translations[selectedLanguage]["inputShapes"];
  document.querySelector("label[for='input-types']").textContent = translations[selectedLanguage]["inputTypes"];

  // 更新 <h2> 标签的文本
  document.querySelector(".parameter-control h2").textContent = translations[selectedLanguage]["controlParameters"];

  // 更新 <option> 选项
  document.querySelector("#framework-selector option[value='ncnn']").innerText = translations[selectedLanguage]["ncnn"];
  // document.querySelector("#framework-selector option[value='onnx']").innerText = translations[selectedLanguage]["onnx"];

  // 更新非直接文本内容的部分
  document.querySelector(".modelflow-title").textContent = "ModelFlow";
  document.querySelector("footer p").textContent = `© 2024 ModelFlow. ${translations[selectedLanguage].footer}`;
});