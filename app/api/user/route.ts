import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 从 Cookie 获取 token
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: '认证令牌无效或已过期' },
        { status: 401 }
      );
    }
    
    const user = await getUser(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        username: decoded.userId,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: '获取用户信息失败', detail: error.message },
      { status: 500 }
    );
  }
}
