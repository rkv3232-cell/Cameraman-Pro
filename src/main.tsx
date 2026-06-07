import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { registerSW } from 'virtual:pwa-register'

// Auto update the service worker when a new version is available
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #334155',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#1e293b',
                        },
                    },
                }}
            />
        </ErrorBoundary>
    </React.StrictMode>,
)
