// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                Connect.
                <br />
                <span className="text-brand-primary">Volunteer.</span>
                <br />
                Impact.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Empowering communities through meaningful volunteer work. 
                Discover opportunities, make a difference, and create lasting impact together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <a
                  href="/register/volunteer"
                  className="bg-brand-primary text-white px-8 py-4 rounded-xl hover:bg-brand-primary-hover font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
                >
                  Register as Volunteer
                </a>
                <a
                  href="/register/organization"
                  className="bg-white text-brand-primary px-8 py-4 rounded-xl border-2 border-brand-primary hover:bg-blue-50 font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
                >
                  Register as Organization
                </a>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-accent">check_circle</span>
                  Free to join
                </span>
                <span>•</span>
                <span>Verified opportunities</span>
                <span>•</span>
                <span>Community driven</span>
              </div>
            </div>
            <div className="relative w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <img src="/image.svg" alt="" className="w-full bg-blue-50" />
              <div className="p-8">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: 'favorite', label: 'Volunteer', count: '1,200+' },
                    { icon: 'business', label: 'Organizations', count: '350+' },
                    { icon: 'language', label: 'Communities', count: '50+' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                      <span className="material-symbols-outlined h-8 w-8 mx-auto text-brand-primary mb-2">{stat.icon}</span>
                      <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48C240 120 480 0 720 36C960 72 1200 120 1440 96V120H0V48Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Voluntry?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for everyone who wants to make a difference — volunteers, organizations, and administrators alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Volunteers */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined h-8 w-8 text-brand-primary">rocket_launch</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Volunteers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-primary">check_circle</span>
                  Discover events matching your skills
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-primary">check_circle</span>
                  Track your impact and hours
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-primary">check_circle</span>
                  Build your volunteer portfolio
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-primary">check_circle</span>
                  Connect with like-minded community
                </li>
              </ul>
            </div>

            {/* For Organizations */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-brand-accent-light hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-brand-accent-light rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined h-8 w-8 text-brand-accent">business</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Organizations</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-accent">check_circle</span>
                  Post events and find volunteers
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-accent">check_circle</span>
                  Manage applications efficiently
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-accent">check_circle</span>
                  Track volunteer impact
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-brand-accent">check_circle</span>
                  Scale your community impact
                </li>
              </ul>
            </div>

            {/* For Admins */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined h-8 w-8 text-purple-600">verified</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Admins</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-purple-500">check_circle</span>
                  Monitor platform activity
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-purple-500">check_circle</span>
                  Verify and approve users
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-purple-500">check_circle</span>
                  Maintain community standards
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined h-5 w-5 text-purple-500">check_circle</span>
                  Data insights and analytics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Icons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined h-8 w-8 text-brand-primary">group</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community First</h3>
              <p className="text-gray-600">Built to foster genuine connections between volunteers and organizations</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-brand-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined h-8 w-8 text-brand-accent">verified</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Opportunities</h3>
              <p className="text-gray-600">All events and organizations are verified for authenticity</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined h-8 w-8 text-purple-600">bar_chart</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Impact</h3>
              <p className="text-gray-600">Monitor hours, skills gained, and communities helped</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of volunteers and organizations already making an impact through Voluntry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register/volunteer"
              className="bg-white text-brand-primary px-8 py-4 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
            >
              Get Started as Volunteer
            </a>
            <a
              href="/register/organization"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl hover:bg-brand-primary-hover font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
            >
              Get Started as Organization
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}