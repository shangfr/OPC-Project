// 环境变量类型定义
interface EnvConfig {
  // 阿里云 OSS
  OSS_ACCESS_KEY_ID: string;
  OSS_ACCESS_KEY_SECRET: string;
  OSS_REGION: string;
  OSS_BUCKET: string;
  
  // TableStore
  TABLESTORE_ACCESS_KEY_ID: string;
  TABLESTORE_ACCESS_KEY_SECRET: string;
  TABLESTORE_ENDPOINT: string;
  TABLESTORE_INSTANCE_NAME: string;
  
  // 百炼
  DASHSCOPE_API_KEY: string;
  APP_ID: string;
  
  // JWT
  JWT_SECRET: string;
}

// 环境变量验证
export const env: EnvConfig = {
  OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID || '',
  OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET || '',
  OSS_REGION: process.env.OSS_REGION || 'oss-cn-hangzhou',
  OSS_BUCKET: process.env.OSS_BUCKET || 'follow-ai',
  
  TABLESTORE_ACCESS_KEY_ID: process.env.TABLESTORE_ACCESS_KEY_ID || process.env.OSS_ACCESS_KEY_ID || '',
  TABLESTORE_ACCESS_KEY_SECRET: process.env.TABLESTORE_ACCESS_KEY_SECRET || process.env.OSS_ACCESS_KEY_SECRET || '',
  TABLESTORE_ENDPOINT: process.env.TABLESTORE_ENDPOINT || 'https://follow-ai.cn-hangzhou.tablestore.aliyuncs.com',
  TABLESTORE_INSTANCE_NAME: process.env.TABLESTORE_INSTANCE_NAME || 'follow-ai',
  
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY || '',
  APP_ID: process.env.APP_ID || '',
  
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
};

// 验证必需的环境变量
export function validateEnv() {
  const required = [
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET',
    'DASHSCOPE_API_KEY',
    'APP_ID',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !env[key as keyof EnvConfig]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}
