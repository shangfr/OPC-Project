export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  thinking?: string
  // 消息标记
  enableSearch?: boolean   // 是否启用联网搜索
  enableThinking?: boolean // 是否启用深度思考
  hasFiles?: boolean       // 是否包含文件
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  expert: string
  createdAt: number
  updatedAt: number
  bailianSessionId?: string  // 百炼返回的session_id
}

export interface ExpertConfig {
  name: string
  role: string
  icon: string
  description: string
  color: string
  questions: string[]
}

export interface User {
  username: string
  token: string
  expiresIn: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  token?: string
}

export interface LoginResponse {
  success: boolean
  token: string
  username: string
}

export interface RegisterResponse {
  success: boolean
  message: string
}

export interface UserInfoResponse {
  username: string
  createdAt: number
}

// 错误类型
export interface ApiError {
  error: string
  status: number
}

// 聊天历史项
export interface ChatHistoryItem {
  userQuestion: string
  botAnswer: string
}

// 专家配置完整类型
export interface ExpertPromptConfig {
  role: string
  expertise: string
  tone: string
  core_rules: string[]
  workflow: string
  output_format: string
  disclaimer: string
}

export const EXPERTS: ExpertConfig[] = [
  {
    name: '法智助手',
    role: '专业AI法律咨询',
    icon: '⚖️',
    description: '民事、刑事、劳动法等法律咨询',
    color: 'bg-blue-500',
    questions: [
      '劳动合同纠纷如何处理？',
      '租房押金不退怎么办？',
      '欠款不还怎么维权？'
    ]
  },
  {
    name: '知行者·战略架构师',
    role: '顶级商业战略顾问',
    icon: '🎯',
    description: '顶层设计、战略规划、智库建设',
    color: 'bg-purple-500',
    questions: [
      '如何设计商业模式？',
      '专家智库如何搭建？',
      'AI研发战略怎么规划？'
    ]
  },
  {
    name: '问道·商业谋略官',
    role: '资深商业顾问',
    icon: '💼',
    description: '商业模式、政企需求、订单转化',
    color: 'bg-indigo-500',
    questions: [
      '如何挖掘政企需求？',
      '商业模式如何设计？',
      '高端圈层怎么运营？'
    ]
  },
  {
    name: '商事合规顾问',
    role: '专业AI法律顾问',
    icon: '📋',
    description: '商事风控、合同审核、股权合规',
    color: 'bg-green-500',
    questions: [
      '合同审核要注意什么？',
      '股权架构如何设计？',
      '商事风险如何防控？'
    ]
  },
  {
    name: '劳动用工法务',
    role: '专业AI劳动法律顾问',
    icon: '👥',
    description: '用工合规、人事风控、劳动纠纷',
    color: 'bg-orange-500',
    questions: [
      '如何合法辞退员工？',
      '工伤赔偿怎么计算？',
      '劳动合同怎么签？'
    ]
  },
  {
    name: '企业财税规划师',
    role: '专业AI财税顾问',
    icon: '💰',
    description: '金税四期、税务筹划、账务规范',
    color: 'bg-yellow-500',
    questions: [
      '金税四期如何应对？',
      '如何合法税务筹划？',
      '账务如何规范处理？'
    ]
  },
  {
    name: '资本融资顾问',
    role: '专业AI融资顾问',
    icon: '📈',
    description: '融资方案、BP打磨、资本对接',
    color: 'bg-red-500',
    questions: [
      '如何制作商业计划书？',
      '项目估值怎么计算？',
      '融资流程是怎样的？'
    ]
  },
  {
    name: '政企政策研究员',
    role: '专业AI政策顾问',
    icon: '🏛️',
    description: 'OPC申报、政策解读、补贴申领',
    color: 'bg-teal-500',
    questions: [
      '高新技术企业如何申报？',
      '专精特新怎么申请？',
      '有哪些补贴可以领？'
    ]
  },
  {
    name: 'AI智能体研发顾问',
    role: '专业AI技术顾问',
    icon: '🤖',
    description: 'AI智能体、数字化转型、SaaS工具',
    color: 'bg-cyan-500',
    questions: [
      '如何开发AI智能体？',
      '企业如何数字化转型？',
      'SaaS工具如何选择？'
    ]
  },
  {
    name: 'OPC创业训战导师',
    role: '专业创业导师',
    icon: '🚀',
    description: 'OPC孵化、AI工具实战、一人企业',
    color: 'bg-pink-500',
    questions: [
      '一人企业如何起步？',
      'OPC创业流程是什么？',
      '如何用AI提升效率？'
    ]
  }
]
