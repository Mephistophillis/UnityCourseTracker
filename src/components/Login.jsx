import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, loginUser, registerUser } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';

const isDev = import.meta.env.DEV;

export function Login() {
    const navigate = useNavigate();
    const [devUsers, setDevUsers] = useState([]);
    const [loading, setLoading] = useState(isDev);
    const { theme, toggleTheme } = useTheme();

    console.log({ devUsers, isDev })

    useEffect(() => {
        // Check if already logged in
        const user = getCurrentUser();
        if (user) {
            navigate('/home');
            return;
        }

        if (isDev) {
            // Load dev users from JSON
            fetch('/dev-users.json')
                .then(res => res.json())
                .then(data => {
                    console.log({ data })
                    setDevUsers(data.users || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            // Define callback for Telegram widget
            window.onTelegramAuth = async (user) => {
                const userData = {
                    id: user.id.toString(),
                    username: user.username,
                    avatar: user.photo_url
                };
                await registerUser(userData);
                loginUser(userData);
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
                }
                script.setAttribute('data-telegram-login', botName);
                script.setAttribute('data-size', 'large');
                script.setAttribute('data-onauth', 'onTelegramAuth(user)');
                script.setAttribute('data-request-access', 'write');
                script.async = true;

                document.getElementById('telegram-login-container').appendChild(script);
            }
        }
    }, [navigate]);

    const selectDevUser = (user) => {
        loginUser(user);
        navigate('/home');
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem', position: 'relative' }}>
            <button
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '18px',
                    padding: '8px 12px',
                    cursor: 'pointer'
                }}
                title="Toggle theme"
            >
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <h1>Unity Course Tracker</h1>
            {isDev ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Development Mode - Select a test user:</p>
                    {devUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => selectDevUser(user)}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: 'var(--primary)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                minWidth: '200px'
                            }}
                        >
                            {user.username}
                        </button>
                    ))}
                </div>
            ) : (
                <div id="telegram-login-container"></div>
            )}
            <p style={{ color: 'var(--text-secondary)' }}>Please log in to track your progress</p>
        </div>
    );
}
