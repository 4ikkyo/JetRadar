import { useContext, useRef, useCallback, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

// Import all section components
import Dashboard from '../sections/Dashboard';
import WalletDetails from '../sections/WalletDetails';
import GraphSection from '../sections/Graph';
import AnalyticsSection from '../sections/Analytics';
import NotificationsSection from '../sections/Notifications';
import SettingsSection from '../sections/Settings';


const MainContent = ({ setGraphTooltipContent, setGraphTooltipPosition, setShowGraphTooltip }) => {
    const { activeSection, navigateTo } = useContext(AppContext);

    // Swipe navigation logic
    const touchStartX = useRef(null);
    const sectionOrder = ['dashboard', 'graph', 'analytics', 'notifications', 'settings'];

    const handleTouchStart = useCallback((e) => {
        if (e.target.closest('.modal-backdrop') || e.target.closest('.graph-node')) {
            return;
        }
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX.current;
        const SWIPE_THRESHOLD = 50;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            let currentIndex = sectionOrder.indexOf(activeSection);
            let nextIndex = currentIndex;

            if (diff > 0 && currentIndex > 0) { // Swipe right
                nextIndex = currentIndex - 1;
            } else if (diff < 0 && currentIndex < sectionOrder.length - 1) { // Swipe left
                nextIndex = currentIndex + 1;
            }

            if (nextIndex !== currentIndex) {
                navigateTo(sectionOrder[nextIndex]);
            }
        }
        touchStartX.current = null;
    }, [activeSection, navigateTo, sectionOrder]);

    useEffect(() => {
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchEnd]);

    // Map section IDs to their components
    const sections = {
        dashboard: <Dashboard />,
        walletDetails: <WalletDetails />,
        graph: <GraphSection
            setTooltipContent={setGraphTooltipContent}
            setTooltipPosition={setGraphTooltipPosition}
            setShowTooltip={setShowGraphTooltip}
        />,
        analytics: <AnalyticsSection />,
        notifications: <NotificationsSection />,
        settings: <SettingsSection title="Настройки" />,
    };

    return (<main className="flex-grow p-2 sm:p-4">{sections[activeSection] || <Dashboard />}</main>);
};

export default MainContent;