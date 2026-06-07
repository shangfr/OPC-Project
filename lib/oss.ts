import OSS from 'ali-oss';

// 初始化 OSS 客户端
const ossClient = new OSS({
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || 'follow-ai'
});

// 上传 Base64 文件到 OSS
export async function uploadToOss(
  base64Data: string,
  fileName: string,
  contentType: string,
  expertName: string | null = null
): Promise<string> {
  const base64String = base64Data.split(';base64,').pop() || '';
  const buffer = Buffer.from(base64String, 'base64');
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop();
  
  const expertFolder = expertName ? `${expertName}/` : '';
  const ossPath = `bailian-files/${expertFolder}${timestamp}-${randomStr}.${ext}`;
  
  const result = await ossClient.put(ossPath, buffer, {
    headers: {
      'Content-Type': contentType
    }
  });
  
  const ossUrl = result.url;
  return ossUrl.replace('http://', 'https://');
}
