// src/app/auth/error/page.tsx

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return '邮箱或密码错误，请重试。';
      case 'OAuthAccountNotLinked':
        return '此邮箱已通过其他方式注册，请尝试使用其他登录方式。';
      // 在这里可以根据需要添加更多具体的错误码处理
      default:
        return '登录过程中发生未知错误，请稍后重试或联系管理员。';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#dc3545' }}>登录失败</h1>
      <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
        {getErrorMessage(error)}
      </p>
      <a 
        href="/auth/signin" 
        style={{ 
          marginTop: '2.5rem', 
          color: '#007bff', 
          textDecoration: 'none',
          fontSize: '1rem',
          padding: '10px 20px',
          border: '1px solid #007bff',
          borderRadius: '5px'
        }}
      >
        返回登录页面
      </a>
    </div>
  );
}

// 导出的页面组件
export default function AuthErrorPage() {
  return (
    // useSearchParams 需要在 Suspense 内部使用
    <Suspense fallback={<div>加载中...</div>}>
      <ErrorDisplay />
    </Suspense>
  );
}