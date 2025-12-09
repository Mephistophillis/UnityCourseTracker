import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, loginUser } from '../utils/storage';

export function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already logged in
        const user = getCurrentUser();
        if (user) {
            navigate('/home');
            return;
        }

        // Define callback for Telegram widget
        window.onTelegramAuth = (user) => {
            loginUser({
                id: user.id.toString(),
                username: user.username,
                avatar: user.photo_url
            });
            navigate('/home');
        };

        // Inject Telegram script dynamically if not present
        const scriptId = 'telegram-login-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            let botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'samplebot';
            if (botName.startsWith('@')) {
                botName = botName.substring(1);
            } у
            script.setAttribute('data-telegram-login', botName);
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.setAttribute('data-request-access', 'write');
            script.async = true;

            document.getElementById('telegram-login-container').appendChild(script);
        }
    }, [navigate]);

    return (
        <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem' }}>
            <h1>Unity Course Tracker</h1>
            <div id="telegram-login-container"></div>
            <p style={{ color: '#666' }}>Please log in to track your progress</p>
        </div>
    );
}
