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
