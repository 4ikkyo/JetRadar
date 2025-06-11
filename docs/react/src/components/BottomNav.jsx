import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Icons } from '../lib/icons';
import { cx } from '../lib/classNameHelper';

const BottomNav = () => {
    const { activeSection, navigateTo, notifications } = useContext(AppContext);
    const navItems = [
        { id: 'dashboard', label: 'Главная', icon: Icons.dashboard },
        { id: 'graph', label: 'Графы', icon: Icons.graphs },
        { id: 'analytics', label: 'Аналитика', icon: Icons.analytics },
        { id: 'notifications', label: 'Уведомления', icon: Icons.notifications },
        { id: 'settings', label: 'Настройки', icon: Icons.settings },
    ];

    return (
        <footer className="bg-white p-3 shadow-md border-t border-gray-200 sticky bottom-0 z-40">
            <nav className="flex justify-around text-xs">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={cx(
                            'flex flex-col items-center w-16 transition-colors duration-200 relative',
                            activeSection === item.id ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-indigo-600'
                        )}
                    >
                        {item.id === 'notifications' && notifications.length > 0 && (
                            <span className="absolute -top-1 right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {notifications.length}
                            </span>
                        )}
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </footer>
    );
};

export default BottomNav;
