import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, FileText, FileEdit, ImagePlus, Paperclip, Palette, Lightbulb, FolderOpen, HelpCircle, ChevronDown, Upload, RefreshCw, Users, Activity, CheckCircle2, Clock, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, useToast, ToastContainer, MaterialGeneratorModal, MaterialCenterModal, MaterialSelector, ReferenceFileList, ReferenceFileSelector, FilePreviewModal, HelpModal, TextStyleSelector } from '@/components/shared';
import { MarkdownTextarea, type MarkdownTextareaRef } from '@/components/shared/MarkdownTextarea';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate, uploadReferenceFile, type ReferenceFile, associateFileToProject, triggerFileParse, associateMaterialsToProject, createPptRenovationProject } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { devLog } from '@/utils/logger';
import { useImagePaste, buildMaterialsMarkdown } from '@/hooks/useImagePaste';
import type { Material } from '@/types';
import { useT } from '@/hooks/useT';
import { ASPECT_RATIO_OPTIONS } from '@/config/aspectRatio';

type CreationType = 'idea' | 'outline' | 'description' | 'ppt_renovation';

// 支持作为参考文件上传的文档扩展名（与后端 file_parser_service 保持一致）
const ALLOWED_DOC_EXTENSIONS = ['pdf', 'docx', 'pptx', 'doc', 'ppt', 'xlsx', 'xls', 'csv', 'txt', 'md'];

// 页面特有翻译 - AI 可以直接看到所有文案，保留原始 key 结构
const homeI18n = {
  zh: {
    nav: {
      materialGenerate: '素材生成', materialCenter: '素材中心',
      history: '历史项目', settings: '设置', help: '帮助'
    },
    settings: {
      language: { label: '界面语言' },
      theme: { label: '主题模式', light: '浅色', dark: '深色', system: '跟随系统' }
    },
    home: {
      title: '光伏智呈',
      subtitle: '地面光伏事业部 AI 汇报生成平台',
      tagline: '基于 ChatGPT/OpenAI 能力的光伏业务汇报生成工作台',
      features: {
        oneClick: '一句话生成 PPT',
        naturalEdit: '自然语言修改',
        regionEdit: '指定区域编辑',
        export: '一键导出 PPTX/PDF',
      },
      tabs: {
        idea: '一句话生成',
        outline: '从大纲生成',
        description: '从描述生成',
        ppt_renovation: 'PPT 翻新',
      },
      tabDescriptions: {
        idea: '输入你的想法，AI 将为你生成完整的 PPT',
        outline: '已有大纲？直接粘贴，AI 将自动切分为结构化大纲',
        description: '已有完整描述？AI 将自动解析并直接生成图片，跳过大纲步骤',
        ppt_renovation: '上传已有的 PDF/PPTX 文件，AI 将解析内容并重新生成翻新后的PPT',
      },
      placeholders: {
        idea: '例如：生成一份关于 AI 发展史的演讲 PPT',
        outline: '粘贴你的 PPT 大纲...',
        description: '粘贴你的完整页面描述...',
      },
      examples: {
        outline: '格式示例：\n\n第一页：AI 的起源\n- 1956年达特茅斯会议\n- 早期研究者的愿景\n\n第二页：机器学习的发展\n- 从规则驱动到数据驱动\n- 经典算法介绍\n\n第三页：未来展望\n- 趋势与挑战\n\n支持标题+要点的形式，也可以只写标题。AI 会自动切分为结构化大纲。',
        description: '格式示例：\n\n第一页：AI 的起源\n介绍人工智能概念的诞生，从1956年达特茅斯会议讲起。页面采用左文右图布局，左侧展示时间线，右侧配一张复古风格的计算机插画。\n\n第二页：机器学习的发展\n讲解从规则驱动到数据驱动的转变。使用深蓝色背景，中央放置算法对比图表，底部列出关键里程碑。\n\n每页可包含内容描述、排版布局、视觉风格等，用空行分隔各页。',
      },
      template: {
        title: '选择风格模板',
        useTextStyle: '使用文字描述风格',
      },
      actions: {
        selectFile: '选择参考文件',
        parsing: '解析中...',
        createProject: '创建新项目',
      },
      renovation: {
        uploadHint: '点击或拖拽上传 PDF / PPTX 文件',
        formatHint: '支持 .pdf, .pptx, .ppt 格式（推荐上传 PDF）',
        keepLayout: '保留原始排版布局',
        onlyPdfPptx: '仅支持 PDF 和 PPTX 文件',
        uploadFile: '请先上传 PDF 或 PPTX 文件',
      },
      messages: {
        enterContent: '请输入内容',
        filesParsing: '还有 {{count}} 个参考文件正在解析中，请等待解析完成',
        projectCreateFailed: '项目创建失败',
        uploadingImage: '正在上传图片并识别内容...',
        imageUploadSuccess: '图片上传成功！已插入到光标位置',
        imageUploadFailed: '图片上传失败',
        fileUploadSuccess: '文件上传成功',
        fileUploadFailed: '文件上传失败',
        fileTooLarge: '文件过大：{{size}}MB，最大支持 200MB',
        fileUploadInProgress: '正在上传文件，请等待当前上传完成后再试',
        unsupportedFileType: '不支持的文件类型: {{type}}',
        loadTemplateFailed: '加载模板失败，请重新选择或上传模板',
        pptTip: '建议先在本地将 PPTX 转为 PDF 后再上传，可获得更好的兼容性和更快的处理速度',
        filesAdded: '已添加 {{count}} 个参考文件',
        imageRemoved: '已移除图片',
        serviceTestTip: '建议先到设置页底部进行服务测试，避免后续功能异常',
        verifying: '正在验证 API 配置...',
        verifyFailed: '请在设置页配置正确的 API Key，并在页面底部点击「服务测试」验证',
      },
    },
  },
  en: {
    nav: {
      materialGenerate: 'Generate Material', materialCenter: 'Material Center',
      history: 'History', settings: 'Settings', help: 'Help'
    },
    settings: {
      language: { label: 'Interface Language' },
      theme: { label: 'Theme', light: 'Light', dark: 'Dark', system: 'System' }
    },
    home: {
      title: 'PV SmartDeck',
      subtitle: 'AI report generation platform for photovoltaic business',
      tagline: 'AI-native presentation workspace powered by ChatGPT/OpenAI capabilities',
      features: {
        oneClick: 'One-click PPT generation',
        naturalEdit: 'Natural language editing',
        regionEdit: 'Region-specific editing',
        export: 'Export to PPTX/PDF',
      },
      tabs: {
        idea: 'From Idea',
        outline: 'From Outline',
        description: 'From Description',
        ppt_renovation: 'PPT Renovation',
      },
      tabDescriptions: {
        idea: 'Enter your idea, AI will generate a complete PPT for you',
        outline: 'Have an outline? Paste it directly, AI will split it into a structured outline',
        description: 'Have detailed descriptions? AI will parse and generate images directly, skipping the outline step',
        ppt_renovation: 'Upload an existing PDF/PPTX file, AI will parse its content and regenerate the renovated PPT',
      },
      placeholders: {
        idea: 'e.g., Generate a presentation about the history of AI',
        outline: 'Paste your PPT outline...',
        description: 'Paste your complete page descriptions...',
      },
      examples: {
        outline: 'Format example:\n\nSlide 1: The Origins of AI\n- 1956 Dartmouth Conference\n- Vision of early researchers\n\nSlide 2: The Rise of Machine Learning\n- From rule-based to data-driven\n- Classic algorithms overview\n\nSlide 3: Future Outlook\n- Trends and challenges\n\nTitles with bullet points, or titles only. AI will split it into a structured outline.',
        description: 'Format example:\n\nSlide 1: The Origins of AI\nIntroduce the birth of AI, starting from the 1956 Dartmouth Conference. Use a left-text right-image layout with a timeline on the left and a retro-style computer illustration on the right.\n\nSlide 2: The Rise of Machine Learning\nExplain the shift from rule-based to data-driven approaches. Dark blue background, algorithm comparison chart in the center, key milestones at the bottom.\n\nEach slide can include content, layout, and visual style. Separate slides with blank lines.',
      },
      template: {
        title: 'Select Style Template',
        useTextStyle: 'Use text description for style',
      },
      actions: {
        selectFile: 'Select reference file',
        parsing: 'Parsing...',
        createProject: 'Create New Project',
      },
      renovation: {
        uploadHint: 'Click or drag to upload PDF / PPTX file',
        formatHint: 'Supports .pdf, .pptx, .ppt formats (PDF recommended)',
        keepLayout: 'Keep original layout',
        onlyPdfPptx: 'Only PDF and PPTX files are supported',
        uploadFile: 'Please upload a PDF or PPTX file first',
      },
      messages: {
        enterContent: 'Please enter content',
        filesParsing: '{{count}} reference file(s) are still parsing, please wait',
        projectCreateFailed: 'Failed to create project',
        uploadingImage: 'Uploading and recognizing image...',
        imageUploadSuccess: 'Image uploaded! Inserted at cursor position',
        imageUploadFailed: 'Failed to upload image',
        fileUploadSuccess: 'File uploaded successfully',
        fileUploadFailed: 'Failed to upload file',
        fileTooLarge: 'File too large: {{size}}MB, maximum 200MB',
        fileUploadInProgress: 'A file upload is already in progress — please wait for it to finish',
        unsupportedFileType: 'Unsupported file type: {{type}}',
        loadTemplateFailed: 'Failed to load the template. Please select or upload it again',
        pptTip: 'We recommend converting your PPTX to PDF locally before uploading for better compatibility and faster processing',
        filesAdded: 'Added {{count}} reference file(s)',
        imageRemoved: 'Image removed',
        serviceTestTip: 'Test services in Settings first to avoid issues',
        verifying: 'Verifying API configuration...',
        verifyFailed: 'Please configure a valid API Key in Settings and click "Service Test" at the bottom to verify',
      },
    },
  },
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const t = useT(homeI18n); // 组件内翻译 + 自动 fallback 到全局
  const { initializeProject, isGlobalLoading } = useProjectStore();
  const { user } = useAuthStore();
  const { show, toasts: homeToasts, remove: homeRemove } = useToast();
  
  const [activeTab, setActiveTab] = useState<CreationType>('idea');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isMaterialCenterOpen, setIsMaterialCenterOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  const [useTemplateStyle, setUseTemplateStyle] = useState(false);
  const [templateStyle, setTemplateStyle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isAspectRatioOpen, setIsAspectRatioOpen] = useState(false);
  const [renovationFile, setRenovationFile] = useState<File | null>(null);
  const [keepLayout, setKeepLayout] = useState(false);
  const renovationFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 持久化草稿到 sessionStorage，确保跳转设置页后返回时内容不丢失
  useEffect(() => {
    if (content) {
      sessionStorage.setItem('home-draft-content', content);
    }
  }, [content]);

  useEffect(() => {
    sessionStorage.setItem('home-draft-tab', activeTab);
  }, [activeTab]);


  // 检查是否有当前项目 & 加载用户模板
  useEffect(() => {
    const projectId = localStorage.getItem('currentProjectId');
    setCurrentProjectId(projectId);

    // 加载用户模板列表（用于按需获取File）
    const loadTemplates = async () => {
      try {
        const response = await listUserTemplates();
        if (response.data?.templates) {
          setUserTemplates(response.data.templates);
        }
      } catch (error) {
        console.error('加载用户模板失败:', error);
      }
    };
    loadTemplates();
  }, []);

  // 首次访问自动弹出帮助模态框
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('hasSeenHelpModal');
    if (!hasSeenHelp) {
      // 延迟500ms打开，让页面先渲染完成
      const timer = setTimeout(() => {
        setIsHelpModalOpen(true);
        localStorage.setItem('hasSeenHelpModal', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenMaterialModal = () => {
    // 在主页始终生成全局素材，不关联任何项目
    setIsMaterialModalOpen(true);
  };

  const textareaRef = useRef<MarkdownTextareaRef>(null);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);

  // Callback to insert at cursor position in the textarea
  const insertAtCursor = useCallback((markdown: string) => {
    textareaRef.current?.insertAtCursor(markdown);
  }, []);

  // 图片粘贴使用统一 hook（批量支持，不对非图片文件发出警告，由下方 handlePaste 处理文档）
  const { handlePaste: handleImagePaste, handleFiles: handleImageFiles, isUploading: isUploadingImage } = useImagePaste({
    projectId: null,
    setContent,
    showToast: show,
    warnUnsupportedTypes: false,
    insertAtCursor,
  });

  const handleMaterialSelect = useCallback((materials: Material[]) => {
    const markdown = buildMaterialsMarkdown(materials, setContent);
    textareaRef.current?.insertAtCursor(markdown + '\n');
  }, [setContent]);

  // 检测粘贴事件，图片走 hook，文档走独立逻辑
  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 分类：图片 vs 文档 vs 不支持
    let hasImages = false;
    const docFiles: File[] = [];
    const unsupportedExts: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (!file) continue;

      if (file.type.startsWith('image/')) {
        hasImages = true;
      } else {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt && ALLOWED_DOC_EXTENSIONS.includes(fileExt)) {
          docFiles.push(file);
        } else {
          unsupportedExts.push(fileExt || file.type);
        }
      }
    }

    // 图片交给 hook 处理（批量上传）
    if (hasImages) {
      handleImagePaste(e);
    }

    // 文档文件逐个上传
    if (docFiles.length > 0) {
      if (!hasImages) e.preventDefault();
      for (const file of docFiles) {
        await handleFileUpload(file);
      }
    }

    // 不支持的文件类型提示
    if (unsupportedExts.length > 0 && !hasImages && docFiles.length === 0) {
      show({ message: t('home.messages.unsupportedFileType', { type: unsupportedExts.join(', ') }), type: 'info' });
    }
  };

  // 上传文件
  // 在 Home 页面，文件始终上传为全局文件（不关联项目），因为此时还没有项目
  const handleFileUpload = useCallback(async (file: File) => {
    if (isUploadingFile) return;

    // 检查文件大小（前端预检查）
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      show({ 
        message: t('home.messages.fileTooLarge', { size: (file.size / 1024 / 1024).toFixed(1) }), 
        type: 'error' 
      });
      return;
    }

    // 检查是否是PPT文件，提示建议使用PDF
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'ppt' || fileExt === 'pptx') 
      show({ message: `💡 ${t('home.messages.pptTip')}`, type: 'info' });
    
    setIsUploadingFile(true);
    try {
      // 在 Home 页面，始终上传为全局文件
      const response = await uploadReferenceFile(file, null);
      if (response?.data?.file) {
        const uploadedFile = response.data.file;
        setReferenceFiles(prev => [...prev, uploadedFile]);
        show({ message: t('home.messages.fileUploadSuccess'), type: 'success' });
        
        // 如果文件状态为 pending，自动触发解析
        if (uploadedFile.parse_status === 'pending') {
          try {
            const parseResponse = await triggerFileParse(uploadedFile.id);
            // 使用解析接口返回的文件对象更新状态
            if (parseResponse?.data?.file) {
              const parsedFile = parseResponse.data.file;
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? parsedFile : f)
              );
            } else {
              // 如果没有返回文件对象，手动更新状态为 parsing（异步线程会稍后更新）
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? { ...f, parse_status: 'parsing' as const } : f)
              );
            }
          } catch (parseError: any) {
            console.error('触发文件解析失败:', parseError);
            // 解析触发失败不影响上传成功提示
          }
        }
      } else {
        show({ message: t('home.messages.fileUploadFailed'), type: 'error' });
      }
    } catch (error: any) {
      console.error('文件上传失败:', error);
      
      // 特殊处理413错误
      if (error?.response?.status === 413) {
        show({
          message: t('home.messages.fileTooLarge', { size: (file.size / 1024 / 1024).toFixed(1) }),
          type: 'error'
        });
      } else {
        show({
          message: `${t('home.messages.fileUploadFailed')}: ${error?.response?.data?.error?.message || error.message || ''}`.replace(/: $/, ''),
          type: 'error'
        });
      }
    } finally {
      setIsUploadingFile(false);
    }
  }, [isUploadingFile, show, t]);

  // 拖拽进来的文档文件：按扩展名过滤后复用 handleFileUpload（逐个上传+自动触发解析）
  const handleDocumentFiles = useCallback(async (files: File[]) => {
    // 已有上传在进行时告知用户，避免文件被静默丢弃（handleFileUpload 的 isUploadingFile 守卫）
    if (isUploadingFile) {
      show({ message: t('home.messages.fileUploadInProgress'), type: 'info' });
      return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_DOC_EXTENSIONS.includes(ext)) {
        accepted.push(file);
      } else {
        rejected.push(ext || file.type || file.name);
      }
    }

    if (rejected.length > 0) {
      // 去重扩展名，避免一次拖入多个同类型不支持文件时 toast 重复冗长
      show({
        message: t('home.messages.unsupportedFileType', {
          type: Array.from(new Set(rejected)).join(', '),
        }),
        type: 'info',
      });
    }

    for (const file of accepted) {
      await handleFileUpload(file);
    }
  }, [isUploadingFile, handleFileUpload, show, t]);

  // 从当前项目移除文件引用（不删除文件本身）
  const handleFileRemove = (fileId: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 文件状态变化回调
  const handleFileStatusChange = (updatedFile: ReferenceFile) => {
    setReferenceFiles(prev => 
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
  };

  // 点击回形针按钮 - 打开文件选择器
  const handlePaperclipClick = () => {
    setIsFileSelectorOpen(true);
  };

  // 从选择器选择文件后的回调
  const handleFilesSelected = (selectedFiles: ReferenceFile[]) => {
    // 合并新选择的文件到列表（去重）
    setReferenceFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFiles = selectedFiles.filter(f => !existingIds.has(f.id));
      // 合并时，如果文件已存在，更新其状态（可能解析状态已改变）
      const updated = prev.map(f => {
        const updatedFile = selectedFiles.find(sf => sf.id === f.id);
        return updatedFile || f;
      });
      return [...updated, ...newFiles];
    });
    show({ message: t('home.messages.filesAdded', { count: selectedFiles.length }), type: 'success' });
  };

  // 获取当前已选择的文件ID列表，传递给选择器（使用 useMemo 避免每次渲染都重新计算）
  const selectedFileIds = useMemo(() => {
    return referenceFiles.map(f => f.id);
  }, [referenceFiles]);

  // 文件选择变化
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await handleFileUpload(files[i]);
    }

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  };

  const tabConfig = {
    idea: {
      icon: <Sparkles size={20} />,
      label: t('home.tabs.idea'),
      placeholder: t('home.placeholders.idea'),
      description: t('home.tabDescriptions.idea'),
      example: null as string | null,
    },
    outline: {
      icon: <FileText size={20} />,
      label: t('home.tabs.outline'),
      placeholder: t('home.placeholders.outline'),
      description: t('home.tabDescriptions.outline'),
      example: t('home.examples.outline'),
    },
    description: {
      icon: <FileEdit size={20} />,
      label: t('home.tabs.description'),
      placeholder: t('home.placeholders.description'),
      description: t('home.tabDescriptions.description'),
      example: t('home.examples.description'),
    },
    ppt_renovation: {
      icon: <RefreshCw size={20} />,
      label: t('home.tabs.ppt_renovation'),
      placeholder: '',
      description: t('home.tabDescriptions.ppt_renovation'),
      example: null as string | null,
    },
  };

  const handleTemplateSelect = async (templateFile: File | null, templateId?: string) => {
    // 总是设置文件（如果提供）
    if (templateFile) {
      setSelectedTemplate(templateFile);
    }
    
    // 处理模板 ID
    if (templateId) {
      // 判断是用户模板还是预设模板
      // 预设模板 ID 通常是 '1', '2', '3' 等短字符串
      // 用户模板 ID 通常较长（UUID 格式）
      if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
        // 预设模板
        setSelectedPresetTemplateId(templateId);
        setSelectedTemplateId(null);
      } else {
        // 用户模板
        setSelectedTemplateId(templateId);
        setSelectedPresetTemplateId(null);
      }
    } else {
      // 如果没有 templateId，可能是直接上传的文件
      // 清空所有选择状态
      setSelectedTemplateId(null);
      setSelectedPresetTemplateId(null);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // For ppt_renovation, validate file instead of content
    if (activeTab === 'ppt_renovation') {
      if (!renovationFile) {
        show({ message: t('home.renovation.uploadFile'), type: 'error' });
        return;
      }
    } else if (!content.trim()) {
      show({ message: t('home.messages.enterContent'), type: 'error' });
      return;
    }

    // 检查是否有正在解析的文件
    const parsingFiles = referenceFiles.filter(f =>
      f.parse_status === 'pending' || f.parse_status === 'parsing'
    );
    if (parsingFiles.length > 0) {
      show({
        message: t('home.messages.filesParsing', { count: parsingFiles.length }),
        type: 'info'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // PPT 翻新模式：走独立的上传+异步解析流程
      if (activeTab === 'ppt_renovation' && renovationFile) {
        const styleDesc = templateStyle.trim() ? templateStyle.trim() : undefined;
        const result = await createPptRenovationProject(renovationFile, {
          keepLayout,
          templateStyle: styleDesc,
        });

        const projectId = result.data?.project_id;
        const taskId = result.data?.task_id;
        if (!projectId) {
          show({ message: t('home.messages.projectCreateFailed'), type: 'error' });
          return;
        }

        // Save project ID and task ID for DetailEditor to poll
        localStorage.setItem('currentProjectId', projectId);
        if (taskId) {
          localStorage.setItem('renovationTaskId', taskId);
        }

        // Clear draft
        sessionStorage.removeItem('home-draft-content');
        sessionStorage.removeItem('home-draft-tab');

        // Navigate to detail editor (will poll for task completion with skeleton UI)
        navigate(`/project/${projectId}/detail`);
        return;
      }

      // 如果有模板ID但没有File，按需加载
      let templateFile = selectedTemplate;
      if (!templateFile && (selectedTemplateId || selectedPresetTemplateId)) {
        const templateId = selectedTemplateId || selectedPresetTemplateId;
        if (templateId) {
          templateFile = await getTemplateFile(templateId, userTemplates);
          if (!templateFile) {
            show({ message: t('home.messages.loadTemplateFailed'), type: 'error' });
            return;
          }
        }
      }
      
      // 传递风格描述（只要有内容就传递，不管开关状态）
      const styleDesc = templateStyle.trim() ? templateStyle.trim() : undefined;

      // 传递参考文件ID列表，确保 AI 生成时能读取参考文件内容
      const refFileIds = referenceFiles
        .filter(f => f.parse_status === 'completed')
        .map(f => f.id);

      await initializeProject(activeTab as 'idea' | 'outline' | 'description', content, templateFile || undefined, styleDesc, refFileIds.length > 0 ? refFileIds : undefined, aspectRatio);
      
      // 根据类型跳转到不同页面
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        show({ message: t('home.messages.projectCreateFailed'), type: 'error' });
        return;
      }
      
      // 关联未完成解析的参考文件（已完成的在 initializeProject 中关联）
      if (referenceFiles.length > 0) {
        const unassociatedFiles = referenceFiles.filter(f => f.parse_status !== 'completed');
        if (unassociatedFiles.length > 0) {
          devLog(`Associating ${unassociatedFiles.length} remaining reference files to project ${projectId}:`, unassociatedFiles);
          try {
            await Promise.all(
              unassociatedFiles.map(async file => {
                const response = await associateFileToProject(file.id, projectId);
                return response;
              })
            );
          } catch (error) {
            console.error('Failed to associate reference files:', error);
          }
        }
      }
      
      // 关联图片素材到项目（解析content中的markdown图片链接）
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const materialUrls: string[] = [];
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        materialUrls.push(match[2]); // match[2] 是 URL
      }
      
      if (materialUrls.length > 0) {
        devLog(`Associating ${materialUrls.length} materials to project ${projectId}:`, materialUrls);
        try {
          const response = await associateMaterialsToProject(projectId, materialUrls);
          devLog('Materials associated successfully:', response);
        } catch (error) {
          console.error('Failed to associate materials:', error);
          // 不影响主流程，继续执行
        }
      } else {
        devLog('No materials to associate');
      }
      
      navigate(`/project/${projectId}/outline`);
    } catch (error: any) {
      console.error('创建项目失败:', error);
      const msg = error?.response?.data?.error?.message || error?.message || t('home.messages.projectCreateFailed');
      show({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasParsingFiles = referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing');
  const completedReferenceCount = referenceFiles.filter(f => f.parse_status === 'completed').length;
  const dashboardStats = [
    { label: '创建入口', value: '4', hint: '一句话 / 大纲 / 描述 / 翻新', icon: Sparkles },
    { label: '参考文件', value: String(referenceFiles.length), hint: `${completedReferenceCount} 个可用于生成`, icon: Paperclip },
    { label: '素材入口', value: '2', hint: '生成素材与素材中心', icon: ImagePlus },
    { label: '模型主线', value: 'OpenAI', hint: 'ChatGPT / gpt-image-2', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Activity size={14} />
            基于 ChatGPT/OpenAI 能力的光伏业务汇报生成工作台
          </div>
          <h1 className="text-[22px] font-semibold leading-tight text-gray-900">工作台</h1>
          <p className="mt-1 text-sm text-gray-500">创建汇报、继续项目、查看任务状态和管理常用资源。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={<ImagePlus size={16} />} onClick={handleOpenMaterialModal}>
            素材生成
          </Button>
          <Button variant="secondary" size="sm" icon={<FolderOpen size={16} />} onClick={() => setIsMaterialCenterOpen(true)}>
            素材中心
          </Button>
          <Button variant="secondary" size="sm" icon={<HelpCircle size={16} />} onClick={() => setIsHelpModalOpen(true)}>
            帮助
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">{stat.hint}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">快捷创建汇报</h2>
                <p className="mt-1 text-sm text-gray-500">{tabConfig[activeTab].description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(tabConfig) as CreationType[]).map((type) => {
                  const config = tabConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveTab(type)}
                      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                        activeTab === type
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
              <span className="leading-5">
                {tabConfig[activeTab].description}
                {tabConfig[activeTab].example && (
                  <span className="relative group ml-2 inline-flex align-middle">
                    <HelpCircle size={15} className="cursor-help text-blue-500" />
                    <span className="absolute left-1/2 top-full z-50 mt-2 hidden w-80 -translate-x-1/2 whitespace-pre-line rounded-md border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-700 shadow-lg group-hover:block">
                      {tabConfig[activeTab].example}
                    </span>
                  </span>
                )}
              </span>
            </div>

            {activeTab === 'ppt_renovation' ? (
              <div className="space-y-4">
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-amber-400 hover:bg-amber-50/40"
                  onClick={() => renovationFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt'))) {
                      setRenovationFile(file);
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (ext === 'ppt' || ext === 'pptx') {
                        show({ message: `💡 ${t('home.messages.pptTip')}`, type: 'info' });
                      }
                    } else {
                      show({ message: t('home.renovation.onlyPdfPptx'), type: 'error' });
                    }
                  }}
                >
                  {renovationFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={24} className="text-amber-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{renovationFile.name}</p>
                        <p className="text-xs text-gray-500">{(renovationFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRenovationFile(null); }}
                        className="ml-2 text-gray-400 transition-colors hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-gray-400" />
                      <p className="text-sm text-gray-700">{t('home.renovation.uploadHint')}</p>
                      <p className="text-xs text-gray-500">{t('home.renovation.formatHint')}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={renovationFileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRenovationFile(file);
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (ext === 'ppt' || ext === 'pptx') {
                        show({ message: `💡 ${t('home.messages.pptTip')}`, type: 'info' });
                      }
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={keepLayout}
                      onChange={(e) => setKeepLayout(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-600">{t('home.renovation.keepLayout')}</span>
                  </label>
                  <Button size="sm" onClick={handleSubmit} loading={isSubmitting || isGlobalLoading} disabled={!renovationFile}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            ) : (
              <MarkdownTextarea
                ref={textareaRef}
                placeholder={tabConfig[activeTab].placeholder}
                value={content}
                onChange={setContent}
                onPaste={handlePaste}
                onFiles={handleImageFiles}
                onDocumentFiles={handleDocumentFiles}
                onSelectFromLibrary={() => setIsMaterialSelectorOpen(true)}
                rows={activeTab === 'idea' ? 4 : 8}
                className="text-sm md:text-base"
                toolbarLeft={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePaperclipClick}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title={t('home.actions.selectFile')}
                    >
                      <Paperclip size={18} />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAspectRatioOpen(!isAspectRatioOpen)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        title={i18n.language?.startsWith('zh') ? '画面比例' : 'Aspect Ratio'}
                      >
                        <span>{aspectRatio}</span>
                        <ChevronDown size={12} className={`transition-transform ${isAspectRatioOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isAspectRatioOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAspectRatioOpen(false)} />
                          <div className="absolute bottom-full left-0 z-50 mb-1 min-w-[80px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                            {ASPECT_RATIO_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => { setAspectRatio(opt.value); setIsAspectRatioOpen(false); }}
                                className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-100 ${aspectRatio === opt.value ? 'font-semibold text-amber-700' : 'text-gray-700'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                }
                toolbarRight={
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    loading={isSubmitting || isGlobalLoading}
                    disabled={!content.trim() || isUploadingImage || hasParsingFiles}
                  >
                    {hasParsingFiles ? t('home.actions.parsing') : t('common.next')}
                  </Button>
                }
              />
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />

            <ReferenceFileList
              files={referenceFiles}
              onFileClick={setPreviewFileId}
              onFileDelete={handleFileRemove}
              onFileStatusChange={handleFileStatusChange}
              deleteMode="remove"
              showToast={show}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-amber-600" />
                <h2 className="text-base font-semibold text-gray-900">{t('home.template.title')}</h2>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useTemplateStyle}
                  onChange={(e) => {
                    setUseTemplateStyle(e.target.checked);
                    if (e.target.checked) {
                      setSelectedTemplate(null);
                      setSelectedTemplateId(null);
                      setSelectedPresetTemplateId(null);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                {t('home.template.useTextStyle')}
              </label>
            </div>
            {useTemplateStyle ? (
              <TextStyleSelector value={templateStyle} onChange={setTemplateStyle} onToast={show} />
            ) : (
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplateId}
                selectedPresetTemplateId={selectedPresetTemplateId}
                showUpload
                projectId={currentProjectId}
              />
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">最近项目</h2>
              <button type="button" onClick={() => navigate('/history')} className="text-sm font-medium text-amber-700 hover:text-amber-800">
                查看全部
              </button>
            </div>
            {currentProjectId ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">当前项目</p>
                    <p className="mt-1 text-xs text-gray-500">ID: {currentProjectId.slice(0, 8)}...</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/project/${currentProjectId}/outline`)}>
                    继续编辑
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                暂无最近项目。使用左侧创建区开始第一份汇报。
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">导出任务状态</h2>
            <button type="button" onClick={() => navigate('/exports')} className="text-sm font-medium text-amber-700 hover:text-amber-800">
              任务中心
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: '进行中', value: '0', icon: Clock, tone: 'text-blue-700 bg-blue-50' },
              { label: '可下载', value: '0', icon: Download, tone: 'text-green-700 bg-green-50' },
              { label: '失败待处理', value: '0', icon: AlertCircle, tone: 'text-red-700 bg-red-50' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border border-gray-200 p-3">
                  <div className={`mb-2 inline-flex rounded-md p-2 ${item.tone}`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">系统状态</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'OpenAI/ChatGPT 主线', value: '默认推荐', icon: CheckCircle2 },
              { label: '图片生成/编辑', value: 'gpt-image-2', icon: ImagePlus },
              { label: '文件解析', value: hasParsingFiles ? '解析中' : '就绪', icon: FileText },
              { label: user?.is_admin ? '管理员统计' : '个人工作区', value: user?.is_admin ? '可查看用户与项目治理' : '仅显示个人项目', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon size={16} className="text-amber-600" />
                    {item.label}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ToastContainer toasts={homeToasts} onRemove={homeRemove} />
      <MaterialGeneratorModal projectId={null} isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} />
      <MaterialCenterModal isOpen={isMaterialCenterOpen} onClose={() => setIsMaterialCenterOpen(false)} />
      <MaterialSelector isOpen={isMaterialSelectorOpen} onClose={() => setIsMaterialSelectorOpen(false)} onSelect={handleMaterialSelect} multiple />
      <ReferenceFileSelector
        projectId={null}
        isOpen={isFileSelectorOpen}
        onClose={() => setIsFileSelectorOpen(false)}
        onSelect={handleFilesSelected}
        multiple
        initialSelectedIds={selectedFileIds}
      />
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};
