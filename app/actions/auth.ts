'use server';

import { cookies } from 'next/headers';
import { getUser, userExists, saveUser } from '@/lib/db';
import { generateToken, hashPassword } from '@/lib/auth';

// 登录 Server Action
export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { success: false, error: '请输入用户名和密码' };
  }
  
  try {
    const user = await getUser(username);
    
    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    const passwordHash = hashPassword(password);
    
    if (user.password !== passwordHash) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    const token = generateToken(username);
    
    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 86400,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: '登录失败，请稍后重试' };
  }
}

// 注册 Server Action
export async function registerAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  if (!username || !password || !confirmPassword) {
    return { success: false, error: '请填写所有字段' };
  }
  
  if (username.length < 3 || username.length > 20) {
    return { success: false, error: '用户名长度应为 3-20 个字符' };
  }
  
  if (password.length < 6) {
    return { success: false, error: '密码长度至少 6 个字符' };
  }
  
  if (password !== confirmPassword) {
    return { success: false, error: '两次密码输入不一致' };
  }
  
  try {
    const exists = await userExists(username);
    
    if (exists) {
      return { success: false, error: '用户名已存在' };
    }
    
    const passwordHash = hashPassword(password);
    await saveUser(username, passwordHash);
    
    return { success: true, message: '注册成功' };
  } catch (error) {
    return { success: false, error: '注册失败，请稍后重试' };
  }
}

// 登出 Server Action
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return { success: true };
}

// 获取当前用户
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    const user = await getUser(decoded.userId);
    
    if (!user) {
      return null;
    }
    
    return {
      username: decoded.userId,
      createdAt: user.createdAt
    };
  } catch {
    return null;
  }
}
