// src/middleware.ts
import { NextResponse } from "next/server";
// 导入 NextAuth 的核心认证函数，而不是中间件导出
import { auth as nextAuthAuth } from "@/lib/auth/config"; 

// Next.js 中间件必须有一个默认导出，并且是一个 async function
export default async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. 如果请求是针对 NextAuth 内部 API 路由，直接放行
  // 这一步非常关键，因为这些路由是 NextAuth 内部处理认证流程的。
  // 如果我们在这里拦截它们，会导致认证流程中断。
  if (pathname.startsWith('/api/auth')) {
    // 调试日志：放行 NextAuth API 路由
    console.log(`[Middleware] 放行 NextAuth API 路由: ${pathname}`);
    return NextResponse.next();
  }

  // 2. 对于管理员路由保护逻辑
  // 如果路径以 '/admin' 开头，且不是管理员登录页 '/admin/login'
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // 在这里，我们需要手动调用 NextAuth 的认证检查来获取会话
    // nextAuthAuth(request) 会执行认证逻辑并填充 request.auth
    // 但我们不能直接依赖它作为默认导出。
    // 我们需要再次调用 auth 函数来获取会话信息。
    const session = await nextAuthAuth(); // 直接调用 auth 函数获取会话

    // 调试日志：观察中间件的执行流程和会话状态
    console.log(`[Middleware] Protecting admin route: ${pathname}`);
    console.log(`[Middleware] Current session in middleware: ${session ? '存在' : '不存在'}`);
    console.log(`[Middleware] User role in middleware: ${session?.user?.role || '未知'}`);

    // 如果用户未登录 (session 不存在)
    if (!session) {
      console.log('[Middleware] 用户未认证，重定向到管理员登录页');
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // 如果用户已登录，但角色不是 'admin'
    if (session.user?.role !== 'admin') {
      console.log('[Middleware] 用户已认证但不是管理员，重定向到管理员登录页');
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'unauthorized'); // 添加错误信息
      return NextResponse.redirect(url);
    }
  }

  // 3. 对于其他所有未被上述逻辑拦截的路由，正常通过
  return NextResponse.next();
}

// 配置中间件的匹配路径
export const config = {
  // 匹配所有以 '/admin' 开头的路径
  // 注意：不再需要匹配 '/api/auth'，因为我们在函数内部已经处理了
  matcher: ['/admin/:path*'],
};
