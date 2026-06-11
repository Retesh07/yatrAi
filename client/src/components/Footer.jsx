import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Contact', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container font-bold text-sm">
              Y
            </div>
            <span className="text-lg font-bold text-on-surface dark:text-white tracking-tight">
              Yatr<span className="text-primary-container">AI</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-sm text-secondary dark:text-gray-400 hover:text-on-surface dark:hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-secondary/70 dark:text-gray-500">
            © {new Date().getFullYear()} YatrAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
