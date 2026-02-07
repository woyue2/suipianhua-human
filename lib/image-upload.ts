export type ImageProvider = 'imgur' | 'smms' | 'custom';

export interface ImageUploadConfig {
  provider: ImageProvider;
  apiKey: string;
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
    uploadUrl: 'https://api.imgur.com/3/image',
    headers: (cfg) => ({ Authorization: `Client-ID ${cfg.apiKey}` }),
    formFieldName: 'image',
    parseResponse: (data: unknown) => {
      const d = data as { data?: { link?: string } } | undefined;
      if (d?.data?.link) return { url: d.data.link };
      return null;
    },
  },
  smms: {
    name: 'SM.MS',
    uploadUrl: 'https://sm.ms/api/v2/upload',
    headers: (cfg) => ({ Authorization: cfg.apiKey }),
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
    headers: (cfg) => ({ 'X-API-Key': cfg.apiKey }),
    formFieldName: 'file',
    parseResponse: (data: unknown) => {
      const d = data as { url?: string } | undefined;
      if (d?.url) return { url: d.url };
      return null;
    },
  },
};
