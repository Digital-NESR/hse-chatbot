'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { siteConfig } from '@/config/site';

const { colors, images, text } = siteConfig;
const login = text.login;

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSSOLogin = () => {
        signIn('azure-ad', { callbackUrl: '/' });
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsLoading(true);
        setError('');

        const result = await signIn('credentials', {
            password,
            redirect: false,
            callbackUrl: '/',
        });

        if (result?.ok) {
            router.replace('/');
        } else {
            setError(login.errorText);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#162a1e] to-slate-950 relative overflow-hidden">

            {/* Subtle background glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: `${colors.loginBgGlow}1A` }}
            />

            {/* Login Card */}
            <div className="relative z-10 w-full px-4 sm:max-w-md sm:px-0">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 md:px-8 md:py-10 flex flex-col items-center gap-7">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-5">
                        <div
                            className="relative h-16 w-16 rounded-xl overflow-hidden"
                            style={{ boxShadow: `0 0 40px ${colors.loginGlow}` }}
                        >
                            <Image
                                src={images.logo}
                                alt={text.appName}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                                {login.title}
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                {login.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* SSO Button */}
                    <button
                        onClick={handleSSOLogin}
                        className="w-full min-h-[48px] flex items-center justify-center gap-3 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                        style={{
                            backgroundColor: colors.brandPrimary,
                            boxShadow: `0 10px 15px -3px ${colors.brandPrimary}4D`,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.brandPrimaryHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.brandPrimary)}
                    >
                        <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                        </svg>
                        {login.ssoButton}
                    </button>

                    {/* Divider */}
                    <div className="w-full flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-slate-500 uppercase tracking-widest">{login.divider}</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Password Form */}
                    <form onSubmit={handlePasswordLogin} className="w-full flex flex-col gap-3">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder={login.passwordPlaceholder}
                            autoComplete="current-password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                            style={{ '--tw-ring-color': colors.brandPrimary } as React.CSSProperties}
                        />

                        {error && (
                            <p className="text-red-400 text-xs text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={!password.trim() || isLoading}
                            className="w-full min-h-[48px] flex items-center justify-center text-sm font-semibold py-3 px-5 rounded-xl border border-white/10 text-white transition-all duration-200 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isLoading ? login.loadingText : login.loginButton}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-slate-500 text-xs text-center">
                        {login.footer}
                    </p>

                </div>
            </div>
        </div>
    );
}
