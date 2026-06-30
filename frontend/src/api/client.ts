import axios from 'axios';

// 开发环境：通过 Vite proxy 转发
// 生产环境：通过 nginx proxy 转发
const API_BASE_URL = '';

// 401 回调，由 useAuthStore 在 App 初始化时注册
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const raw = localStorage.getItem('banana-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore parse errors
  }

  const accessCode = localStorage.getItem('banana-access-code');
  if (accessCode) {
    headers['X-Access-Code'] = accessCode;
  }

  return headers;
}

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟超时（AI生成可能很慢）
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // Attach JWT token and optional legacy access code.
    if (config.headers) {
      const authHeaders = getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        config.headers[key] = value;
      });
    }

    // 如果请求体是 FormData，删除 Content-Type 让浏览器自动设置
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    } else if (config.headers && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 401 时调用注册的登出回调，让 AuthGuard 重新渲染登录页（不 reload，避免无限循环）
      if (error.response.status === 401) {
        _onUnauthorized?.();
      }
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 图片URL处理工具
// 使用相对路径，通过代理转发到后端
export const getImageUrl = (path?: string, timestamp?: string | number): string => {
  if (!path) return '';
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // 使用相对路径（确保以 / 开头）
  let url = path.startsWith('/') ? path : '/' + path;
  
  // 添加时间戳参数避免浏览器缓存（仅在提供时间戳时添加）
  if (timestamp) {
    const ts = typeof timestamp === 'string' 
      ? new Date(timestamp).getTime() 
      : timestamp;
    url += `?v=${ts}`;
  }
  
  return url;
};

export default apiClient;
