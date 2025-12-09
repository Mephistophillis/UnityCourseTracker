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

        async function fetchData() {
            try {
                const [userData, courseData] = await Promise.all([
                    loadUsersData(),
                    loadCourseData()
                ]);

                // Supabase returns { users: [] } from loadUsersData
                // If we are looking for a specific user but rely on the "list", we might miss if list is paginated (future proofing)
                // But for now, let's use getUser directly if specific user is needed, OR stick to list if we want to show rank/etc.
                // The original code used the list to find the user. 

                // Better approach: fetch specific user profile directly for reliability
                const directUser = await import('../utils/storage').then(m => m.getUser(userId));

                if (directUser) {
                    setUser(directUser);
                } else {
                    // Fallback to local user if it matches and is just created
                    if (String(curr.id) === String(userId)) {
                        setUser({
                            ...curr,
                            progress: curr.progress || {} // ensure progress object exists if we fallback
                        });
                    } else {
                        console.warn("User not found");
                    }
                }

                setCourse(courseData);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }

        fetchData();
    }, [userId, navigate]);

    const handleCheckboxChange = async (chapterId, lessonId, currentCompleted) => {
        if (!isOwnProfile) return;

        // Optimistic update
        const updatedUser = { ...user };
        // Deep clone progress to avoid mutation issues if state is complex
        updatedUser.progress = JSON.parse(JSON.stringify(updatedUser.progress));

        if (!updatedUser.progress[chapterId]) updatedUser.progress[chapterId] = { lessons: [] };

        let lesson = updatedUser.progress[chapterId].lessons.find(l => l.id === lessonId);
        if (!lesson) {
            lesson = { id: lessonId, completed: false };
            updatedUser.progress[chapterId].lessons.push(lesson);
        }

        lesson.completed = !currentCompleted;
        setUser(updatedUser);

        // Send to server
        const success = await updateUserProgress(user.id, chapterId, lessonId, !currentCompleted);
        if (!success) {
            // Revert on failure (optional, but good practice)
            console.error("Failed to save progress");
            // simplified: just warn for now
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!user || !course) return <div className="error">User or Course data not found</div>;

    const calculateOverallProgress = () => {
        if (!course) return 0;
        let total = 0;
        course.chapters.forEach(c => total += c.lessons.length);

        let completed = 0;
        Object.values(user.progress).forEach(chapter => {
            chapter.lessons.forEach(l => {
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
