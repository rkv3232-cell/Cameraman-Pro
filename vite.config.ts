import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['logo.png'],
            workbox: {
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                globIgnores: ['**/cameraman-pro.png'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/cameraman-pro-2aa2b\.web\.app\/(?!.*(cameraman-pro|\.apk)).*$/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'site-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 1 day
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Cameraman Pro',
                short_name: 'Cameraman Pro',
                description: 'Cameraman Pro Studio Management',
                theme_color: '#0a0a0a',
                background_color: '#0a0a0a',
                display: 'standalone',
                icons: [
                    {
                        src: '/logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
        strictPort: true,
        host: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/messaging'],
                    'vendor-ui': ['framer-motion', 'lucide-react', 'recharts', 'jspdf'],
                    'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'zustand', 'react-hook-form']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})
