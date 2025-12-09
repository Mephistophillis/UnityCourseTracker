import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, loadUsersData, logoutUser } from '../utils/storage';
import './Home.css';

export function Home() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/');
            return;
        }
        setCurrentUser(user);

        loadUsersData()
            .then(data => {
                setUsers(data.users);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [navigate]);

    const calculateProgress = (userProgress) => {
        let total = 0, completed = 0;
        if (!userProgress) return 0;

        Object.values(userProgress).forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                total++;
                if (lesson.completed) completed++;
            });
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="home-page">
            <header className="app-header">
                <h1>Unity Course Tracker</h1>
                <div className="user-controls">
                    {currentUser && (
                        <div className="current-user-info">
                            <img src={currentUser.avatar} alt="Me" className="avatar-small" />
                            <span>{currentUser.first_name || currentUser.username}</span>
                        </div>
                    )}
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>
            <main>
                <div className="table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Participant</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const progress = calculateProgress(user.progress);
                                const isCurrentUser = String(user.id) === String(currentUser?.id);
                                return (
                                    <tr key={user.id} className={isCurrentUser ? 'row-current-user' : ''}>
                                        <td className="user-cell">
                                            <img src={user.avatar} alt={user.username} className="avatar" />
                                            <Link to={`/participant/${user.id}`} className="user-link">
                                                {user.username || `User ${user.id}`}
                                                {isCurrentUser && <span className="me-badge"> (You)</span>}
                                            </Link>
                                        </td>
                                        <td className="progress-cell">
                                            <div className="progress-container">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#34C759' : '#007AFF' }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text">{progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
