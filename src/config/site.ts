import { ShieldCheck, type LucideIcon } from 'lucide-react';

/* ─────────────────────────────────────────────
   SINGLE SOURCE OF TRUTH
   All static text, images, and colors live here.
   Never hardcode these values in components.
   ───────────────────────────────────────────── */

export interface BotConfig {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
    tagline: string;
    disclaimer: string;
    webhookUrl: string;
}

export const siteConfig = {
    /* ── Colors ── */
    colors: {
        brandPrimary: '#307c4c',
        brandPrimaryHover: '#25603a',
        brandPrimaryActive: '#1f5232',
        brandPrimaryDark: '#28663E',

        // Chat bubble colors
        userBubbleBg: '#307c4c',
        assistantBubbleBg: '#f0f0f0',
        assistantBubbleBorder: '#e0e0e0',
        assistantTextColor: '#1a1a1a',

        // Login
        loginGlow: 'rgba(48,124,76,0.35)',
        loginBgGlow: '#307c4c',

        // Fallback avatar
        fallbackAvatarBg: '#307c4c',
    },

    /* ── Images ── */
    images: {
        logo: '/nesr-logo.jpg',
        favicon: '/icon.png',
    },

    /* ── Text Strings ── */
    text: {
        appName: 'HSE Virtual Support Agent',
        appDescription: 'Intelligent HSE Assistant',

        // Sidebar
        sidebarTitle: 'HSE Virtual Support Agent',
        newChatButton: 'New Chat',
        signOutButton: 'Sign Out',

        // Chat
        chattingWith: 'Chatting with',
        youLabel: 'You',
        defaultUserName: 'NESR User',
        defaultJobTitle: 'NESR Employee',
        inputPlaceholder: (botName: string) => `Message ${botName}...`,
        disclaimer: (botDisclaimer: string) =>
            `HSE Virtual Support Agent • ${botDisclaimer}`,
        welcomeGreeting: (botName: string) => `Hello, I am ${botName}.`,
        errorMessage:
            'Detailed error: Unable to connect to the chatbot. Please try again later.',
        genericError:
            'Chatbot is not available due to high demand right now. Please try again later.',

        // Login page
        login: {
            title: 'Welcome to HSE Virtual Support Agent',
            subtitle: 'Intelligent HSE Assistant',
            ssoButton: 'Continue with SSO',
            divider: 'or',
            passwordPlaceholder: 'Enter password',
            loginButton: 'Login with Password',
            loadingText: 'Signing in…',
            errorText: 'Incorrect password. Please try again.',
            footer: 'NESR Internal Tool • Authorized Personnel Only',
            pageTitle: 'Sign In — HSE Virtual Support Agent',
        },
    },

    /* ── Suggestions ── */
    suggestions: [
        'How do I report an incident for: ',
    ],

    /* ── Bot ── */
    bot: {
        id: 'hse',
        name: 'HSE Virtual Support Agent',
        icon: ShieldCheck,
        description: 'How can I assist you today?',
        tagline: '',
        disclaimer: 'Always verify safety information with the relevant HSE authority',
        webhookUrl: process.env.NEXT_PUBLIC_HSE_WEBHOOK || '',
    } satisfies BotConfig,
} as const;
