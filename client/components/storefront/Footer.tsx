import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-white font-extrabold text-xl mb-3">ShopMERN</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Your one-stop shop for everything you need. Quality products at unbeatable prices.</p>
            <div className="flex gap-3 mt-5">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Shop',    links: [{ label: 'All Products', href: '/products' }, { label: 'Categories', href: '/categories' }, { label: 'Featured', href: '/products?featured=true' }] },
            { title: 'Account', links: [{ label: 'Login',        href: '/login' }, { label: 'Register',    href: '/register' }, { label: 'My Orders', href: '/account/orders' }] },
            { title: 'Help',    links: [{ label: 'Contact Us',   href: '/contact' }, { label: 'FAQ',       href: '/faq' }, { label: 'Returns',   href: '/returns' }] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-400 hover:text-white transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ShopMERN. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
