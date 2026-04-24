// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Voluntry" className="h-[100px] w-auto" />
          </Link>
          <div className="flex items-center space-x-8">
            <Link
              href="/login"
              className="text-gray-700 hover:text-brand-primary font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover font-medium transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
