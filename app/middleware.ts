import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要保护的路由
const protectedRoutes = ['/chat'];

// 公开路由（无需登录）
const publicRoutes = ['/', '/login', '/register'];

// API 路由前缀
const apiPrefix = '/api/';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 获取 token
  const token = request.cookies.get('token')?.value;
  
  // API 路由：验证 JWT（除了登出 API）
  if (pathname.startsWith(apiPrefix) && pathname !== '/api/logout') {
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      );
    }
  }
  
  // 页面路由：重定向逻辑
  // 访问受保护页面但未登录
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 已登录用户访问登录页
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 目录下的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
