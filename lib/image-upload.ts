export type ImageProvider = 'imgur' | 'smms' | 'custom';

export interface ImageUploadConfig {
  provider: ImageProvider;
  apiKey?: string; // 可选，服务端可使用环境变量
  customUrl?: string;
}

export const IMAGE_PROVIDERS: Record<
  ImageProvider,
  {
    name: string;
    uploadUrl: string | ((config: ImageUploadConfig) => string);
    headers: (config: ImageUploadConfig) => Record<string, string>;
    formFieldName: string;
    parseResponse: (data: unknown) => { url: string } | null;
  }
> = {
  imgur: {
    name: 'Imgur',
    uploadUrl: 'https://www.imgurl.org/api/v3/upload',
    headers: (cfg) => cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
    formFieldName: 'file',
    parseResponse: (data: unknown) => {
      const d = data as { code?: number; data?: { url?: string; link?: string } } | undefined;
      if (d?.code === 200 && d?.data?.url) return { url: d.data.url };
      return null;
    },
  },
  smms: {
    name: 'SM.MS',
    uploadUrl: 'https://sm.ms/api/v2/upload',
    headers: (cfg) => cfg.apiKey ? { Authorization: cfg.apiKey } : {},
    formFieldName: 'smfile',
    parseResponse: (data: unknown) => {
      const d = data as { success?: boolean; data?: { url?: string } } | undefined;
      if (d?.success && d.data?.url) return { url: d.data.url };
      return null;
    },
  },
  custom: {
    name: '自定义',
    uploadUrl: (cfg) => cfg.customUrl || '',
    headers: (cfg) => cfg.apiKey ? { 'X-API-Key': cfg.apiKey } : {},
    formFieldName: 'file',
    parseResponse: (data: unknown) => {
      const d = data as { url?: string } | undefined;
      if (d?.url) return { url: d.url };
      return null;
    },
  },
};
