import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { cx } from '../../lib/classNameHelper';

const StatusIndicator = ({ status }) => {
    const statusClasses = { active: 'bg-green-500', inactive: 'bg-red-500', alert: 'bg-amber-500' };
    return <span className={cx('w-2.5 h-2.5 rounded-full inline-block mr-3 flex-shrink-0', statusClasses[status])}></span>;
};

const WalletItem = ({ wallet }) => {
    const { selectWallet } = useContext(AppContext);

    return (
        <li className="bg-gray-50 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => selectWallet(wallet)}>
            <div className="flex items-center overflow-hidden">
                <StatusIndicator status={wallet.status} />
                <div className="overflow-hidden">
                    <p className="font-medium truncate">{wallet.name}</p>
                    <p className="text-sm text-gray-500 truncate">{wallet.address}</p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
                <p className={cx("font-semibold", wallet.tokenType === 'TON' ? 'text-green-600' : 'text-blue-600')}>{wallet.balance}</p>
                <div className="flex justify-end space-x-1 mt-1">
                    {(wallet.groups && wallet.groups.length > 0) ? wallet.groups.slice(0, 2).map(g => (
                        <span key={g} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full">{g}</span>
                    )) : <span className="text-xs text-gray-400"></span>}
                </div>
            </div>
        </li>
    );
};

export default WalletItem;