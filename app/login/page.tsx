'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction, registerAction } from '@/app/actions/auth'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    
    try {
      if (isLogin) {
        const result = await loginAction(formData)
        if (result.success) {
          localStorage.setItem('current-user', username)
          localStorage.removeItem('chat-sessions')
          localStorage.removeItem('selected-expert')
          toast.success('登录成功')
          router.refresh() // 刷新服务端状态
          router.push('/chat')
        } else {
          setError(result.error || '登录失败')
          toast.error(result.error || '登录失败')
        }
      } else {
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string
        
        if (password !== confirmPassword) {
          setError('两次密码输入不一致')
          setIsLoading(false)
          return
        }
        
        const result = await registerAction(formData)
        if (result.success) {
          toast.success('注册成功，正在登录...')
          const loginResult = await loginAction(formData)
          if (loginResult.success) {
            localStorage.setItem('current-user', username)
            localStorage.removeItem('chat-sessions')
            localStorage.removeItem('selected-expert')
            toast.success('登录成功')
            router.refresh()
            router.push('/chat')
          } else {
            setError('自动登录失败')
          }
        } else {
          setError(result.error || '注册失败')
          toast.error(result.error || '注册失败')
        }
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-lg">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">省心咨询</h1>
          <p className="text-muted-foreground">AI智能咨询平台</p>
        </div>
        
        {/* 登录/注册卡片 */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* 切换标签 */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              注册
            </button>
          </div>
          
          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="请输入用户名"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  密码
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="请再次输入密码"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
              )}
            </div>
            
            {/* 错误提示 */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? '处理中...'
                : isLogin
                ? '登录'
                : '注册'
              }
            </button>
          </form>
        </div>
        
        {/* 底部信息 */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 北京省心咨询</p>
          <p className="mt-1">专业 · 高效 · 可信赖</p>
        </div>
      </div>
    </div>
  )
}
