import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import { Icons, Icon } from '../../lib/icons';
import { cx } from '../../lib/classNameHelper';

const TransactionSection = () => {
    const { selectedWallet, transactions, selectWallet, t } = useContext(AppContext);
    const [txFilter, setTxFilter] = useState('all');
    const [explanation, setExplanation] = useState(null);
    const [explanationLoading, setExplanationLoading] = useState(false);
    const [explanationError, setExplanationError] = useState('');

    if (!selectedWallet) return null;

    const walletTransactions = transactions[selectedWallet.address] || [];
    const filteredTransactions = walletTransactions.filter(tx => txFilter === 'all' || tx.type === txFilter);

    const explainTransaction = async (tx) => {
        setExplanationLoading(true);
        setExplanation({ hash: tx.hash, text: t('gettingExplanation') });
        setExplanationError('');

        try {
            await new Promise(r => setTimeout(r, 1500));
            setExplanation({ hash: tx.hash, text: tx.description || t('explanationNotFound') });
        } catch (err) {
            setExplanationError(`${t('error')}: ${err.message || t('explanationFailed')}`);
        } finally {
            setExplanationLoading(false);
        }
    };

    const handleCounterpartyClick = (address) => {
        selectWallet({ address: address });
    };

    return (
        <Card>
            <h3 className="text-md font-semibold text-gray-800 mb-3">{t('recentTransactions')}</h3>
            <div className="flex space-x-2 mb-3 text-sm">
                <button onClick={() => setTxFilter('all')} className={cx('px-3 py-1 rounded-full', txFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200')}>{t('filterAll')}</button>
                <button onClick={() => setTxFilter('in')} className={cx('px-3 py-1 rounded-full', txFilter === 'in' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200')}>{t('filterIn')}</button>
                <button onClick={() => setTxFilter('out')} className={cx('px-3 py-1 rounded-full', txFilter === 'out' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200')}>{t('filterOut')}</button>
            </div>
            <ul className="space-y-2">
                {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                    <li key={tx.hash} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                {tx.type === 'in' ? Icons.txIn : Icons.txOut}
                                <div className="ml-2">
                                    <p className={cx("font-semibold", tx.type === 'in' ? 'text-green-700' : 'text-red-700')}>
                                        {tx.type === 'in' ? '+' : '-'}{tx.amount} {tx.token}
                                    </p>
                                    <p className="text-gray-500">
                                        {tx.type === 'in' ? t('fromLabel') : t('toLabel')}:
                                        <button onClick={() => handleCounterpartyClick(tx.counterparty)} className="text-indigo-600 hover:underline ml-1">
                                            {tx.counterparty.substring(0, 10)}...
                                        </button>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-gray-500 text-xs">{tx.date}</span>
                                <button onClick={() => explainTransaction(tx)} className="text-indigo-500 hover:text-indigo-700 text-xs font-bold mt-1 block">{t('explain')}</button>
                            </div>
                        </div>
                        {(explanation?.hash === tx.hash && explanation.text) && (
                            <div className="text-indigo-800 text-xs bg-indigo-100 p-2 rounded-md border border-indigo-200">
                                {explanationLoading ? (<div className="text-center text-gray-500 flex items-center justify-center space-x-1"><Icon icon={Icons.spinner} className="w-3 h-3"/> <span>{t('loading')}</span></div>) : explanation.text}
                                {explanationError && <div className="text-red-600">{explanationError}</div>}
                            </div>
                        )}
                    </li>
                )) : <li className="text-center text-gray-500 py-2">{t('noTransactions')}</li>}
            </ul>
        </Card>
    );
};

export default TransactionSection;
