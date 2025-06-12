import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import WalletItem from './WalletItem';
import { Icons } from '../../lib/icons';
import { cx } from '../../lib/classNameHelper';

const Dashboard = () => {
    const { wallets, openAddWalletModal, showMessage, t } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGroup, setActiveGroup] = useState(t('filterAll'));

    const groups = [t('filterAll'), ...new Set(wallets.flatMap(w => w.groups || []))].filter(Boolean);

    const filteredWallets = wallets.filter(wallet =>
        (wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) || wallet.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (activeGroup === t('filterAll') || (wallet.groups && wallet.groups.includes(activeGroup)))
    );

    const totalTonValue = wallets.reduce((sum, wallet) => sum + wallet.tonValue, 0);

    return (
        <div className="space-y-4">
            <Card>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div className="bg-indigo-50 p-3 rounded-lg"><p className="text-sm text-gray-600">{t('wallets')}</p><p className="text-2xl font-bold text-indigo-700">{wallets.length}</p></div>
                    <div className="bg-green-50 p-3 rounded-lg"><p className="text-sm text-gray-600">{t('valueTon')}</p><p className="text-2xl font-bold text-green-700">{totalTonValue.toFixed(2)}</p></div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="primary" className="flex-1 py-2" onClick={() => showMessage(t('updating'))}>{Icons.refresh} <span>{t('refreshAll')}</span></Button>
                    <Button variant="secondary" className="flex-1 py-2" onClick={openAddWalletModal}>{Icons.addSmall} <span>{t('add')}</span></Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('watchlist')}</h2>
                <div className="relative mb-4">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('searchPlaceholder')}/>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{Icons.search}</div>
                </div>
                <div className="flex space-x-2 mb-4 text-sm overflow-x-auto pb-2">
                    {groups.map(group => (
                        <button key={group} onClick={() => setActiveGroup(group)} className={cx('px-4 py-1.5 rounded-full flex-shrink-0 transition-colors', activeGroup === group ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700')}>
                            {group === t('filterAll') ? t('filterAll') : group}
                        </button>
                    ))}
                </div>
                <ul className="space-y-3">
                    {filteredWallets.length > 0 ? (
                        filteredWallets.map(wallet => <WalletItem key={wallet.id} wallet={wallet} />)
                    ) : (
                        <li className="text-gray-500 text-center py-4">{t('notFound')}</li>
                    )}
                </ul>
            </Card>
        </div>
    );
};

export default Dashboard;
