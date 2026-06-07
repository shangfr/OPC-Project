import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-800">页面未找到</h2>
        <p className="mt-2 text-gray-600">抱歉，您访问的页面不存在</p>
        <Link
          href="/"
          className="mt-8 inline-block px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
