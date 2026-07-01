import React, { useState, useEffect } from 'react';
import { Key, Image, Zap, Save, RotateCcw, Globe, FileText, Brain, ArrowUp, HelpCircle, Link2, ChevronDown, Volume2, Info, RefreshCw, CheckCircle } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { appVersion } from '@/utils/appVersion';

// 组件内翻译
const settingsI18n = {
  zh: {
    nav: { backToHome: '返回首页' },
    settings: {
      title: "系统设置",
      subtitle: "配置应用的各项参数",
      sections: {
        appearance: "外观设置", language: "界面语言", apiConfig: "默认 API 配置",
        apiConfigDesc: "下方模型未单独指定提供商时，将使用此处的配置",
        modelConfig: "模型配置", mineruConfig: "MinerU 配置", imageConfig: "图像生成配置",
        performanceConfig: "性能配置", outputLanguage: "输出语言设置",
        textReasoning: "文本推理模式", imageReasoning: "图像推理模式",
        baiduOcr: "百度配置", serviceTest: "服务测试", lazyllmConfig: "LazyLLM 厂商配置",
        vendorApiKeys: "厂商 API Key 配置",
        advancedSettings: "高级设置",
        elevenlabs: "ElevenLabs 语音合成",
        about: "关于"
      },
      about: {
        version: "当前版本",
        source: "GitHub 项目",
        checkUpdate: "检查更新",
        checking: "检查中...",
        upToDate: "您当前已是最新版本",
        updateAvailable: "有版本更新：{{version}}",
        unknown: "无法判断当前是否为最新版本",
        failed: "检查更新失败",
        resultTitle: "检查更新结果",
        close: "关闭",
      },
      openaiOAuth: {
        title: "OpenAI 账号连接",
        description: "通过 OAuth 登录 OpenAI 账号，无需手动输入 API Key 即可使用 OpenAI 的模型（如 GPT Image）",
        loginBtn: "Login with OpenAI",
        disconnectBtn: "断开连接",
        connected: "已连接",
        disconnected: "未连接",
        account: "账号",
        connecting: "连接中...",
        disconnecting: "断开中...",
        connectFailed: "连接失败",
        disconnectFailed: "断开失败",
        disconnectSuccess: "已断开 OpenAI 账号",
        hint: "连接后，可在上方模型配置中选择 Codex 作为提供商，使用你的 OpenAI 账号额度",
        availableModels: "可用模型",
        selectModel: "选择模型...",
        loadingModels: "正在加载可用模型...",
        connectFirst: "请先连接 OpenAI 账号",
        manualCallbackLabel: "登录后连接失败？",
        manualCallbackHint: "请复制弹窗浏览器地址栏中的完整地址，粘贴到下方即可完成连接",
        manualCallbackPlaceholder: "粘贴回调地址...",
        manualCallbackSubmit: "提交",
        manualCallbackSuccess: "连接成功",
        callbackPortBusy: "检测到本机 1455 端口被占用，请登录后复制弹窗地址栏中的完整地址并粘贴到下方。",
      },
      theme: { label: "主题模式", light: "浅色", dark: "深色", system: "跟随系统" },
      language: { label: "界面语言", zh: "中文", en: "English" },
      fields: {
        aiProviderFormat: "AI 提供商格式",
        aiProviderFormatDesc: "选择 API 请求格式，影响后端如何构造和发送请求。保存设置后生效。",
        openaiFormat: "OpenAI 格式", geminiFormat: "Gemini 格式", lazyllmFormat: "LazyLLM 格式",
        apiBaseUrl: "API Base URL", apiBaseUrlPlaceholder: "https://api.example.com",
        apiBaseUrlDesc: "设置大模型提供商 API 的基础 URL",
        apiKey: "API Key", apiKeyPlaceholder: "输入新的 API Key",
        apiKeyDesc: "留空则保持当前设置不变，输入新值则更新",
        apiKeySet: "已设置（长度: {{length}}）",
        textModel: "文本大模型", textModelPlaceholder: "留空使用环境变量配置 (如: gemini-3-flash-preview)",
        textModelDesc: "用于生成大纲、描述等文本内容的模型名称",
        imageModel: "图像生成模型", imageModelPlaceholder: "留空使用环境变量配置 (如: imagen-3.0-generate-001)",
        imageModelDesc: "用于生成页面图片的模型名称",
        imageCaptionModel: "图片识别模型", imageCaptionModelPlaceholder: "留空使用环境变量配置 (如: gemini-3-flash-preview)",
        imageCaptionModelDesc: "用于识别参考文件中的图片并生成描述",
        mineruApiBase: "MinerU API Base", mineruApiBasePlaceholder: "留空使用环境变量配置 (如: https://mineru.net)",
        mineruApiBaseDesc: "MinerU 服务地址，用于解析参考文件",
        mineruToken: "MinerU Token", mineruTokenPlaceholder: "输入新的 MinerU Token",
        mineruTokenDesc: "留空则保持当前设置不变，输入新值则更新",
        imageResolution: "图像清晰度（某些OpenAI格式中转调整该值无效）",
        imageResolutionDesc: "更高的清晰度会生成更详细的图像，但需要更长时间",
        descriptionGenerationMode: "描述生成模式", descriptionGenerationModeDesc: "流式模式通过一次 AI 调用逐页生成，体验更流畅；并行模式为每页独立调用 AI，速度更快",
        descriptionGenerationModeStreaming: "流式", descriptionGenerationModeParallel: "并行",
        maxDescriptionWorkers: "描述生成最大并发数", maxDescriptionWorkersDesc: "并行模式下同时生成描述的最大工作线程数 (1-20)，越大速度越快",
        maxImageWorkers: "图像生成最大并发数", maxImageWorkersDesc: "同时生成图像的最大工作线程数 (1-20)，越大速度越快",
        defaultOutputLanguage: "默认输出语言", defaultOutputLanguageDesc: "AI 生成内容时使用的默认语言",
        enableTextReasoning: "启用文本推理", enableTextReasoningDesc: "开启后，文本生成（大纲、描述等）会使用 extended thinking 进行深度推理",
        textThinkingBudget: "文本思考负载", textThinkingBudgetDesc: "文本推理的思考 token 预算 (1-8192)，数值越大推理越深入",
        enableImageReasoning: "启用图像推理", enableImageReasoningDesc: "开启后，图像生成会使用思考链模式，可能获得更好的构图效果",
        imageThinkingBudget: "图像思考负载", imageThinkingBudgetDesc: "图像推理的思考 token 预算 (1-8192)，数值越大推理越深入",
        baiduOcrApiKey: "百度 API Key", baiduOcrApiKeyPlaceholder: "输入百度 API Key",
        baiduOcrApiKeyDesc: "用于可编辑 PPTX 导出时的文字识别功能，留空则保持当前设置不变",
        elevenLabsEnabled: "启用 ElevenLabs 语音合成",
        elevenLabsEnabledDesc: "开启后，视频导出将使用 ElevenLabs 代替 edge-tts 生成旁白音频，音质更自然",
        elevenLabsApiKey: "ElevenLabs API Key", elevenLabsApiKeyPlaceholder: "输入 ElevenLabs API Key",
        elevenLabsApiKeyDesc: "留空则保持当前设置不变，API Key 可在 ElevenLabs 控制台获取",
        applyLink: "，请点击此处申请",
        textModelSource: "文本模型提供商格式", textModelSourceDesc: "选择文本生成使用的提供商格式", textModelSourcePlaceholder: "-- 请选择 --",
        imageModelSource: "图片模型提供商格式", imageModelSourceDesc: "选择图片生成使用的提供商格式", imageModelSourcePlaceholder: "-- 请选择 --",
        imageCaptionModelSource: "图片识别模型提供商格式", imageCaptionModelSourceDesc: "选择图片识别使用的提供商格式", imageCaptionModelSourcePlaceholder: "-- 请选择 --",
        vendorApiKey: "{{vendor}} API Key", vendorApiKeyPlaceholder: "输入 {{vendor}} API Key",
        vendorApiKeyDesc: "留空则保持当前设置不变，输入新值则更新",
        vendorApiKeySet: "已设置（长度: {{length}}）",
        selectPlaceholder: "-- 请选择 --",
        modelProvider: "提供商", modelProviderDesc: "为此模型选择独立的提供商，不选则使用上方默认配置",
        modelProviderPlaceholder: "-- 使用默认配置 --",
        perModelApiBaseUrl: "API Base URL", perModelApiBaseUrlPlaceholder: "留空使用默认 Base URL",
        perModelApiKey: "API Key", perModelApiKeyPlaceholder: "输入 API Key",
        perModelApiKeyDesc: "留空则保持当前设置不变",
        perModelApiKeySet: "已设置（长度: {{length}}）",
        imageApiProtocol: "图片 API 协议",
        imageApiProtocolDesc: "选择图片生成使用的 API 路径。自动检测根据模型名判断，也可强制指定",
        imageApiProtocolAuto: "自动检测",
        imageApiProtocolImages: "images.generate",
        imageApiProtocolChat: "chat.completions",
      },
      apiKeyHelp: {
        title: "如何获取 API 密钥",
        step1: "前往 {{link}} 注册账号",
        step2: "点击顶栏「充值」，根据需要充值一定的额度",
        step3: "点击顶栏「密钥」",
        step4: "点击「创建 key」生成新的 API Key",
      },
      apiKeyTip: { before: "若需快速配置或稳定高并发生图，可选择 ", after: "" },
      serviceTest: {
        title: "服务测试", description: "提前验证关键服务配置是否可用，避免使用期间异常。",
        tip: "提示：图像生成测试可能需要数分钟（取决于模型），请耐心等待。",
        startTest: "开始测试", testing: "测试中...", testTimeout: "测试超时，请重试", testFailed: "测试失败",
        tests: {
          baiduOcr: { title: "Baidu OCR 服务", description: "识别测试图片文字，验证 BAIDU_API_KEY 配置" },
          textModel: { title: "文本生成模型", description: "发送短提示词，验证文本模型与 API 配置" },
          captionModel: { title: "图片识别模型", description: "生成测试图片并请求模型输出描述" },
          baiduInpaint: { title: "Baidu 图像修复", description: "使用测试图片执行修复，验证百度 inpaint 服务" },
          imageModel: { title: "图像生成模型", description: "基于测试图片生成演示文稿背景图（固定分辨率，可能需要 20-40 秒）" },
          mineruPdf: { title: "MinerU 解析 PDF", description: "上传测试 PDF 并等待解析结果返回（可能需要 30-60 秒）" }
        },
        results: {
          recognizedText: "识别结果：{{text}}", modelReply: "模型回复：{{reply}}",
          captionDesc: "识别描述：{{caption}}", imageSize: "输出尺寸：{{width}}x{{height}}",
          parsePreview: "解析预览：{{preview}}"
        }
      },
      actions: { save: "保存设置", saving: "保存中...", resetToDefault: "重置为默认配置" },
      messages: {
        loadFailed: "加载设置失败", saveSuccess: "设置保存成功", saveFailed: "保存设置失败",
        resetConfirm: "将把大模型、图像生成和并发等所有配置恢复为环境默认值，已保存的自定义设置将丢失，确定继续吗？",
        resetTitle: "确认重置为默认配置", resetSuccess: "设置已重置", resetFailed: "重置设置失败",
        testServiceTip: "建议在本页底部进行服务测试，验证关键配置",
        resetConfirmBtn: "确定重置", resetCancelBtn: "取消", unknownError: "未知错误",
        testSuccess: "测试成功"
      }
    }
  },
  en: {
    nav: { backToHome: 'Back to Home' },
    settings: {
      title: "Settings",
      subtitle: "Configure application parameters",
      sections: {
        appearance: "Appearance", language: "Interface Language", apiConfig: "Default API Configuration",
        apiConfigDesc: "Used as fallback when a model below has no provider specified",
        modelConfig: "Model Configuration", mineruConfig: "MinerU Configuration", imageConfig: "Image Generation Configuration",
        performanceConfig: "Performance Configuration", outputLanguage: "Output Language Settings",
        textReasoning: "Text Reasoning Mode", imageReasoning: "Image Reasoning Mode",
        baiduOcr: "Baidu Configuration", serviceTest: "Service Test", lazyllmConfig: "LazyLLM Provider Configuration",
        vendorApiKeys: "Vendor API Key Configuration",
        advancedSettings: "Advanced Settings",
        elevenlabs: "ElevenLabs Text-to-Speech",
        about: "About"
      },
      about: {
        version: "Current Version",
        source: "GitHub Project",
        checkUpdate: "Check for Updates",
        checking: "Checking...",
        upToDate: "You're currently on the latest version",
        updateAvailable: "Version update available: {{version}}",
        unknown: "Unable to determine whether this is the latest version",
        failed: "Failed to check for updates",
        resultTitle: "Update Check Result",
        close: "Close",
      },
      openaiOAuth: {
        title: "OpenAI Account",
        description: "Log in with your OpenAI account via OAuth to use OpenAI models (e.g. GPT Image) without entering an API key",
        loginBtn: "Login with OpenAI",
        disconnectBtn: "Disconnect",
        connected: "Connected",
        disconnected: "Not connected",
        account: "Account",
        connecting: "Connecting...",
        disconnecting: "Disconnecting...",
        connectFailed: "Connection failed",
        disconnectFailed: "Disconnect failed",
        disconnectSuccess: "OpenAI account disconnected",
        hint: "When connected, select Codex as the provider in model configuration above to use your OpenAI account credits",
        availableModels: "Available Models",
        selectModel: "Select a model...",
        loadingModels: "Loading available models...",
        connectFirst: "Please connect your OpenAI account first",
        manualCallbackLabel: "Connection failed after login?",
        manualCallbackHint: "Copy the full URL from the popup's address bar and paste it below to complete the connection",
        manualCallbackPlaceholder: "Paste callback URL...",
        manualCallbackSubmit: "Submit",
        manualCallbackSuccess: "Connected successfully",
        callbackPortBusy: "Port 1455 is already in use. After logging in, copy the full popup address-bar URL and paste it below.",
      },
      theme: { label: "Theme", light: "Light", dark: "Dark", system: "System" },
      language: { label: "Interface Language", zh: "中文", en: "English" },
      fields: {
        aiProviderFormat: "AI Provider Format",
        aiProviderFormatDesc: "Select API request format, affects how backend constructs and sends requests. Takes effect after saving.",
        openaiFormat: "OpenAI Format", geminiFormat: "Gemini Format", lazyllmFormat: "LazyLLM Format",
        apiBaseUrl: "API Base URL", apiBaseUrlPlaceholder: "https://api.example.com",
        apiBaseUrlDesc: "Set the base URL for the LLM provider API",
        apiKey: "API Key", apiKeyPlaceholder: "Enter new API Key",
        apiKeyDesc: "Leave empty to keep current setting, enter new value to update",
        apiKeySet: "Set (length: {{length}})",
        textModel: "Text Model", textModelPlaceholder: "Leave empty to use env config (e.g., gemini-3-flash-preview)",
        textModelDesc: "Model name for generating outlines, descriptions, etc.",
        imageModel: "Image Generation Model", imageModelPlaceholder: "Leave empty to use env config (e.g., imagen-3.0-generate-001)",
        imageModelDesc: "Model name for generating page images",
        imageCaptionModel: "Image Caption Model", imageCaptionModelPlaceholder: "Leave empty to use env config (e.g., gemini-3-flash-preview)",
        imageCaptionModelDesc: "Model for recognizing images in reference files and generating descriptions",
        mineruApiBase: "MinerU API Base", mineruApiBasePlaceholder: "Leave empty to use env config (e.g., https://mineru.net)",
        mineruApiBaseDesc: "MinerU service address for parsing reference files",
        mineruToken: "MinerU Token", mineruTokenPlaceholder: "Enter new MinerU Token",
        mineruTokenDesc: "Leave empty to keep current setting, enter new value to update",
        imageResolution: "Image Resolution (may not work with some OpenAI format proxies)",
        imageResolutionDesc: "Higher resolution generates more detailed images but takes longer",
        descriptionGenerationMode: "Description Generation Mode", descriptionGenerationModeDesc: "Streaming mode generates all pages in a single AI call for a smoother experience; Parallel mode calls AI independently per page for faster speed",
        descriptionGenerationModeStreaming: "Streaming", descriptionGenerationModeParallel: "Parallel",
        maxDescriptionWorkers: "Max Description Workers", maxDescriptionWorkersDesc: "Maximum concurrent workers for description generation in parallel mode (1-20), higher is faster",
        maxImageWorkers: "Max Image Workers", maxImageWorkersDesc: "Maximum concurrent workers for image generation (1-20), higher is faster",
        defaultOutputLanguage: "Default Output Language", defaultOutputLanguageDesc: "Default language for AI-generated content",
        enableTextReasoning: "Enable Text Reasoning", enableTextReasoningDesc: "When enabled, text generation uses extended thinking for deeper reasoning",
        textThinkingBudget: "Text Thinking Budget", textThinkingBudgetDesc: "Token budget for text reasoning (1-8192), higher values enable deeper reasoning",
        enableImageReasoning: "Enable Image Reasoning", enableImageReasoningDesc: "When enabled, image generation uses chain-of-thought mode for better composition",
        imageThinkingBudget: "Image Thinking Budget", imageThinkingBudgetDesc: "Token budget for image reasoning (1-8192), higher values enable deeper reasoning",
        baiduOcrApiKey: "Baidu API Key", baiduOcrApiKeyPlaceholder: "Enter Baidu API Key",
        baiduOcrApiKeyDesc: "For text recognition in editable PPTX export, leave empty to keep current setting",
        elevenLabsEnabled: "Enable ElevenLabs Text-to-Speech",
        elevenLabsEnabledDesc: "When enabled, video export uses ElevenLabs instead of edge-tts for narration audio, providing more natural voice quality",
        elevenLabsApiKey: "ElevenLabs API Key", elevenLabsApiKeyPlaceholder: "Enter ElevenLabs API Key",
        elevenLabsApiKeyDesc: "Leave empty to keep current setting. Get your API key from the ElevenLabs dashboard",
        applyLink: ", click here to apply",
        textModelSource: "Text Model Provider Format", textModelSourceDesc: "Select the provider format for text generation", textModelSourcePlaceholder: "-- Select --",
        imageModelSource: "Image Model Provider Format", imageModelSourceDesc: "Select the provider format for image generation", imageModelSourcePlaceholder: "-- Select --",
        imageCaptionModelSource: "Image Caption Model Provider Format", imageCaptionModelSourceDesc: "Select the provider format for image captioning", imageCaptionModelSourcePlaceholder: "-- Select --",
        vendorApiKey: "{{vendor}} API Key", vendorApiKeyPlaceholder: "Enter {{vendor}} API Key",
        vendorApiKeyDesc: "Leave empty to keep current setting, enter new value to update",
        vendorApiKeySet: "Set (length: {{length}})",
        selectPlaceholder: "-- Select --",
        modelProvider: "Provider", modelProviderDesc: "Select an independent provider for this model, leave empty to use default config",
        modelProviderPlaceholder: "-- Use default config --",
        perModelApiBaseUrl: "API Base URL", perModelApiBaseUrlPlaceholder: "Leave empty to use default Base URL",
        perModelApiKey: "API Key", perModelApiKeyPlaceholder: "Enter API Key",
        perModelApiKeyDesc: "Leave empty to keep current setting",
        perModelApiKeySet: "Set (length: {{length}})",
        imageApiProtocol: "Image API Protocol",
        imageApiProtocolDesc: "Select the API path for image generation. Auto detects by model name, or force a specific path",
        imageApiProtocolAuto: "Auto detect",
        imageApiProtocolImages: "images.generate",
        imageApiProtocolChat: "chat.completions",
      },
      apiKeyHelp: {
        title: "How to get an API key",
        step1: "Register at {{link}}",
        step2: "Click \"Recharge\" in the top navigation bar and add credits as needed",
        step3: "Click \"Keys\" in the top navigation bar",
        step4: "Click \"Create Key\" to generate a new API Key",
      },
      apiKeyTip: { before: "For quick setup or stable high-concurrency image generation, get an API key from ", after: "" },
      serviceTest: {
        title: "Service Test", description: "Verify key service configurations before use to avoid issues.",
        tip: "Tip: Image generation tests may take several minutes depending on the model, please be patient.",
        startTest: "Start Test", testing: "Testing...", testTimeout: "Test timeout, please retry", testFailed: "Test failed",
        tests: {
          baiduOcr: { title: "Baidu OCR Service", description: "Recognize text in test image, verify BAIDU_API_KEY configuration" },
          textModel: { title: "Text Generation Model", description: "Send short prompt to verify text model and API configuration" },
          captionModel: { title: "Image Caption Model", description: "Generate test image and request model to output description" },
          baiduInpaint: { title: "Baidu Image Inpainting", description: "Use test image for inpainting, verify Baidu inpaint service" },
          imageModel: { title: "Image Generation Model", description: "Generate presentation background from test image (fixed resolution, may take 20-40 seconds)" },
          mineruPdf: { title: "MinerU PDF Parsing", description: "Upload test PDF and wait for parsing result (may take 30-60 seconds)" }
        },
        results: {
          recognizedText: "Recognized: {{text}}", modelReply: "Model reply: {{reply}}",
          captionDesc: "Caption: {{caption}}", imageSize: "Output size: {{width}}x{{height}}",
          parsePreview: "Parse preview: {{preview}}"
        }
      },
      actions: { save: "Save Settings", saving: "Saving...", resetToDefault: "Reset to Default" },
      messages: {
        loadFailed: "Failed to load settings", saveSuccess: "Settings saved successfully", saveFailed: "Failed to save settings",
        resetConfirm: "This will reset all configurations (LLM, image generation, concurrency, etc.) to environment defaults. Custom settings will be lost. Continue?",
        resetTitle: "Confirm Reset to Default", resetSuccess: "Settings reset successfully", resetFailed: "Failed to reset settings",
        testServiceTip: "It's recommended to test services at the bottom of this page to verify configurations",
        resetConfirmBtn: "Confirm Reset", resetCancelBtn: "Cancel", unknownError: "Unknown error",
        testSuccess: "Test passed"
      }
    }
  }
};
import { Button, Input, Loading, Modal, useToast, ToastContainer, useConfirm } from '@/components/shared';
import * as api from '@/api/endpoints';
import type { OutputLanguage, UpdateCheckInfo } from '@/api/endpoints';
import { OUTPUT_LANGUAGE_OPTIONS } from '@/api/endpoints';
import type { EffectiveSettings, PersonalSettings, Project, Settings as SettingsType } from '@/types';

// 配置项类型定义
type FieldType = 'text' | 'password' | 'number' | 'select' | 'buttons' | 'switch';

interface FieldConfig {
  key: keyof typeof initialFormData;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  sensitiveField?: boolean;  // 是否为敏感字段（如 API Key）
  lengthKey?: keyof SettingsType;  // 用于显示已有长度的 key（如 api_key_length）
  options?: { value: string; label: string }[];  // select 类型的选项
  min?: number;
  max?: number;
  link?: string;  // 申请链接 URL
}

interface SectionConfig {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface ServiceTestState {
  status: TestStatus;
  message?: string;
  detail?: string;
}

type SettingsScope = 'global' | 'personal';

type PersonalPreferenceMode = 'auto' | 'global';

type PersonalCapabilityMode = 'subscription' | 'global-api' | 'personal-api' | 'enterprise-proxy';

interface PersonalConfigState {
  mode: PersonalPreferenceMode;
  outline: PersonalCapabilityMode;
  description: PersonalCapabilityMode;
  naturalEdit: PersonalCapabilityMode;
  image: PersonalCapabilityMode;
  editablePptx: PersonalCapabilityMode;
  elementGeneration: PersonalCapabilityMode;
}

const personalModeLabels: Record<PersonalCapabilityMode, string> = {
  subscription: 'ChatGPT Team 订阅',
  'global-api': '继承全局 API',
  'personal-api': '个人 API',
  'enterprise-proxy': '企业代理',
};

const defaultPersonalConfig: PersonalConfigState = {
  mode: 'auto',
  outline: 'subscription',
  description: 'subscription',
  naturalEdit: 'subscription',
  image: 'global-api',
  editablePptx: 'enterprise-proxy',
  elementGeneration: 'global-api',
};

// LazyLLM 支持的厂商列表
const LAZYLLM_SOURCES = [
  { value: 'qwen', label: 'Qwen (通义千问)' },
  { value: 'doubao', label: 'Doubao (豆包)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'glm', label: 'GLM (智谱)' },
  { value: 'siliconflow', label: 'SiliconFlow' },
  { value: 'sensenova', label: 'SenseNova (商汤)' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'kimi', label: 'Kimi' },
];

// 所有可用的提供商选项（Gemini/OpenAI/Codex + LazyLLM 厂商）
const ALL_PROVIDER_SOURCES = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'codex', label: 'Codex (OpenAI OAuth)' },
  ...LAZYLLM_SOURCES.filter(s => s.value !== 'openai'), // avoid duplicate 'openai'
];

// 需要 API Key + Base URL 的提供商（非 LazyLLM 厂商）
const API_KEY_PROVIDERS = new Set(['gemini', 'openai']);

// LazyLLM 厂商名集合
const LAZYLLM_VENDOR_SET = new Set(LAZYLLM_SOURCES.map(s => s.value));

// 初始表单数据
const initialFormData = {
  ai_provider_format: 'gemini' as string,
  api_base_url: '',
  api_key: '',
  text_model: '',
  image_model: '',
  image_caption_model: '',
  mineru_api_base: '',
  mineru_token: '',
  image_resolution: '2K',
  max_description_workers: 5,
  max_image_workers: 8,
  output_language: 'zh' as OutputLanguage,
  // 推理模式配置（分别控制文本和图像）
  enable_text_reasoning: false,
  text_thinking_budget: 1024,
  enable_image_reasoning: false,
  image_thinking_budget: 1024,
  baidu_api_key: '',
  // LazyLLM 配置
  text_model_source: '',
  image_model_source: '',
  image_caption_model_source: '',
  lazyllm_api_keys: {} as Record<string, string>,
  // Per-model API credentials (for gemini/openai per-model overrides)
  text_api_key: '',
  text_api_base_url: '',
  image_api_key: '',
  image_api_base_url: '',
  image_caption_api_key: '',
  image_caption_api_base_url: '',
  openai_image_api_protocol: 'auto',
  // ElevenLabs TTS
  elevenlabs_api_key: '',
};

const isLazyllmVendor = (vendor: string) =>
  LAZYLLM_VENDOR_SET.has(vendor) && vendor !== 'openai';

// When backend returns "lazyllm", infer specific vendor from configured keys
const resolveLazyllmVendor = (format: string, keysInfo?: Record<string, number>): string => {
  if (format !== 'lazyllm') return format;
  if (keysInfo) {
    const vendor = LAZYLLM_SOURCES.find(s => isLazyllmVendor(s.value) && keysInfo[s.value]);
    if (vendor) return vendor.value;
  }
  return LAZYLLM_SOURCES.find(s => isLazyllmVendor(s.value))?.value || 'deepseek';
};

const GlobalVendorKeyInput: React.FC<{
  vendor: string; formData: typeof initialFormData;
  setFormData: React.Dispatch<React.SetStateAction<typeof initialFormData>>;
  settings: SettingsType | null; t: ReturnType<typeof useT>;
}> = ({ vendor, formData, setFormData, settings, t }) => {
  const vendorLabel = LAZYLLM_SOURCES.find(s => s.value === vendor)?.label || vendor.toUpperCase();
  const keyLength = settings?.lazyllm_api_keys_info?.[vendor] || 0;
  const placeholder = keyLength > 0
    ? t('settings.fields.vendorApiKeySet', { length: keyLength })
    : t('settings.fields.vendorApiKeyPlaceholder', { vendor: vendorLabel });
  return (
    <div className="pl-3 border-l-2 border-amber-300 dark:border-amber-600">
      <Input
        label={t('settings.fields.vendorApiKey', { vendor: vendorLabel })}
        type="password"
        placeholder={placeholder}
        value={formData.lazyllm_api_keys[vendor] || ''}
        onChange={(e) => {
          setFormData(prev => ({
            ...prev,
            lazyllm_api_keys: { ...prev.lazyllm_api_keys, [vendor]: e.target.value }
          }));
        }}
      />
      <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{t('settings.fields.vendorApiKeyDesc')}</p>
    </div>
  );
};

type SettingsTranslator = ReturnType<typeof useT>;

function getLatestVersion(info: UpdateCheckInfo): string {
  const sha = info.latest?.sha;
  if (sha) {
    return sha.length > 7 ? sha.slice(0, 7) : sha;
  }
  return info.latest?.tag || '';
}

function formatUpdateMessage(t: SettingsTranslator, info: UpdateCheckInfo): string {
  if (info.status === 'up_to_date') return t('settings.about.upToDate');
  if (info.status === 'update_available') return t('settings.about.updateAvailable', { version: getLatestVersion(info) });
  return t('settings.about.unknown');
}

export const SettingsAbout: React.FC<{ t: SettingsTranslator }> = ({ t }) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckInfo | null>(null);
  const [updateError, setUpdateError] = useState('');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateError('');
    try {
      const response = await api.checkForUpdates();
      setUpdateInfo(response.data || null);
      setUpdateDialogOpen(true);
    } catch (error: any) {
      setUpdateInfo(null);
      setUpdateError(error?.response?.data?.error?.message || error?.message || t('settings.about.failed'));
      setUpdateDialogOpen(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const showSuccessCheck = updateInfo?.status === 'up_to_date';

  return (
    <>
      <div className="pt-4 border-t border-gray-200 dark:border-border-primary">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground-primary mb-3 flex items-center">
          <Info size={20} />
          <span className="ml-2">{t('settings.sections.about')}</span>
        </h2>
        <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-foreground-tertiary sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div title={appVersion.detail} aria-label={`${t('settings.about.version')} ${appVersion.detail}`}>
              {t('settings.about.version')}: {appVersion.display}
            </div>
            <a
              href="https://github.com/Anionex/banana-slides"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-banana-700 dark:text-banana hover:underline"
            >
              {t('settings.about.source')}
            </a>
            {updateInfo && (
              <div className={updateInfo.update_available ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-foreground-tertiary'}>
                <div>{formatUpdateMessage(t, updateInfo)}</div>
              </div>
            )}
            {updateError && (
              <div className="text-red-600 dark:text-red-400">
                {t('settings.about.failed')}: {updateError}
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={16} className={checkingUpdate ? 'animate-spin' : ''} />}
            onClick={handleCheckUpdate}
            loading={checkingUpdate}
          >
            {checkingUpdate ? t('settings.about.checking') : t('settings.about.checkUpdate')}
          </Button>
        </div>
      </div>

      <Modal isOpen={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} title={t('settings.about.resultTitle')}>
        <div className="space-y-4">
          {updateInfo && (
            <div className="space-y-2 text-sm text-gray-700 dark:text-foreground-secondary">
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                {showSuccessCheck && (
                  <CheckCircle
                    size={44}
                    data-testid="update-success-icon"
                    className="text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                )}
                {updateInfo.update_available && (
                  <ArrowUp
                    size={44}
                    data-testid="update-available-icon"
                    className="text-orange-600 dark:text-orange-400"
                    aria-hidden="true"
                  />
                )}
                <p className={updateInfo.update_available
                  ? 'text-xl font-semibold text-orange-600 dark:text-orange-400'
                  : 'text-xl font-semibold text-gray-900 dark:text-foreground-primary'
                }>
                  {formatUpdateMessage(t, updateInfo)}
                </p>
              </div>
            </div>
          )}
          {updateError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t('settings.about.failed')}: {updateError}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setUpdateDialogOpen(false)}>
              {t('settings.about.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const formDataFromSettings = (data: Partial<SettingsType & PersonalSettings>): typeof initialFormData => ({
  ai_provider_format: resolveLazyllmVendor(data.ai_provider_format || 'gemini', data.lazyllm_api_keys_info),
  api_base_url: data.api_base_url || '',
  api_key: '',
  image_resolution: data.image_resolution || '2K',
  max_description_workers: data.max_description_workers || 5,
  max_image_workers: data.max_image_workers || 8,
  text_model: data.text_model || '',
  image_model: data.image_model || '',
  mineru_api_base: data.mineru_api_base || '',
  mineru_token: '',
  image_caption_model: data.image_caption_model || '',
  output_language: data.output_language || 'zh',
  enable_text_reasoning: data.enable_text_reasoning || false,
  text_thinking_budget: data.text_thinking_budget || 1024,
  enable_image_reasoning: data.enable_image_reasoning || false,
  image_thinking_budget: data.image_thinking_budget || 1024,
  baidu_api_key: '',
  text_model_source: data.text_model_source || '',
  image_model_source: data.image_model_source || '',
  image_caption_model_source: data.image_caption_model_source || '',
  lazyllm_api_keys: {},
  text_api_key: '',
  text_api_base_url: data.text_api_base_url || '',
  image_api_key: '',
  image_api_base_url: data.image_api_base_url || '',
  image_caption_api_key: '',
  image_caption_api_base_url: data.image_caption_api_base_url || '',
  openai_image_api_protocol: data.openai_image_api_protocol || 'auto',
  elevenlabs_api_key: '',
});

// Settings 组件 - 纯嵌入模式（可复用）
export const Settings: React.FC = () => {
  const t = useT(settingsI18n);
  const { show, toasts: settingsToasts, remove: settingsRemove } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    show({ message: '链接已复制到剪贴板', type: 'success' });
  };

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<EffectiveSettings | null>(null);
  const [projectOverrideProjects, setProjectOverrideProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [serviceTestStates, setServiceTestStates] = useState<Record<string, ServiceTestState>>({});
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [manualCallbackUrl, setManualCallbackUrl] = useState('');
  const [manualCallbackOpen, setManualCallbackOpen] = useState(false);
  const [manualCallbackSubmitting, setManualCallbackSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<SettingsScope>('personal');
  const [personalConfig, setPersonalConfig] = useState<PersonalConfigState>(defaultPersonalConfig);
  const [personalDirty, setPersonalDirty] = useState(false);

  const updatePersonalConfig = <K extends keyof PersonalConfigState>(key: K, value: PersonalConfigState[K]) => {
    setPersonalConfig(prev => ({ ...prev, [key]: value }));
    setPersonalDirty(true);
  };

  const forceUseGlobalDefault = () => {
    setPersonalConfig(prev => ({ ...prev, mode: 'global' }));
    setPersonalDirty(true);
    show({ message: '已切换为强制使用全局默认，保存后对当前用户生效', type: 'info' });
  };

  const handleOAuthLogin = async () => {
    setOauthConnecting(true);
    try {
      const resp = await api.getOpenAIOAuthUrl();
      if (resp.success && resp.data?.auth_url) {
        if (resp.data.callback_server_available === false) {
          setManualCallbackOpen(true);
          show({ message: t('settings.openaiOAuth.callbackPortBusy'), type: 'warning' });
        }
        const popup = window.open(resp.data.auth_url, 'openai-oauth', 'width=600,height=700');
        const onMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'openai-oauth-callback') {
            window.removeEventListener('message', onMessage);
            setOauthConnecting(false);
            if (event.data.success) {
              const statusResp = await api.getOpenAIOAuthStatus();
              if (statusResp.success && statusResp.data) {
        setSettings(prev => prev ? {
          ...prev,
          openai_oauth_connected: statusResp.data!.connected,
          openai_oauth_account_id: statusResp.data!.account_id || null,
        } : prev);
        reloadEffectiveSettings();
      }
            } else {
              show({ message: t('settings.openaiOAuth.connectFailed'), type: 'error' });
            }
          }
        };
        window.addEventListener('message', onMessage);
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setOauthConnecting(false);
            window.removeEventListener('message', onMessage);
          }
        }, 1000);
      }
    } catch {
      setOauthConnecting(false);
      show({ message: t('settings.openaiOAuth.connectFailed'), type: 'error' });
    }
  };

  const handleOAuthDisconnect = async () => {
    try {
      const resp = await api.disconnectOpenAIOAuth();
      if (resp.success) {
        setSettings(prev => prev ? {
          ...prev,
          openai_oauth_connected: false,
          openai_oauth_account_id: null,
        } : prev);
        await reloadEffectiveSettings();
        show({ message: t('settings.openaiOAuth.disconnectSuccess'), type: 'success' });
      }
    } catch {
      show({ message: t('settings.openaiOAuth.disconnectFailed'), type: 'error' });
    }
  };

  const handleManualCallback = async () => {
    if (!manualCallbackUrl.trim()) return;
    setManualCallbackSubmitting(true);
    try {
      const resp = await api.submitOAuthManualCallback(manualCallbackUrl.trim());
      if (resp.success) {
        setManualCallbackUrl('');
        setManualCallbackOpen(false);
        const statusResp = await api.getOpenAIOAuthStatus();
        if (statusResp.success && statusResp.data) {
          setSettings(prev => prev ? {
            ...prev,
            openai_oauth_connected: statusResp.data!.connected,
            openai_oauth_account_id: statusResp.data!.account_id || null,
          } : prev);
          await reloadEffectiveSettings();
        }
        show({ message: t('settings.openaiOAuth.manualCallbackSuccess'), type: 'success' });
      } else {
        show({ message: t('settings.openaiOAuth.connectFailed'), type: 'error' });
      }
    } catch {
      show({ message: t('settings.openaiOAuth.connectFailed'), type: 'error' });
    } finally {
      setManualCallbackSubmitting(false);
    }
  };

  // 配置驱动的表单区块定义（使用翻译）
  const settingsSections: SectionConfig[] = [
    // Global API config & Model config are rendered separately above
    {
      title: t('settings.sections.mineruConfig'),
      icon: <FileText size={20} />,
      fields: [
        {
          key: 'mineru_api_base',
          label: t('settings.fields.mineruApiBase'),
          type: 'text',
          placeholder: t('settings.fields.mineruApiBasePlaceholder'),
          description: t('settings.fields.mineruApiBaseDesc'),
        },
        {
          key: 'mineru_token',
          label: t('settings.fields.mineruToken'),
          type: 'password',
          placeholder: t('settings.fields.mineruTokenPlaceholder'),
          sensitiveField: true,
          lengthKey: 'mineru_token_length',
          description: t('settings.fields.mineruTokenDesc'),
          link: 'https://mineru.net/apiManage/token',
        },
      ],
    },
    {
      title: t('settings.sections.imageConfig'),
      icon: <Image size={20} />,
      fields: [
        {
          key: 'image_resolution',
          label: t('settings.fields.imageResolution'),
          type: 'select',
          description: t('settings.fields.imageResolutionDesc'),
          options: [
            { value: '1K', label: '1K (1024px)' },
            { value: '2K', label: '2K (2048px)' },
            { value: '4K', label: '4K (4096px)' },
          ],
        },
      ],
    },
    {
      title: t('settings.sections.performanceConfig'),
      icon: <Zap size={20} />,
      fields: [
        {
          key: 'max_description_workers',
          label: t('settings.fields.maxDescriptionWorkers'),
          type: 'number',
          min: 1,
          max: 20,
          description: t('settings.fields.maxDescriptionWorkersDesc'),
        },
        {
          key: 'max_image_workers',
          label: t('settings.fields.maxImageWorkers'),
          type: 'number',
          min: 1,
          max: 20,
          description: t('settings.fields.maxImageWorkersDesc'),
        },
      ],
    },
    {
      title: t('settings.sections.outputLanguage'),
      icon: <Globe size={20} />,
      fields: [
        {
          key: 'output_language',
          label: t('settings.fields.defaultOutputLanguage'),
          type: 'buttons',
          description: t('settings.fields.defaultOutputLanguageDesc'),
          options: OUTPUT_LANGUAGE_OPTIONS,
        },
      ],
    },
    {
      title: t('settings.sections.textReasoning'),
      icon: <Brain size={20} />,
      fields: [
        {
          key: 'enable_text_reasoning',
          label: t('settings.fields.enableTextReasoning'),
          type: 'switch',
          description: t('settings.fields.enableTextReasoningDesc'),
        },
        {
          key: 'text_thinking_budget',
          label: t('settings.fields.textThinkingBudget'),
          type: 'number',
          min: 1,
          max: 8192,
          description: t('settings.fields.textThinkingBudgetDesc'),
        },
      ],
    },
    {
      title: t('settings.sections.imageReasoning'),
      icon: <Brain size={20} />,
      fields: [
        {
          key: 'enable_image_reasoning',
          label: t('settings.fields.enableImageReasoning'),
          type: 'switch',
          description: t('settings.fields.enableImageReasoningDesc'),
        },
        {
          key: 'image_thinking_budget',
          label: t('settings.fields.imageThinkingBudget'),
          type: 'number',
          min: 1,
          max: 8192,
          description: t('settings.fields.imageThinkingBudgetDesc'),
        },
      ],
    },
    {
      title: t('settings.sections.baiduOcr'),
      icon: <FileText size={20} />,
      fields: [
        {
          key: 'baidu_api_key',
          label: t('settings.fields.baiduOcrApiKey'),
          type: 'password',
          placeholder: t('settings.fields.baiduOcrApiKeyPlaceholder'),
          sensitiveField: true,
          lengthKey: 'baidu_api_key_length',
          description: t('settings.fields.baiduOcrApiKeyDesc'),
          link: 'https://console.bce.baidu.com/iam/#/iam/apikey/list',
        },
      ],
    },
    {
      title: t('settings.sections.elevenlabs'),
      icon: <Volume2 size={20} />,
      fields: [
        {
          key: 'elevenlabs_api_key',
          label: t('settings.fields.elevenLabsApiKey'),
          type: 'password',
          placeholder: t('settings.fields.elevenLabsApiKeyPlaceholder'),
          sensitiveField: true,
          lengthKey: 'elevenlabs_api_key_length',
          description: t('settings.fields.elevenLabsApiKeyDesc'),
          link: 'https://elevenlabs.io/app/settings/api-keys',
        },
      ],
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (activeScope === 'personal') {
      setFormData(formDataFromSettings(personalSettings ? { ...settings, ...personalSettings } : settings));
      setPersonalConfig(prev => ({
        ...prev,
        mode: personalSettings?.force_global_default ? 'global' : 'auto',
      }));
    } else {
      setFormData(formDataFromSettings(settings));
    }
  }, [activeScope, settings, personalSettings]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsResponse, personalResponse, effectiveResponse, projectsResponse] = await Promise.all([
        api.getSettings(),
        api.getPersonalSettings().catch((error) => {
          console.warn('加载个人配置失败:', error);
          return null;
        }),
        api.getEffectiveSettings().catch((error) => {
          console.warn('加载生效配置失败:', error);
          return null;
        }),
        api.listProjects(5).catch((error) => {
          console.warn('加载项目覆盖摘要失败:', error);
          return null;
        }),
      ]);
      const globalData = settingsResponse.data;
      if (globalData) {
        setSettings(globalData);
        sessionStorage.setItem('banana-settings', JSON.stringify(globalData));
        const personalData = personalResponse?.data || null;
        setPersonalSettings(personalData);
        setEffectiveSettings(effectiveResponse?.data || null);
        setProjectOverrideProjects(projectsResponse?.data?.projects || []);
        setPersonalConfig(prev => ({
          ...prev,
          mode: personalData?.force_global_default ? 'global' : 'auto',
        }));
        setFormData(formDataFromSettings(
          activeScope === 'personal' && personalData
            ? { ...globalData, ...personalData }
            : globalData
        ));
      }
    } catch (error: any) {
      console.error('加载设置失败:', error);
      show({
        message: t('settings.messages.loadFailed') + ': ' + (error?.message || t('settings.messages.unknownError')),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reloadEffectiveSettings = async () => {
    try {
      const response = await api.getEffectiveSettings();
      setEffectiveSettings(response.data || null);
    } catch (error) {
      console.warn('刷新生效配置失败:', error);
    }
  };

  const markOpenAIOAuthDisconnected = () => {
    setSettings(prev => {
      if (!prev) return prev;
      const next = {
        ...prev,
        openai_oauth_connected: false,
        openai_oauth_account_id: null,
      };
      sessionStorage.setItem('banana-settings', JSON.stringify(next));
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const {
        api_key, mineru_token, baidu_api_key, elevenlabs_api_key, lazyllm_api_keys,
        text_api_key, image_api_key, image_caption_api_key,
        ...otherData
      } = formData;
      const payload: any = {
        ...otherData,
        ai_provider_format: otherData.ai_provider_format,
      };

      // Only send sensitive fields if user entered a new value
      if (api_key) payload.api_key = api_key;
      if (mineru_token) payload.mineru_token = mineru_token;
      if (baidu_api_key) payload.baidu_api_key = baidu_api_key;
      if (elevenlabs_api_key) payload.elevenlabs_api_key = elevenlabs_api_key;
      if (text_api_key) payload.text_api_key = text_api_key;
      if (image_api_key) payload.image_api_key = image_api_key;
      if (image_caption_api_key) payload.image_caption_api_key = image_caption_api_key;

      // Send lazyllm API keys (only non-empty values)
      const nonEmptyKeys = Object.fromEntries(
        Object.entries(lazyllm_api_keys).filter(([, v]) => v)
      );
      if (Object.keys(nonEmptyKeys).length > 0) {
        payload.lazyllm_api_keys = nonEmptyKeys;
      }

      const response = activeScope === 'personal'
        ? await api.updatePersonalSettings({
          ...payload,
          force_global_default: personalConfig.mode === 'global',
          capability_overrides: {
            outline: { use_global_default: personalConfig.mode === 'global' || personalConfig.outline === 'global-api' },
            description: { use_global_default: personalConfig.mode === 'global' || personalConfig.description === 'global-api' },
            natural_edit: { use_global_default: personalConfig.mode === 'global' || personalConfig.naturalEdit === 'global-api' },
            image_generation: { use_global_default: personalConfig.mode === 'global' || personalConfig.image === 'global-api' },
            editable_pptx_visual: { use_global_default: personalConfig.mode === 'global' || personalConfig.editablePptx === 'global-api' },
            editable_pptx_element: { use_global_default: personalConfig.mode === 'global' || personalConfig.elementGeneration === 'global-api' },
          },
        })
        : await api.updateSettings(payload);

      if (response.data) {
        if (activeScope === 'personal') {
          const nextPersonal = response.data as PersonalSettings;
          setPersonalSettings(nextPersonal);
          if (settings) {
            setFormData(formDataFromSettings({ ...settings, ...nextPersonal }));
          }
          setPersonalDirty(false);
          await reloadEffectiveSettings();
        } else {
          const nextSettings = response.data as SettingsType;
          setSettings(nextSettings);
          sessionStorage.setItem('banana-settings', JSON.stringify(nextSettings));
          await reloadEffectiveSettings();
        }
        show({ message: t('settings.messages.saveSuccess'), type: 'success' });
        show({ message: t('settings.messages.testServiceTip'), type: 'info' });
        // Clear all sensitive fields after save
        setFormData(prev => ({
          ...prev,
          api_key: '', mineru_token: '', baidu_api_key: '', elevenlabs_api_key: '',
          lazyllm_api_keys: {},
          text_api_key: '', image_api_key: '', image_caption_api_key: '',
        }));
      }
    } catch (error: any) {
      console.error('保存设置失败:', error);
      show({
        message: t('settings.messages.saveFailed') + ': ' + (error?.response?.data?.error?.message || error?.message || t('settings.messages.unknownError')),
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    confirm(
      t('settings.messages.resetConfirm'),
      async () => {
        setIsSaving(true);
        try {
          if (activeScope === 'personal') {
            await api.resetPersonalSettings();
            setPersonalSettings(null);
            setPersonalConfig(defaultPersonalConfig);
            setPersonalDirty(false);
            if (settings) {
              setFormData(formDataFromSettings(settings));
            }
            await reloadEffectiveSettings();
            show({ message: '个人配置已清空，将使用全局默认配置', type: 'success' });
            return;
          }
          const response = await api.resetSettings();
          if (response.data) {
            setSettings(response.data);
            setFormData(formDataFromSettings(response.data));
            await reloadEffectiveSettings();
            show({ message: t('settings.messages.resetSuccess'), type: 'success' });
          }
        } catch (error: any) {
          console.error('重置设置失败:', error);
          show({
            message: t('settings.messages.resetFailed') + ': ' + (error?.message || t('settings.messages.unknownError')),
            type: 'error'
          });
        } finally {
          setIsSaving(false);
        }
      },
      {
        title: t('settings.messages.resetTitle'),
        confirmText: t('settings.messages.resetConfirmBtn'),
        cancelText: t('settings.messages.resetCancelBtn'),
        variant: 'warning',
      }
    );
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (activeScope === 'personal') {
      setPersonalDirty(true);
    }
  };

  const updateServiceTest = (key: string, nextState: ServiceTestState) => {
    setServiceTestStates(prev => ({ ...prev, [key]: nextState }));
  };

  const handleServiceTest = async (
    key: string,
    action: (settings?: any) => Promise<any>,
    formatDetail: (data: any) => string
  ) => {
    updateServiceTest(key, { status: 'loading' });
    try {
      // 准备测试时要使用的设置（包括未保存的修改）
      const testSettings: any = {};

      // 只传递用户已填写的非空值
      if (formData.api_key) testSettings.api_key = formData.api_key;
      if (formData.api_base_url) testSettings.api_base_url = formData.api_base_url;
      if (formData.ai_provider_format) {
        testSettings.ai_provider_format = formData.ai_provider_format;
      }
      if (formData.text_model) testSettings.text_model = formData.text_model;
      if (formData.image_model) testSettings.image_model = formData.image_model;
      if (formData.image_caption_model) testSettings.image_caption_model = formData.image_caption_model;
      if (formData.mineru_api_base) testSettings.mineru_api_base = formData.mineru_api_base;
      if (formData.mineru_token) testSettings.mineru_token = formData.mineru_token;
      if (formData.baidu_api_key) testSettings.baidu_api_key = formData.baidu_api_key;
      if (formData.image_resolution) testSettings.image_resolution = formData.image_resolution;

      // Per-model provider source overrides (always send, even empty, to clear saved values)
      testSettings.text_model_source = formData.text_model_source || '';
      testSettings.image_model_source = formData.image_model_source || '';
      testSettings.image_caption_model_source = formData.image_caption_model_source || '';

      // Per-model API credentials
      if (formData.text_api_key) testSettings.text_api_key = formData.text_api_key;
      if (formData.text_api_base_url) testSettings.text_api_base_url = formData.text_api_base_url;
      if (formData.image_api_key) testSettings.image_api_key = formData.image_api_key;
      if (formData.image_api_base_url) testSettings.image_api_base_url = formData.image_api_base_url;
      if (formData.image_caption_api_key) testSettings.image_caption_api_key = formData.image_caption_api_key;
      if (formData.image_caption_api_base_url) testSettings.image_caption_api_base_url = formData.image_caption_api_base_url;

      // 推理模式设置
      if (formData.enable_text_reasoning !== undefined) {
        testSettings.enable_text_reasoning = formData.enable_text_reasoning;
      }
      if (formData.text_thinking_budget !== undefined) {
        testSettings.text_thinking_budget = formData.text_thinking_budget;
      }
      if (formData.enable_image_reasoning !== undefined) {
        testSettings.enable_image_reasoning = formData.enable_image_reasoning;
      }
      if (formData.image_thinking_budget !== undefined) {
        testSettings.image_thinking_budget = formData.image_thinking_budget;
      }

      // 启动异步测试，获取任务ID
      const response = await action(testSettings);
      const taskId = response.data.task_id;

      // isActive tracks whether this test round is still pending — avoids stale closure
      let isActive = true;
      // eslint-disable-next-line prefer-const
      let pollInterval: ReturnType<typeof setInterval>;
      const finish = (nextState: ServiceTestState, toastMsg: string, toastType: 'success' | 'error') => {
        if (!isActive) return;
        isActive = false;
        clearInterval(pollInterval);
        updateServiceTest(key, nextState);
        show({ message: toastMsg, type: toastType });
      };

      // 开始轮询任务状态
      pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.getTestStatus(taskId);
          const statusData = statusResponse?.data;
          if (!statusData) {
            throw new Error(t('settings.serviceTest.testFailed'));
          }
          const taskStatus = statusData.status;

          if (taskStatus === 'COMPLETED') {
            const detail = formatDetail(statusData.result || {});
            const message = statusData.message || t('settings.messages.testSuccess');
            finish({ status: 'success', message, detail }, message, 'success');
          } else if (taskStatus === 'FAILED') {
            const errorMessage = statusData.error || t('settings.serviceTest.testFailed');
            if (statusData.openai_oauth_disconnected) {
              markOpenAIOAuthDisconnected();
            }
            finish({ status: 'error', message: errorMessage }, `${t('settings.serviceTest.testFailed')}: ${errorMessage}`, 'error');
          }
          // 如果是 PENDING 或 PROCESSING，继续轮询
        } catch (pollError: any) {
          const errorMessage = pollError?.response?.data?.error?.message || pollError?.message || t('settings.serviceTest.testFailed');
          finish({ status: 'error', message: errorMessage }, `${t('settings.serviceTest.testFailed')}: ${errorMessage}`, 'error');
        }
      }, 2000); // 每2秒轮询一次

      // 设置最大轮询时间（2分钟）
      setTimeout(() => {
        finish({ status: 'error', message: t('settings.serviceTest.testTimeout') }, t('settings.serviceTest.testTimeout'), 'error');
      }, 600000); // 10 分钟，覆盖 gpt-image-2 等慢模型的生成时间

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || t('common.unknownError');
      updateServiceTest(key, { status: 'error', message: errorMessage });
      show({ message: `${t('settings.serviceTest.testFailed')}: ${errorMessage}`, type: 'error' });
    }
  };

  const displaySettings = settings
    ? ({
      ...settings,
      ...(activeScope === 'personal' && personalSettings ? personalSettings : {}),
      openai_oauth_connected: effectiveSettings?.account_status.openai_oauth_connected ?? settings.openai_oauth_connected,
      openai_oauth_account_id: effectiveSettings?.account_status.openai_oauth_account_id ?? settings.openai_oauth_account_id,
    } as SettingsType)
    : null;
  const accountConnected = Boolean(displaySettings?.openai_oauth_connected);
  const accountId = displaySettings?.openai_oauth_account_id || '';

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key] as string | number | boolean;

    if (field.type === 'buttons' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary mb-2">
            {field.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFieldChange(field.key, option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  value === option.value
                    ? option.value === 'openai'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                      : option.value === 'lazyllm'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                    : 'bg-white dark:bg-background-secondary border border-gray-200 dark:border-border-primary text-gray-700 dark:text-foreground-secondary hover:bg-gray-50 dark:hover:bg-background-hover hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {field.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-foreground-tertiary">{field.description}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary mb-2">
            {field.label}
          </label>
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
          >
            {!(value as string) && (
              <option value="" disabled>
                {field.placeholder || t('settings.fields.selectPlaceholder')}
              </option>
            )}
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{field.description}</p>
          )}
        </div>
      );
    }

    // switch 类型 - 开关切换
    if (field.type === 'switch') {
      const isEnabled = Boolean(value);
      return (
        <div key={field.key}>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary">
              {field.label}
            </label>
            <button
              type="button"
              onClick={() => handleFieldChange(field.key, !isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-banana-500 focus:ring-offset-2 ${
                isEnabled ? 'bg-banana-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-background-secondary transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {field.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{field.description}</p>
          )}
        </div>
      );
    }

    // text, password, number 类型
    const placeholder = field.sensitiveField && displaySettings && field.lengthKey && (displaySettings[field.lengthKey] as number) > 0
      ? t('settings.fields.apiKeySet', { length: displaySettings[field.lengthKey] as string | number })
      : field.placeholder || '';

    // 判断是否禁用（思考负载字段在对应开关关闭时禁用）
    let isDisabled = false;
    if (field.key === 'text_thinking_budget') {
      isDisabled = !formData.enable_text_reasoning;
    } else if (field.key === 'image_thinking_budget') {
      isDisabled = !formData.enable_image_reasoning;
    }

    return (
      <div key={field.key} className={isDisabled ? 'opacity-50' : ''}>
        <Input
          label={field.label}
          type={field.type === 'number' ? 'number' : field.type}
          placeholder={placeholder}
          value={value as string | number}
          onChange={(e) => {
            const newValue = field.type === 'number' 
              ? parseInt(e.target.value) || (field.min ?? 0)
              : e.target.value;
            handleFieldChange(field.key, newValue);
          }}
          min={field.min}
          max={field.max}
          disabled={isDisabled}
        />
        {(field.description || field.link) && (
          <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">
            {field.description}
            {field.link && (
              <a href={field.link} target="_blank" rel="noopener noreferrer" className="text-banana-500 hover:underline">{t('settings.fields.applyLink')}</a>
            )}
          </p>
        )}
      </div>
    );
  };

  // 模型配置项定义：每种模型类型的 key、source key、api key/base key、标签等
  const modelConfigItems = [
    {
      modelKey: 'text_model' as keyof typeof initialFormData,
      sourceKey: 'text_model_source' as keyof typeof initialFormData,
      apiKeyKey: 'text_api_key' as keyof typeof initialFormData,
      apiBaseKey: 'text_api_base_url' as keyof typeof initialFormData,
      apiKeyLengthKey: 'text_api_key_length' as keyof SettingsType,
      label: t('settings.fields.textModel'),
      placeholder: t('settings.fields.textModelPlaceholder'),
      description: t('settings.fields.textModelDesc'),
      sourceLabel: t('settings.fields.textModelSource'),
    },
    {
      modelKey: 'image_model' as keyof typeof initialFormData,
      sourceKey: 'image_model_source' as keyof typeof initialFormData,
      apiKeyKey: 'image_api_key' as keyof typeof initialFormData,
      apiBaseKey: 'image_api_base_url' as keyof typeof initialFormData,
      apiKeyLengthKey: 'image_api_key_length' as keyof SettingsType,
      label: t('settings.fields.imageModel'),
      placeholder: t('settings.fields.imageModelPlaceholder'),
      description: t('settings.fields.imageModelDesc'),
      sourceLabel: t('settings.fields.imageModelSource'),
    },
    {
      modelKey: 'image_caption_model' as keyof typeof initialFormData,
      sourceKey: 'image_caption_model_source' as keyof typeof initialFormData,
      apiKeyKey: 'image_caption_api_key' as keyof typeof initialFormData,
      apiBaseKey: 'image_caption_api_base_url' as keyof typeof initialFormData,
      apiKeyLengthKey: 'image_caption_api_key_length' as keyof SettingsType,
      label: t('settings.fields.imageCaptionModel'),
      placeholder: t('settings.fields.imageCaptionModelPlaceholder'),
      description: t('settings.fields.imageCaptionModelDesc'),
      sourceLabel: t('settings.fields.imageCaptionModelSource'),
    },
  ];

  // 渲染单个模型配置组（模型名 + 提供商选择 + 条件凭证）
  const renderModelConfigGroup = (item: typeof modelConfigItems[0]) => {
    const sourceValue = formData[item.sourceKey] as string;
    const isApiKeyProvider = API_KEY_PROVIDERS.has(sourceValue);
    const isLazyllm = sourceValue && isLazyllmVendor(sourceValue);
    // 'openai' in source dropdown means OpenAI format (API key provider), not lazyllm openai vendor
    // lazyllm openai vendor is handled separately

    return (
      <div key={item.modelKey} className="pb-6 border-b border-gray-200 dark:border-border-primary last:border-b-0 last:pb-0 space-y-3">
        {/* 模型名称 */}
        <Input
          label={item.label}
          type="text"
          placeholder={item.placeholder}
          value={formData[item.modelKey] as string}
          onChange={(e) => handleFieldChange(item.modelKey, e.target.value)}
        />
        {item.description && (
          <p className="-mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{item.description}</p>
        )}

        {/* 提供商选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary mb-2">
            {item.sourceLabel}
          </label>
          <select
            value={sourceValue}
            onChange={(e) => handleFieldChange(item.sourceKey, e.target.value)}
            className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
          >
            <option value="">{t('settings.fields.modelProviderPlaceholder')}</option>
            {ALL_PROVIDER_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}{option.value === 'codex' && !accountConnected ? '（需连接账号）' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">
            {t('settings.fields.modelProviderDesc')}
          </p>
          {sourceValue === 'codex' && !accountConnected && (
            <p className="mt-1 text-sm font-medium text-amber-700">
              已选择 Codex。执行前需要在“服务连接”中连接 OpenAI/ChatGPT 账号。
            </p>
          )}
        </div>

        {/* Gemini/OpenAI 提供商：显示 API Base URL + API Key */}
        {isApiKeyProvider && (
          <div className="space-y-3 pl-3 border-l-2 border-banana-300 dark:border-banana-600">
            <Input
              label={t('settings.fields.perModelApiBaseUrl')}
              type="text"
              placeholder={t('settings.fields.perModelApiBaseUrlPlaceholder')}
              value={formData[item.apiBaseKey] as string}
              onChange={(e) => handleFieldChange(item.apiBaseKey, e.target.value)}
            />
            <div>
              <Input
                label={t('settings.fields.perModelApiKey')}
                type="password"
                placeholder={
                  displaySettings && (displaySettings[item.apiKeyLengthKey] as number) > 0
                    ? t('settings.fields.perModelApiKeySet', { length: displaySettings[item.apiKeyLengthKey] as number })
                    : t('settings.fields.perModelApiKeyPlaceholder')
                }
                value={formData[item.apiKeyKey] as string}
                onChange={(e) => handleFieldChange(item.apiKeyKey, e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">
                {t('settings.fields.perModelApiKeyDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Image API Protocol: for image model when effective provider is openai */}
        {item.sourceKey === 'image_model_source' && (sourceValue === 'openai' || (!sourceValue && formData.ai_provider_format === 'openai')) && (
          <div className="pl-3 border-l-2 border-banana-300 dark:border-banana-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary mb-2">
              {t('settings.fields.imageApiProtocol')}
            </label>
            <select
              value={formData.openai_image_api_protocol}
              onChange={(e) => handleFieldChange('openai_image_api_protocol', e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
            >
              <option value="auto">{t('settings.fields.imageApiProtocolAuto')}</option>
              <option value="images">{t('settings.fields.imageApiProtocolImages')}</option>
              <option value="chat">{t('settings.fields.imageApiProtocolChat')}</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">
              {t('settings.fields.imageApiProtocolDesc')}
            </p>
          </div>
        )}

        {/* LazyLLM 厂商：显示厂商 API Key */}
        {isLazyllm && (() => {
          const vendorLabel = LAZYLLM_SOURCES.find(s => s.value === sourceValue)?.label || sourceValue.toUpperCase();
          const keyLength = displaySettings?.lazyllm_api_keys_info?.[sourceValue] || 0;
          const placeholder = keyLength > 0
            ? t('settings.fields.vendorApiKeySet', { length: keyLength })
            : t('settings.fields.vendorApiKeyPlaceholder', { vendor: vendorLabel });
          return (
            <div className="pl-3 border-l-2 border-amber-300 dark:border-amber-600">
              <Input
                label={t('settings.fields.vendorApiKey', { vendor: vendorLabel })}
                type="password"
                placeholder={placeholder}
                value={formData.lazyllm_api_keys[sourceValue] || ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    lazyllm_api_keys: { ...prev.lazyllm_api_keys, [sourceValue]: e.target.value }
                  }));
                  if (activeScope === 'personal') {
                    setPersonalDirty(true);
                  }
                }}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">
                {t('settings.fields.vendorApiKeyDesc')}
              </p>
            </div>
          );
        })()}
      </div>
    );
  };

  const providerLabel = ALL_PROVIDER_SOURCES.find((source) => source.value === formData.ai_provider_format)?.label || formData.ai_provider_format;
  const configuredSecrets = [
    displaySettings?.api_key_length,
    displaySettings?.text_api_key_length,
    displaySettings?.image_api_key_length,
    displaySettings?.image_caption_api_key_length,
    displaySettings?.mineru_token_length,
    displaySettings?.baidu_api_key_length,
    displaySettings?.elevenlabs_api_key_length,
  ].filter((length) => Number(length) > 0).length;
  const effectiveCapabilityList = effectiveSettings
    ? Object.values(effectiveSettings.capabilities)
    : [];
  const formatProjectOverrideValue = (value: unknown) => {
    if (typeof value === 'boolean') return value ? '开启' : '关闭';
    if (value === null || value === undefined || value === '') return '未设置';
    return String(value);
  };
  const projectOverrideCount = projectOverrideProjects.reduce((count, project) => (
    count + Object.keys(project.project_overrides?.fields || {}).length
  ), 0);
  const configNavItems = [
    { href: '#settings-api', label: '基础配置', description: '默认 Provider、Base URL、密钥' },
    { href: '#settings-models', label: 'AI 模型', description: '文本、图片、视觉理解模型' },
    { href: '#settings-generation', label: '生成策略', description: '清晰度、语言、生成并发' },
    { href: '#settings-parsing', label: '文件解析', description: 'MinerU、OCR 与解析依赖' },
    { href: '#settings-service', label: '服务连接', description: 'OpenAI OAuth、语音合成' },
    { href: '#settings-advanced', label: '兼容高级', description: '推理模式与兼容 Provider' },
    { href: '#settings-tests', label: '服务测试', description: '主动验证服务可用性' },
    { href: '#settings-overrides', label: '项目覆盖', description: '项目级覆盖来源说明' },
  ];
  const sectionByTitle = (title: string) => settingsSections.find((section) => section.title === title);
  const generationSections = [
    sectionByTitle(t('settings.sections.imageConfig')),
    sectionByTitle(t('settings.sections.outputLanguage')),
    sectionByTitle(t('settings.sections.performanceConfig')),
  ].filter(Boolean) as SectionConfig[];
  const parsingSections = [
    sectionByTitle(t('settings.sections.mineruConfig')),
    sectionByTitle(t('settings.sections.baiduOcr')),
  ].filter(Boolean) as SectionConfig[];
  const serviceSections = [
    sectionByTitle(t('settings.sections.elevenlabs')),
  ].filter(Boolean) as SectionConfig[];
  const advancedSections = [
    sectionByTitle(t('settings.sections.textReasoning')),
    sectionByTitle(t('settings.sections.imageReasoning')),
  ].filter(Boolean) as SectionConfig[];

  const runTextModelTest = () =>
    handleServiceTest(
      'text-model',
      api.testTextModel,
      (data: any) => (data?.reply ? t('settings.serviceTest.results.modelReply', { reply: data.reply }) : '')
    );

  const runImageModelTest = () =>
    handleServiceTest(
      'image-model',
      api.testImageModel,
      (data: any) => (data?.image_size ? t('settings.serviceTest.results.imageSize', { width: data.image_size[0], height: data.image_size[1] }) : '')
    );

  const runCaptionModelTest = () =>
    handleServiceTest(
      'caption-model',
      api.testCaptionModel,
      (data: any) => (data?.caption ? t('settings.serviceTest.results.captionDesc', { caption: data.caption }) : '')
    );

  const SectionCard: React.FC<{
    id?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, description, action, children }) => (
    <section id={id} className="rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );

  const ActionSelect: React.FC<{
    value: PersonalCapabilityMode;
    onChange: (value: PersonalCapabilityMode) => void;
    allowed: PersonalCapabilityMode[];
  }> = ({ value, onChange, allowed }) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as PersonalCapabilityMode)}
      className="h-11 w-full rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
    >
      {allowed.map((mode) => (
        <option key={mode} value={mode}>{personalModeLabels[mode]}</option>
      ))}
    </select>
  );

  const CapabilityActionCard: React.FC<{
    title: string;
    subtitle: string;
    badge: string;
    badgeTone: 'blue' | 'green';
    value: PersonalCapabilityMode;
    onChange: (value: PersonalCapabilityMode) => void;
    allowed: PersonalCapabilityMode[];
    source: string;
    fallback?: string;
    onTest?: () => void;
    secondaryAction?: React.ReactNode;
  }> = ({ title, subtitle, badge, badgeTone, value, onChange, allowed, source, fallback, onTest, secondaryAction }) => (
    <div className="rounded-md border border-amber-200 bg-gradient-to-b from-white to-amber-50/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {badge}
        </span>
      </div>
      <ActionSelect value={value} onChange={onChange} allowed={allowed} />
      <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
        <div>来源：<span className="font-semibold text-gray-900">{source}</span></div>
        {fallback && <div>回退：<span className="font-semibold text-gray-900">{fallback}</span></div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {onTest && (
          <button
            type="button"
            onClick={onTest}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-700"
          >
            测试
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange('global-api')}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-700"
        >
          继承全局
        </button>
        {secondaryAction}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading message={t('common.loading')} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={settingsToasts} onRemove={settingsRemove} />
      {ConfirmDialog}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">全局配置中心</h1>
            <p className="mt-1 text-sm text-gray-500">管理全局默认与当前用户个人配置。</p>
          </div>
          <div className="inline-flex w-full rounded-md border border-gray-200 bg-gray-100 p-1 lg:w-auto">
            {[
              { value: 'global' as SettingsScope, label: '全局默认配置' },
              { value: 'personal' as SettingsScope, label: '个人配置' },
            ].map((scope) => (
              <button
                key={scope.value}
                type="button"
                onClick={() => setActiveScope(scope.value)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors lg:flex-none ${
                  activeScope === scope.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        {activeScope === 'personal' ? (
          <>
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-semibold text-amber-700">当前生效</div>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {personalConfig.mode === 'global' ? '强制使用全局默认' : '个人配置优先'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {personalConfig.mode === 'global' ? '所有能力回退到组织默认配置。' : '大纲、描述和自然语言修改优先使用个人账号。'}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={forceUseGlobalDefault} icon={<RotateCcw size={16} />}>
                    强制使用全局默认
                  </Button>
                </div>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500">账号连接</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {accountConnected ? '已连接' : '未连接'}
                </div>
                <div className="mt-1 text-xs text-gray-500">{accountId || '可连接 ChatGPT/OpenAI 账号'}</div>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500">回退配置</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{providerLabel || 'OpenAI / ChatGPT'}</div>
                <div className="mt-1 text-xs text-gray-500">个人配置异常时可继续生成</div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="hidden xl:block">
                <div className="sticky top-24 rounded-md border border-gray-200 bg-white p-3">
                  <div className="px-2 pb-2 text-xs font-semibold text-gray-500">个人配置</div>
                  <nav className="space-y-1">
                    {[
                      ['#personal-api', '基础配置', '总策略、Provider、回退'],
                      ['#personal-models', 'AI 模型', '文本、图片、PPTX 工作流'],
                      ['#personal-generation', '生成策略', '语言、清晰度、并发'],
                      ['#personal-parsing', '文件解析', '解析与 OCR 依赖'],
                      ['#personal-service', '服务连接', '账号、密钥、订阅'],
                      ['#personal-advanced', '兼容高级', '推理与兼容项'],
                      ['#settings-tests', '服务测试', '主动验证'],
                      ['#personal-fallback', '覆盖链路', '当前生效来源'],
                    ].map(([href, label, description]) => (
                      <a key={href} href={href} className="block rounded-md px-2 py-2 transition-colors hover:bg-amber-50 hover:text-amber-700">
                        <span className="block text-sm font-semibold text-gray-700">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-gray-500">{description}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              <div className="space-y-5">
                <SectionCard
                  id="personal-api"
                  title="基础配置"
                  description="当前用户自己的默认策略；未配置或强制回退时使用全局默认。"
                  action={<Button variant="secondary" size="sm" onClick={forceUseGlobalDefault} icon={<RotateCcw size={16} />}>强制使用全局默认</Button>}
                >
                  <div className="space-y-3">
                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">个人配置总策略</div>
                        <div className="text-xs text-gray-500">控制当前用户是否启用个人覆盖</div>
                      </div>
                      <select
                        value={personalConfig.mode}
                        onChange={(event) => updatePersonalConfig('mode', event.target.value as PersonalPreferenceMode)}
                        className="h-11 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      >
                        <option value="auto">自动使用个人配置，失败时回退全局</option>
                        <option value="global">强制使用全局默认</option>
                      </select>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-center text-xs font-semibold text-amber-700">
                        个人配置
                      </span>
                    </div>

                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">默认 Provider</div>
                        <div className="text-xs text-gray-500">个人配置未覆盖时继承全局</div>
                      </div>
                      <div className="flex min-h-11 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                        <span>{providerLabel || 'OpenAI / ChatGPT'}</span>
                        <span className="text-xs text-gray-500">继承全局</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setActiveScope('global')}>
                        编辑全局
                      </Button>
                    </div>

                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">个人 API Key</div>
                        <div className="text-xs text-gray-500">当前用户的自动化执行凭据</div>
                      </div>
                      <div className="flex min-h-11 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                        <span>继承全局 API</span>
                        <span className="text-xs text-gray-500">可配置个人密钥</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => document.getElementById('personal-models')?.scrollIntoView({ behavior: 'smooth' })}>
                        重新填写
                      </Button>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-models"
                  title="AI 模型"
                  description="与全局默认配置保持同样的模型字段；保存后写入当前用户个人配置。"
                  action={<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">个人配置优先</span>}
                >
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">来源：用户个人配置</span>
                    <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">未填写则继承全局默认</span>
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">Codex 可选，执行前需连接账号</span>
                  </div>
                  <div className="space-y-4">
                    {modelConfigItems.map(renderModelConfigGroup)}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={runTextModelTest}>
                      测试文本模型
                    </Button>
                    <Button variant="secondary" size="sm" onClick={runImageModelTest}>
                      测试图片模型
                    </Button>
                    <Button variant="secondary" size="sm" onClick={runCaptionModelTest}>
                      测试图片识别
                    </Button>
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-generation"
                  title="生成策略"
                  description="个人配置页与全局配置页保持同构；暂未纳入个人 schema 的字段会继续继承全局。"
                  action={<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">个人覆盖待接入</span>}
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    {generationSections.map((section) => (
                      <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          {section.icon}
                          {section.title}
                        </h3>
                        <div className="space-y-4">
                          {section.fields.map((field) => renderField(field))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-parsing"
                  title="文件解析"
                  description="展示与全局配置一致的解析字段；未纳入个人 schema 的解析项默认继承全局。"
                  action={<span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">默认继承全局</span>}
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    {parsingSections.map((section) => (
                      <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          {section.icon}
                          {section.title}
                        </h3>
                        <div className="space-y-4">
                          {section.fields.map((field) => renderField(field))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-service"
                  title="服务连接"
                  description="当前用户的账号、订阅、密钥与连接状态。"
                  action={<Button variant="secondary" size="sm" onClick={forceUseGlobalDefault} icon={<RotateCcw size={16} />}>强制使用全局默认</Button>}
                >
                  <div className="space-y-3">
                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">个人配置总策略</div>
                        <div className="text-xs text-gray-500">控制当前用户是否启用个人覆盖</div>
                      </div>
                      <select
                        value={personalConfig.mode}
                        onChange={(event) => updatePersonalConfig('mode', event.target.value as PersonalPreferenceMode)}
                        className="h-11 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      >
                        <option value="auto">自动使用个人配置，失败时回退全局</option>
                        <option value="global">强制使用全局默认</option>
                      </select>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-center text-xs font-semibold text-amber-700">
                        保存后生效
                      </span>
                    </div>

                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">账号连接</div>
                        <div className="text-xs text-gray-500">大纲、描述、自然语言修改</div>
                      </div>
                      <div className="flex min-h-11 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                        <span>{accountConnected ? 'ChatGPT / OpenAI 已连接' : '未连接账号'}</span>
                        <span className="text-xs text-gray-500">{accountId || '可连接'}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={accountConnected ? handleOAuthDisconnect : handleOAuthLogin}
                        loading={oauthConnecting}
                      >
                        {accountConnected ? '断开' : '连接'}
                      </Button>
                    </div>

                    <div className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">个人 API Key</div>
                        <div className="text-xs text-gray-500">当前用户自己的自动化执行凭据</div>
                      </div>
                      <div className="flex min-h-11 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                        <span>{displaySettings?.api_key_length ? `已配置（长度 ${displaySettings.api_key_length}）` : '沿用全局 API'}</span>
                        <span className="text-xs text-gray-500">保存后生效</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => document.getElementById('personal-models')?.scrollIntoView({ behavior: 'smooth' })}>
                        重新填写
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:flex-row sm:items-center sm:justify-between">
                      <span><strong>能力接入方式说明</strong>：订阅适合大纲、描述、自然语言修改；PPTX 工作流使用 API / 企业代理。</span>
                      <button type="button" className="self-start rounded-md border border-blue-200 bg-white px-2 py-1 font-semibold sm:self-auto">
                        查看详情
                      </button>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-advanced"
                  title="兼容高级"
                  description="与全局配置保持同构，低频兼容项默认继承全局。"
                  action={<Button variant="secondary" size="sm" onClick={() => setAdvancedOpen(!advancedOpen)}>
                    {advancedOpen ? '收起' : '展开'}
                  </Button>}
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    {advancedSections.map((section) => (
                      <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          {section.icon}
                          {section.title}
                        </h3>
                        <div className="space-y-4">
                          {section.fields.map((field) => renderField(field))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  id="personal-fallback"
                  title="覆盖链路"
                  description="个人配置与全局配置同构展示，最终生效值按统一 resolver 计算。"
                  action={<Button variant="secondary" size="sm" onClick={() => setActiveScope('global')}>切到全局默认配置</Button>}
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">默认 Provider</div>
                      <div className="mt-2 text-base font-semibold text-gray-900">{providerLabel}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">图片模型</div>
                      <div className="mt-2 text-base font-semibold text-gray-900">{formData.image_model || 'gpt-image-2'}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">敏感密钥</div>
                      <div className="mt-2 text-base font-semibold text-gray-900">{configuredSecrets} 项已配置</div>
                    </div>
                  </div>
                  {effectiveCapabilityList.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.1fr] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                        <span>能力</span>
                        <span>执行方式</span>
                        <span>状态</span>
                        <span>原因</span>
                      </div>
                      {effectiveCapabilityList.map((capability) => (
                        <div key={capability.key} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.1fr] gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0">
                          <span className="font-semibold text-gray-800">{capability.label}</span>
                          <span className="text-gray-600">
                            {capability.execution_mode === 'account_subscription' ? '账号/订阅' : capability.api_required ? 'API 必需' : 'API / 账号'}
                          </span>
                          <span className={capability.ready ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600'}>
                            {capability.ready ? '可用' : '需配置'}
                          </span>
                          <span className="text-xs leading-5 text-gray-500">{capability.reason || (capability.use_global_default ? '继承全局默认' : '个人配置生效')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {personalDirty && (
                  <div className="sticky bottom-0 z-10 flex items-center justify-between rounded-md border border-gray-200 bg-gray-900 p-3 text-white shadow-lg">
                    <div>
                      <div className="text-sm font-semibold">个人配置有未保存修改</div>
                      <div className="text-xs text-gray-300">保存后会写入当前用户配置，并刷新生效配置链路。</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (settings) {
                          setFormData(formDataFromSettings(personalSettings ? { ...settings, ...personalSettings } : settings));
                        }
                        setPersonalConfig(prev => ({ ...prev, mode: personalSettings?.force_global_default ? 'global' : 'auto' }));
                        setPersonalDirty(false);
                      }}>
                        放弃
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleSave} loading={isSaving}>
                        保存个人配置
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-semibold text-amber-700">推荐主线</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">OpenAI / ChatGPT</div>
            <div className="mt-1 text-sm leading-6 text-gray-600">文本、视觉理解、图片生成和可编辑 PPTX 图层生成优先走 OpenAI 主线，其他 Provider 作为兼容和专项能力。</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">当前默认 Provider</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{providerLabel}</div>
            <div className="mt-1 text-xs text-gray-500">全局默认，可被模型级/项目级显式覆盖</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">敏感密钥</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{configuredSecrets} 项已配置</div>
            <div className="mt-1 text-xs text-gray-500">只显示状态和长度，不明文回显</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-md border border-gray-200 bg-white p-3">
              <div className="px-2 pb-2 text-xs font-semibold text-gray-500">配置目录</div>
              <nav className="space-y-1">
                {configNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-2 py-2 transition-colors hover:bg-amber-50 hover:text-amber-700"
                  >
                    <span className="block text-sm font-semibold text-gray-700">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-gray-500">{item.description}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-5">
        {/* 默认 API 配置区块 */}
        <div id="settings-api" data-testid="global-api-config-section" className="rounded-md border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground-primary mb-1 flex items-center">
            <Key size={20} />
            <span className="ml-2">{t('settings.sections.apiConfig')}</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-foreground-tertiary mb-4">{t('settings.sections.apiConfigDesc')}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">来源：全局配置</span>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">OpenAI / ChatGPT 推荐主线</span>
            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">兼容 Provider 可作为高级选项</span>
          </div>
          <div className="space-y-3">
            {/* 提供商下拉 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground-secondary mb-2">
                {t('settings.fields.aiProviderFormat')}
              </label>
              <select
                value={formData.ai_provider_format}
                onChange={(e) => handleFieldChange('ai_provider_format', e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
              >
                {ALL_PROVIDER_SOURCES.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}{option.value === 'codex' && !accountConnected ? '（需连接账号）' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{t('settings.fields.aiProviderFormatDesc')}</p>
              {formData.ai_provider_format === 'codex' && !accountConnected && (
                <p className="mt-1 text-sm font-medium text-amber-700">
                  已选择 Codex。执行前需要先在“服务连接”中连接 OpenAI/ChatGPT 账号。
                </p>
              )}
            </div>

            {/* Gemini/OpenAI: API Base URL + API Key */}
            {API_KEY_PROVIDERS.has(formData.ai_provider_format) && (
              <div className="space-y-3 pl-3 border-l-2 border-banana-300 dark:border-banana-600">
                <Input
                  label={t('settings.fields.apiBaseUrl')}
                  type="text"
                  placeholder={t('settings.fields.apiBaseUrlPlaceholder')}
                  value={formData.api_base_url}
                  onChange={(e) => handleFieldChange('api_base_url', e.target.value)}
                />
                <p className="-mt-2 text-sm text-gray-500 dark:text-foreground-tertiary">{t('settings.fields.apiBaseUrlDesc')}</p>
                <div>
                  <Input
                    label={t('settings.fields.apiKey')}
                    type="password"
                    placeholder={
                      displaySettings && (displaySettings.api_key_length as number) > 0
                        ? t('settings.fields.apiKeySet', { length: displaySettings.api_key_length })
                        : t('settings.fields.apiKeyPlaceholder')
                    }
                    value={formData.api_key}
                    onChange={(e) => handleFieldChange('api_key', e.target.value)}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-foreground-tertiary">{t('settings.fields.apiKeyDesc')}</p>
                </div>
              </div>
            )}

            {/* LazyLLM 厂商: 厂商 API Key */}
            {isLazyllmVendor(formData.ai_provider_format) && (
              <GlobalVendorKeyInput vendor={formData.ai_provider_format} formData={formData} setFormData={setFormData} settings={displaySettings} t={t} />
            )}
          </div>

          {/* AIHubmix 提示 */}
          <div className="mt-3 pl-4 border-l-4 border-blue-300 dark:border-blue-600">
            <p className="text-sm text-gray-700 dark:text-foreground-secondary">
              {t('settings.apiKeyTip.before')}
              <a href={['https://', 'aihubmix', '.com/?', 'aff=17EC'].join('')} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">AIHubmix 申请 API key</a>
            </p>
          </div>

          {/* API Key 获取指南 */}
          <div className="mt-2 pl-4 border-l-4 border-blue-300 dark:border-blue-600">
            <p className="text-sm font-medium text-gray-800 dark:text-foreground-primary flex items-center gap-1.5 mb-2">
              <HelpCircle size={15} className="text-blue-500" />
              {t('settings.apiKeyHelp.title')}
            </p>
            <ol className="text-sm text-gray-700 dark:text-foreground-secondary space-y-1 list-decimal list-inside ml-1">
              <li>
                {t('settings.apiKeyHelp.step1', { link: '{{link}}' }).split('{{link}}')[0]}
                <span className="inline-flex items-center gap-2">
                  <a
                    href={['https://', 'aihubmix', '.com/?', 'aff=17EC'].join('')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    点击此处访问 AIHubmix →
                  </a>
                  <button
                    onClick={() => copyToClipboard('https://aihubmix.com/?aff=17EC')}
                    className="text-xs px-2 py-0.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  >
                    复制链接
                  </button>
                </span>
                {t('settings.apiKeyHelp.step1', { link: '{{link}}' }).split('{{link}}')[1]}
              </li>
              <li>{t('settings.apiKeyHelp.step2')}</li>
              <li>{t('settings.apiKeyHelp.step3')}</li>
              <li>{t('settings.apiKeyHelp.step4')}</li>
            </ol>
          </div>
        </div>

        {/* 模型配置区块 */}
        <div id="settings-models" className="rounded-md border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground-primary mb-4 flex items-center">
            <FileText size={20} />
            <span className="ml-2">{t('settings.sections.modelConfig')}</span>
          </h2>
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            AI 模型分为文本生成、图片生成、图片识别三类；可编辑 PPTX 的视觉结构分析和图层生成应优先走 OpenAI 视觉与 gpt-image-2 主线，Gemini、LazyLLM、百度等作为兼容或专项能力配置。
          </div>
          <div className="space-y-4">
            {modelConfigItems.map(renderModelConfigGroup)}
          </div>
        </div>

        <div id="settings-generation" className="rounded-md border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">生成策略</h2>
            <p className="mt-1 text-sm text-gray-500">控制图片清晰度、输出语言和生成并发，影响生成速度、成本和稳定性。</p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {generationSections.map((section) => (
              <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="settings-parsing" className="rounded-md border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">文件解析</h2>
            <p className="mt-1 text-sm text-gray-500">集中配置参考文件解析、OCR 和可编辑 PPTX 依赖服务。</p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {parsingSections.map((section) => (
              <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="settings-service" className="rounded-md border border-gray-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">服务连接</h2>
            <p className="mt-1 text-sm text-gray-500">连接 OpenAI 账号与语音合成服务。服务测试仍需在下方主动触发。</p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-foreground-primary mb-1 flex items-center">
                <Link2 size={18} />
                <span className="ml-2">{t('settings.openaiOAuth.title')}</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-foreground-tertiary mb-4">{t('settings.openaiOAuth.description')}</p>
              <div className="rounded-md border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${accountConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-foreground-secondary">
                        {accountConnected ? t('settings.openaiOAuth.connected') : t('settings.openaiOAuth.disconnected')}
                      </span>
                      {accountConnected && accountId && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-foreground-tertiary">
                          ({accountId})
                        </span>
                      )}
                    </div>
                  </div>
                  {accountConnected ? (
                    <button
                      onClick={handleOAuthDisconnect}
                      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      {t('settings.openaiOAuth.disconnectBtn')}
                    </button>
                  ) : (
                    <button
                      onClick={handleOAuthLogin}
                      disabled={oauthConnecting}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {oauthConnecting ? t('settings.openaiOAuth.connecting') : t('settings.openaiOAuth.loginBtn')}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-foreground-tertiary">{t('settings.openaiOAuth.hint')}</p>
                {!accountConnected && (
                  <div className="mt-3">
                    <button
                      onClick={() => setManualCallbackOpen(v => !v)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('settings.openaiOAuth.manualCallbackLabel')}
                    </button>
                    {manualCallbackOpen && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">{t('settings.openaiOAuth.manualCallbackHint')}</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualCallbackUrl}
                            onChange={(e) => setManualCallbackUrl(e.target.value)}
                            placeholder={t('settings.openaiOAuth.manualCallbackPlaceholder')}
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-border-primary rounded-md bg-white dark:bg-background-secondary text-gray-900 dark:text-foreground-primary placeholder-gray-400"
                          />
                          <button
                            onClick={handleManualCallback}
                            disabled={manualCallbackSubmitting || !manualCallbackUrl.trim()}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            {t('settings.openaiOAuth.manualCallbackSubmit')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {serviceSections.map((section) => (
              <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="settings-advanced" className="rounded-md border border-gray-200 bg-white p-5">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-0 py-3 text-left hover:opacity-80 transition-opacity"
          >
            <span className="text-lg font-semibold text-gray-900 dark:text-foreground-primary">
              {t('settings.sections.advancedSettings')}
            </span>
            <ChevronDown
              size={20}
              className={`text-gray-500 dark:text-foreground-tertiary transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {advancedOpen && (
            <div className="grid gap-5 pb-4 xl:grid-cols-2">
              {advancedSections.map((section) => (
                <div key={section.title} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                    {section.icon}
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.fields.map((field) => renderField(field))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 服务测试区 */}
        <div id="settings-tests" className="space-y-4 rounded-md border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground-primary mb-2 flex items-center">
            <FileText size={20} />
            <span className="ml-2">{t('settings.serviceTest.title')}</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-foreground-tertiary">
            {t('settings.serviceTest.description')}
          </p>
          <div className="pl-4 border-l-4 border-yellow-300 dark:border-yellow-600">
            <p className="text-sm text-gray-700 dark:text-foreground-secondary">
              💡 {t('settings.serviceTest.tip')}
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                key: 'baidu-ocr',
                titleKey: 'settings.serviceTest.tests.baiduOcr.title',
                descriptionKey: 'settings.serviceTest.tests.baiduOcr.description',
                resultKey: 'settings.serviceTest.results.recognizedText',
                action: api.testBaiduOcr,
                formatDetail: (data: any) => (data?.recognized_text ? t('settings.serviceTest.results.recognizedText', { text: data.recognized_text }) : ''),
              },
              {
                key: 'text-model',
                titleKey: 'settings.serviceTest.tests.textModel.title',
                descriptionKey: 'settings.serviceTest.tests.textModel.description',
                resultKey: 'settings.serviceTest.results.modelReply',
                action: api.testTextModel,
                formatDetail: (data: any) => (data?.reply ? t('settings.serviceTest.results.modelReply', { reply: data.reply }) : ''),
              },
              {
                key: 'caption-model',
                titleKey: 'settings.serviceTest.tests.captionModel.title',
                descriptionKey: 'settings.serviceTest.tests.captionModel.description',
                resultKey: 'settings.serviceTest.results.captionDesc',
                action: api.testCaptionModel,
                formatDetail: (data: any) => (data?.caption ? t('settings.serviceTest.results.captionDesc', { caption: data.caption }) : ''),
              },
              {
                key: 'baidu-inpaint',
                titleKey: 'settings.serviceTest.tests.baiduInpaint.title',
                descriptionKey: 'settings.serviceTest.tests.baiduInpaint.description',
                resultKey: 'settings.serviceTest.results.imageSize',
                action: api.testBaiduInpaint,
                formatDetail: (data: any) => (data?.image_size ? t('settings.serviceTest.results.imageSize', { width: data.image_size[0], height: data.image_size[1] }) : ''),
              },
              {
                key: 'image-model',
                titleKey: 'settings.serviceTest.tests.imageModel.title',
                descriptionKey: 'settings.serviceTest.tests.imageModel.description',
                resultKey: 'settings.serviceTest.results.imageSize',
                action: api.testImageModel,
                formatDetail: (data: any) => (data?.image_size ? t('settings.serviceTest.results.imageSize', { width: data.image_size[0], height: data.image_size[1] }) : ''),
              },
              {
                key: 'mineru-pdf',
                titleKey: 'settings.serviceTest.tests.mineruPdf.title',
                descriptionKey: 'settings.serviceTest.tests.mineruPdf.description',
                resultKey: 'settings.serviceTest.results.parsePreview',
                action: api.testMineruPdf,
                formatDetail: (data: any) => (data?.content_preview ? t('settings.serviceTest.results.parsePreview', { preview: data.content_preview }) : data?.message || ''),
              },
            ].map((item) => {
              const testState = serviceTestStates[item.key] || { status: 'idle' as TestStatus };
              const isLoadingTest = testState.status === 'loading';
              return (
                <div
                  key={item.key}
                  className="py-4 border-b border-gray-200 dark:border-border-primary last:border-b-0 space-y-2"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-base font-semibold text-gray-800 dark:text-foreground-primary">{t(item.titleKey)}</div>
                      <div className="text-sm text-gray-500 dark:text-foreground-tertiary">{t(item.descriptionKey)}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isLoadingTest}
                      onClick={() => handleServiceTest(item.key, item.action, item.formatDetail)}
                    >
                      {isLoadingTest ? t('settings.serviceTest.testing') : t('settings.serviceTest.startTest')}
                    </Button>
                  </div>
                  {testState.status === 'success' && (
                    <p className="text-sm text-green-600">
                      {testState.message}{testState.detail ? `｜${testState.detail}` : ''}
                    </p>
                  )}
                  {testState.status === 'error' && (
                    <p className="text-sm text-red-600">
                      {testState.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div id="settings-overrides" className="rounded-md border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">项目覆盖</h2>
              <p className="text-sm leading-6 text-gray-600">
                全局配置是系统默认行为的唯一入口。项目内仅保留明确覆盖项，例如导出方法、是否允许半成品、视觉结构分析开关和画面比例。
              </p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-right">
              <div className="text-xs font-medium text-amber-700">最近项目覆盖字段</div>
              <div className="mt-1 text-2xl font-semibold text-amber-800">{projectOverrideCount}</div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            当前已能展示项目级覆盖字段和当前值；由于历史项目字段带默认值，暂未区分“继承全局默认”和“项目显式覆盖”。后续需要新增覆盖元数据后再开放恢复全局默认操作。
          </div>

          {projectOverrideProjects.length > 0 ? (
            <div className="mt-4 space-y-3">
              {projectOverrideProjects.map((project) => {
                const fields = Object.entries(project.project_overrides?.fields || {});
                return (
                  <div key={project.project_id} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {project.project_title || project.idea_prompt || '未命名项目'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">项目 ID: {project.project_id}</div>
                      </div>
                      {project.project_overrides?.inheritance_tracking === false && (
                        <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                          未启用继承追踪
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {fields.map(([fieldKey, field]) => (
                        <div key={fieldKey} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">{field.label}</span>
                            <span className="text-[11px] text-gray-400">{field.group === 'export' ? '导出' : '项目'}</span>
                          </div>
                          <div className="mt-1 truncate text-sm font-semibold text-gray-900" title={formatProjectOverrideValue(field.value)}>
                            {formatProjectOverrideValue(field.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              暂无最近项目。创建或打开项目后，这里会展示可覆盖字段摘要。
            </div>
          )}
        </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between rounded-md border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <Button
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={handleReset}
            disabled={isSaving}
          >
            {t('settings.actions.resetToDefault')}
          </Button>
          <Button
            variant="primary"
            icon={<Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
          >
            {isSaving ? t('settings.actions.saving') : t('settings.actions.save')}
          </Button>
        </div>

          </>
        )}

        <SettingsAbout t={t} />
      </div>
    </>
  );
};

// SettingsPage 组件 - 完整页面包装
const SCROLL_SHOW_THRESHOLD = 300;

export const SettingsPage: React.FC = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > SCROLL_SHOW_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Settings />
      {showTop && (
        <button
          data-testid="back-to-top-button"
          aria-label="Back to top"
          title="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-banana-500 text-white shadow-lg hover:bg-banana-600 transition-all z-50"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
};
