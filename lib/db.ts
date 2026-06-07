import TableStore from 'tablestore';

// 初始化 TableStore 客户端
const tablestoreClient = new TableStore.Client({
  accessKeyId: process.env.TABLESTORE_ACCESS_KEY_ID || process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.TABLESTORE_ACCESS_KEY_SECRET || process.env.OSS_ACCESS_KEY_SECRET || '',
  endpoint: process.env.TABLESTORE_ENDPOINT || 'https://follow-ai.cn-hangzhou.tablestore.aliyuncs.com',
  instancename: process.env.TABLESTORE_INSTANCE_NAME || 'follow-ai',
  maxRetries: 3
});

const USER_TABLE_NAME = 'users';

// 用户缓存（减少 TableStore 读取）
const userCache = new Map<string, { data: any; timestamp: number }>();

// 从 TableStore 获取用户
export async function getUser(username: string) {
  const cached = userCache.get(username);
  if (cached && (Date.now() - cached.timestamp) < 60000) {
    return cached.data;
  }
  
  try {
    const result = await tablestoreClient.getRow({
      tableName: USER_TABLE_NAME,
      primaryKey: [{ userid: username }]
    });
    
    if (result.row && result.row.primaryKey) {
      const userData: any = {};
      if (result.row.attributes) {
        result.row.attributes.forEach((attr: any) => {
          userData[attr.columnName] = attr.columnValue;
        });
      }
      
      userCache.set(username, {
        data: userData,
        timestamp: Date.now()
      });
      
      return userData;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'OTSRowOperationFailure' || error.message.includes('Row not exist')) {
      return null;
    }
    throw error;
  }
}

// 保存用户到 TableStore
export async function saveUser(username: string, passwordHash: string) {
  try {
    await tablestoreClient.putRow({
      tableName: USER_TABLE_NAME,
      condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
      primaryKey: [{ userid: username }],
      attributeColumns: [
        { password: passwordHash },
        { createdAt: Date.now() }
      ]
    });
    
    userCache.set(username, {
      data: { password: passwordHash, createdAt: Date.now() },
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    throw error;
  }
}

// 检查用户是否存在
export async function userExists(username: string) {
  const user = await getUser(username);
  return user !== null;
}
