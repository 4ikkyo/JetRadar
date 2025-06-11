import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cx } from '../../lib/classNameHelper';

const NotifIcon = ({type}) => {
    const classes = "w-5 h-5 rounded-full mr-3 text-white flex items-center justify-center text-xs font-bold flex-shrink-0";
    if(type === 'success') return <div className={cx(classes, "bg-green-500")}>✓</div>
    if(type === 'warning') return <div className={cx(classes, "bg-amber-500")}>!</div>
    return <div className={cx(classes, "bg-blue-500")}>i</div>
}

const NotificationsSection = () => {
    const { notifications, clearNotifications } = useContext(AppContext);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Уведомления</h2>
                {notifications.length > 0 && <Button variant="secondary" className="text-xs" onClick={clearNotifications}>Очистить все</Button>}
            </div>
            <ul className="space-y-3">
                {notifications.length > 0 ? notifications.map(n => (
                    <li key={n.id} className="bg-gray-50 p-3 rounded-lg flex items-start">
                        <NotifIcon type={n.type} />
                        <div>
                            <p className="text-sm text-gray-800">{n.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                    </li>
                )) : <p className="text-center text-gray-500 py-4">Новых уведомлений нет.</p>}
            </ul>
        </Card>
    );
}

export default NotificationsSection;