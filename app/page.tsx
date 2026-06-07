import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function Home() {
  // 服务端直接读取 Cookie 判断登录状态
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      redirect('/chat')
    }
  }
  
  // 未登录重定向到登录页
  redirect('/login')
}
