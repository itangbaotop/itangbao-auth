// src/components/HomePage.tsx
"use client";

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { I18nProvider } from '@/contexts/I18nProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Shield, 
  Zap, 
  Users, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  Github, 
  Chrome,
  Mail,
  Star,
  Globe,
  Smartphone,
  Settings,
  Code,
  Heart,
  Download,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Session } from 'next-auth';

interface HomePageProps {
  session: Session | null;
}

function HomePageContent({ session }: HomePageProps) {
  const { t } = useTranslation(['common', 'home']);

  const features = [
    {
      icon: Shield,
      title: t('home:features.security.title', { defaultValue: '企业级安全' }),
      description: t('home:features.security.desc', { defaultValue: '采用最新的安全标准，保护您的数据安全' }),
      color: 'bg-blue-500'
    },
    {
      icon: Zap,
      title: t('home:features.fast.title', { defaultValue: '快速部署' }),
      description: t('home:features.fast.desc', { defaultValue: '几分钟内即可部署完成，开箱即用' }),
      color: 'bg-yellow-500'
    },
    {
      icon: Users,
      title: t('home:features.multiProvider.title', { defaultValue: '多种登录方式' }),
      description: t('home:features.multiProvider.desc', { defaultValue: '支持 Google、GitHub、邮箱等多种登录方式' }),
      color: 'bg-green-500'
    },
    {
      icon: Globe,
      title: t('home:features.international.title', { defaultValue: '国际化支持' }),
      description: t('home:features.international.desc', { defaultValue: '支持多语言，覆盖全球用户' }),
      color: 'bg-purple-500'
    },
    {
      icon: Code,
      title: t('home:features.opensource.title', { defaultValue: '完全开源' }),
      description: t('home:features.opensource.desc', { defaultValue: 'MIT 许可证，免费使用和修改' }),
      color: 'bg-pink-500'
    },
    {
      icon: Settings,
      title: t('home:features.customizable.title', { defaultValue: '高度可定制' }),
      description: t('home:features.customizable.desc', { defaultValue: '灵活的配置选项，满足不同需求' }),
      color: 'bg-indigo-500'
    }
  ];

  const loginMethods = [
    {
      name: 'Google',
      icon: Chrome,
      description: t('home:loginMethods.google', { defaultValue: '使用 Google 账户快速登录' }),
      color: 'text-red-500'
    },
    {
      name: 'GitHub',
      icon: Github,
      description: t('home:loginMethods.github', { defaultValue: '开发者首选的登录方式' }),
      color: 'text-gray-900'
    },
    {
      name: t('home:loginMethods.emailName', { defaultValue: '邮箱' }),
      icon: Mail,
      description: t('home:loginMethods.email', { defaultValue: '无需密码，安全的魔法链接登录' }),
      color: 'text-blue-500'
    }
  ];

  const stats = [
    { 
      number: '99.9%', 
      label: t('home:stats.uptime', { defaultValue: '服务可用性' }) 
    },
    { 
      number: '< 100ms', 
      label: t('home:stats.responseTime', { defaultValue: '响应时间' }) 
    },
    { 
      number: 'MIT', 
      label: t('home:stats.license', { defaultValue: '开源许可证' }) 
    },
    { 
      number: '100%', 
      label: t('home:stats.free', { defaultValue: '免费使用' }) 
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {t('home:brand', { defaultValue: 'AuthHub' })}
              </span>
              <Badge variant="secondary" className="ml-2">
                {t('home:opensource', { defaultValue: '开源' })}
              </Badge>
            </div>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('home:nav.features', { defaultValue: '功能特性' })}
              </a>
              {/* <a href="#docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('home:nav.docs', { defaultValue: '文档' })}
              </a>
              <a href="#community" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('home:nav.community', { defaultValue: '社区' })}
              </a> */}
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {/* GitHub 链接 */}
              <a 
                href="https://github.com/itangbaotop/itangbao-auth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="text-sm font-medium">GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              
              {/* <Link href="/auth/signin">
                <Button size="sm">
                  {t('home:demo', { defaultValue: '在线演示' })}
                </Button>
              </Link> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              {t('home:hero.badge', { defaultValue: '开源免费' })}
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              <span className="block">
                {t('home:hero.title1', { defaultValue: '开源的' })}
              </span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('home:hero.title2', { defaultValue: '身份认证服务' })}
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home:hero.subtitle', { 
                defaultValue: '为您的应用提供安全、快速、易用的身份认证解决方案。完全开源，免费使用，支持多种登录方式。' 
              })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="https://github.com/itangbaotop/itangbao-auth" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="px-8 py-3 text-lg">
                  <Github className="mr-2 h-5 w-5" />
                  {t('home:hero.cta.github', { defaultValue: '查看源码' })}
                </Button>
              </a>
              {/* <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  {t('home:hero.cta.demo', { defaultValue: '在线演示' })}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link> */}
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 背景装饰 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-10 blur-3xl"></div>
      </section>

      {/* 登录方式展示 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home:loginSection.title', { defaultValue: '支持多种登录方式' })}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home:loginSection.subtitle', { 
                defaultValue: '为用户提供便捷的登录选择，提升用户体验' 
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loginMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className={`h-6 w-6 ${method.color}`} />
                    </div>
                    <CardTitle className="text-xl">
                      {method.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {method.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home:featuresSection.title', { defaultValue: '强大的功能特性' })}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home:featuresSection.subtitle', { 
                defaultValue: '开源免费的身份认证解决方案，满足各种业务需求' 
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 社区和贡献 */}
      <section id="community" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home:community.title', { defaultValue: '加入社区' })}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home:community.subtitle', { 
                defaultValue: '与开发者社区一起，共同完善这个开源项目' 
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {t('home:community.contribute.title', { defaultValue: '如何贡献' })}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {t('home:community.contribute.code', { defaultValue: '代码贡献' })}
                    </h4>
                    <p className="text-gray-600">
                      {t('home:community.contribute.codeDesc', { defaultValue: '提交 Pull Request，修复 Bug 或添加新功能' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {t('home:community.contribute.docs', { defaultValue: '文档完善' })}
                    </h4>
                    <p className="text-gray-600">
                      {t('home:community.contribute.docsDesc', { defaultValue: '帮助完善文档，让项目更易使用' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {t('home:community.contribute.issues', { defaultValue: '问题反馈' })}
                    </h4>
                    <p className="text-gray-600">
                      {t('home:community.contribute.issuesDesc', { defaultValue: '报告 Bug 或提出功能建议' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                <Github className="h-16 w-16 text-gray-900 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {t('home:community.github.title', { defaultValue: '在 GitHub 上关注我们' })}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('home:community.github.desc', { defaultValue: '获取最新更新，参与讨论' })}
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button>
                      <Star className="mr-2 h-4 w-4" />
                      {t('home:community.github.star', { defaultValue: 'Star' })}
                    </Button>
                  </a>
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth/fork" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <Code className="mr-2 h-4 w-4" />
                      {t('home:community.github.fork', { defaultValue: 'Fork' })}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('home:cta.title', { defaultValue: '准备开始了吗？' })}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t('home:cta.subtitle', { 
              defaultValue: '立即部署我们的开源认证服务，为您的用户提供安全便捷的登录体验' 
            })}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/itangbaotop/itangbao-auth" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                <Github className="mr-2 h-5 w-5" />
                {t('home:cta.primary', { defaultValue: '开始使用' })}
              </Button>
            </a>
            {/* <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                {t('home:cta.secondary', { defaultValue: '在线演示' })}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* 品牌信息 */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  {t('home:brand', { defaultValue: 'AuthHub' })}
                </span>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {t('home:opensource', { defaultValue: '开源' })}
                </Badge>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                {t('home:footer.description', { 
                  defaultValue: '开源免费的现代化身份认证解决方案，为开发者而生。' 
                })}
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://github.com/itangbaotop/itangbao-auth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* 项目链接 */}
            <div>
              <h3 className="font-semibold mb-4">
                {t('home:footer.project', { defaultValue: '项目' })}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t('home:footer.github', { defaultValue: 'GitHub' })}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    {t('home:footer.features', { defaultValue: '功能特性' })}
                  </a>
                </li>
                {/* <li>
                  <a href="#docs" className="hover:text-white transition-colors">
                    {t('home:footer.docs', { defaultValue: '使用文档' })}
                  </a>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-white transition-colors">
                    {t('home:footer.demo', { defaultValue: '在线演示' })}
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* 社区链接 */}
            <div>
              <h3 className="font-semibold mb-4">
                {t('home:footer.community', { defaultValue: '社区' })}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t('home:footer.issues', { defaultValue: '问题反馈' })}
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth/discussions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t('home:footer.discussions', { defaultValue: '讨论' })}
                  </a>
                </li>
                {/* <li>
                  <a 
                    href="https://github.com/itangbaotop/itangbao-auth/blob/main/CONTRIBUTING.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t('home:footer.contributing', { defaultValue: '贡献指南' })}
                  </a>
                </li> */}
              </ul>
            </div>
          </div>

          {/* 版权信息 */}
          {/* <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AuthHub. {t('home:footer.license', { defaultValue: 'MIT 许可证开源项目。' })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a 
                href="https://github.com/itangbaotop/itangbao-auth/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('home:footer.license', { defaultValue: 'MIT 许可证' })}
              </a>
              <a 
                href="https://github.com/itangbaotop/itangbao-auth/blob/main/PRIVACY.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('home:footer.privacy', { defaultValue: '隐私政策' })}
              </a>
              <a 
                href="https://github.com/itangbaotop/itangbao-auth/blob/main/CODE_OF_CONDUCT.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('home:footer.conduct', { defaultValue: '行为准则' })}
              </a>
            </div>
          </div> */}
        </div>
      </footer>
    </div>
  );
}

export function HomePage({ session }: HomePageProps) {
  return (
    <I18nProvider>
      <HomePageContent session={session} />
    </I18nProvider>
  );
}
