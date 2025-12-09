import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, loadUsersData, loadCourseData, updateUserProgress } from '../utils/storage';
import './Participant.css';

export function Participant() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [course, setCourse] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const curr = getCurrentUser();
        if (!curr) {
            navigate('/');
            return;
        }
        setCurrentUser(curr);
        setIsOwnProfile(String(curr.id) === String(userId));

        Promise.all([
            loadUsersData(),
            loadCourseData()
        ]).then(([userData, courseData]) => {
            const foundUser = userData.users.find(u => String(u.id) === String(userId));
            if (!foundUser) {
                // Handle user not found in list (maybe new auth user not in json yet)
                // For now just redirect or show error
                console.warn("User not found in users.json");
            }
            setUser(foundUser);
            setCourse(courseData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [userId, navigate]);

    const handleCheckboxChange = (chapterId, lessonId, currentCompleted) => {
        if (!isOwnProfile) return;

        const success = updateUserProgress(user.id, chapterId, lessonId, !currentCompleted);
        if (success) {
            // Optimistic update
            const updatedUser = { ...user };
            const lesson = updatedUser.progress[chapterId].lessons.find(l => l.id === lessonId);
            lesson.completed = !currentCompleted;
            setUser(updatedUser);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!user || !course) return <div className="error">User or Course data not found</div>;

    const calculateOverallProgress = () => {
        let total = 0, completed = 0;
        Object.values(user.progress).forEach(chapter => {
            chapter.lessons.forEach(l => {
                total++;
                if (l.completed) completed++;
            })
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const progress = calculateOverallProgress();

    return (
        <div className="participant-page">
            <header className="page-header">
                <Link to="/home" className="back-link">← Back to Dashboard</Link>
                <div className="profile-summary">
                    <img src={user.avatar} alt={user.username} className="avatar-large" />
                    <div className="profile-details">
                        <h1>{user.username}</h1>
                        <div className="progress-large">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span>{progress}% Completed</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="course-content">
                {course.chapters.map(chapter => (
                    <div key={chapter.id} className="chapter-card">
                        <h3>{chapter.title}</h3>
                        <ul className="lessons-list">
                            {chapter.lessons.map(lesson => {
                                // Find corresponding user progress
                                // Assuming structure matches. If keys might differ, need robust mapping.
                                // user.progress[chapter.id] might need safety check
                                const chapterProgress = user.progress[chapter.id];
                                const userLesson = chapterProgress?.lessons.find(l => l.id === lesson.id);
                                const isCompleted = userLesson?.completed || false;

                                return (
                                    <li key={lesson.id} className={`lesson-item ${isCompleted ? 'completed' : ''}`}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={isCompleted}
                                                disabled={!isOwnProfile}
                                                onChange={() => handleCheckboxChange(chapter.id, lesson.id, isCompleted)}
                                            />
                                            <span className="checkbox-custom"></span>
                                            <span className="lesson-title">{lesson.title}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </main>
        </div>
    );
}
