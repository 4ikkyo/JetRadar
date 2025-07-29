import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../../lib/icons';

const WalletInfo = () => {
    const { selectedWallet, showMessage, openDeleteWalletModal, t } = useContext(AppContext);

    if (!selectedWallet) return null;

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(selectedWallet.address);
            showMessage(t('addressCopied'));
        } catch {
            showMessage(t('copyFailed'));
        }
    };

    return (
        <>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedWallet.name}</h2>
                    <p className="text-sm text-gray-500 flex items-center">
                        <span className="truncate max-w-[200px] sm:max-w-xs">{selectedWallet.address}</span>
                        <button onClick={copyAddress} className="ml-2 text-indigo-500 hover:text-indigo-700 flex-shrink-0">{Icons.copy}</button>
                    </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                    <span className="text-lg font-bold text-green-600">{selectedWallet.balance}</span>
                </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 mb-4">
                {(selectedWallet.groups && selectedWallet.groups.length > 0) ? selectedWallet.groups.map(g => (
                    <span key={g} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{g}</span>
                )) : <span className="text-xs text-gray-400 italic">{t('noGroups')}</span>}
            </div>

            <div className="flex items-center space-x-2">
                <button className="text-indigo-600 text-sm font-medium" onClick={() => showMessage(t('editFeatureWIP'))}>{t('edit')}</button>
                <button className="bg-red-100 text-red-700 text-sm font-medium px-3 py-0.5 rounded-full hover:bg-red-200" onClick={() => openDeleteWalletModal(selectedWallet)}>{t('delete')}</button>
            </div>
        </>
    );
};

export default WalletInfo;
