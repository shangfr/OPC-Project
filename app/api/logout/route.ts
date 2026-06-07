import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // 删除 token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // 立即过期
  });
  
  return response;
}
