import { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import D3Graph from './D3Graph';
import { Icons } from '../../lib/icons';
import { cx } from '../../lib/classNameHelper';

const GraphSection = ({ setTooltipContent, setTooltipPosition, setShowTooltip }) => {
    const { wallets, transactions, selectWallet, showMessage, t } = useContext(AppContext);
    const [graphData, setGraphData] = useState(null);
    const [selectedWalletIds, setSelectedWalletIds] = useState([]);
    const [depth, setDepth] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [graphFilterType, setGraphFilterType] = useState('all');
    const [walletSelectionFilter, setWalletSelectionFilter] = useState('Все');
    const [walletSelectionSort, setWalletSelectionSort] = useState('name');

    const availableGroups = ['Все', 'TON', 'Jetton', ...new Set(wallets.flatMap(w => w.groups).filter(Boolean))].filter(Boolean);

    const getFilteredAndSortedWalletsForSelection = useCallback(() => {
        let currentWallets = [...wallets];

        if (walletSelectionFilter !== 'Все') {
            if (walletSelectionFilter === 'TON') {
                currentWallets = currentWallets.filter(w => w.tokenType === 'TON');
            } else if (walletSelectionFilter === 'Jetton') {
                currentWallets = currentWallets.filter(w => w.tokenType === 'Jetton');
            } else {
                currentWallets = currentWallets.filter(w => w.groups.includes(walletSelectionFilter));
            }
        }

        if (walletSelectionSort === 'name') {
            currentWallets.sort((a, b) => a.name.localeCompare(b.name));
        } else if (walletSelectionSort === 'balance') {
            currentWallets.sort((a, b) => b.tonValue - a.tonValue);
        }
        return currentWallets;
    }, [wallets, walletSelectionFilter, walletSelectionSort]);

    const handleSelectAll = () => {
        setSelectedWalletIds(getFilteredAndSortedWalletsForSelection().map(w => w.id));
    };

    const handleDeselectAll = () => {
        setSelectedWalletIds([]);
    };

    const handleWalletCheckboxChange = (walletId) => {
        setSelectedWalletIds(prev =>
            prev.includes(walletId) ? prev.filter(id => id !== walletId) : [...prev, walletId]
        );
    };

    const buildGraph = () => {
        if (selectedWalletIds.length === 0) {
            showMessage('Выберите хотя бы один кошелек для построения графа');
            setGraphData(null);
            return;
        }
        setIsLoading(true);
        setGraphData(null);

        setTimeout(() => {
            const nodesMap = new Map();
            const links = new Set();
            let queue = [...selectedWalletIds];
            const visited = new Set();

            for (let d = 0; d < depth; d++) {
                if (queue.length === 0) break;
                let nextQueue = [];
                queue.forEach(walletId => {
                    if (visited.has(walletId)) return;
                    visited.add(walletId);

                    const wallet = wallets.find(w => w.id === walletId);
                    if (wallet && (graphFilterType === 'all' || wallet.tokenType === graphFilterType)) {
                        if (!nodesMap.has(wallet.id)) nodesMap.set(wallet.id, { ...wallet });

                        const walletTxs = transactions[walletId] || [];
                        walletTxs.forEach(tx => {
                            const counterpartyWallet = wallets.find(w => w.address === tx.counterparty);
                            if (!counterpartyWallet) return;
                            
                            const sourceWallet = tx.type === 'out' ? wallet : counterpartyWallet;
                            const targetWallet = tx.type === 'in' ? wallet : counterpartyWallet;

                            if (graphFilterType === 'all' || (sourceWallet.tokenType === graphFilterType && targetWallet.tokenType === graphFilterType)) {
                                if (!nodesMap.has(sourceWallet.id)) nodesMap.set(sourceWallet.id, { ...sourceWallet });
                                if (!nodesMap.has(targetWallet.id)) nodesMap.set(targetWallet.id, { ...targetWallet });

                                links.add(JSON.stringify({ source: sourceWallet.id, target: targetWallet.id, value: parseFloat(tx.amount) }));
                                
                                if (d < depth - 1) {
                                    if (!visited.has(counterpartyWallet.id)) {
                                        nextQueue.push(counterpartyWallet.id);
                                    }
                                }
                            }
                        });
                    }
                });
                queue = [...new Set(nextQueue)];
            }
            
            const finalNodes = Array.from(nodesMap.values());
            const finalLinks = Array.from(links).map(l => JSON.parse(l));

            setGraphData({ nodes: finalNodes, links: finalLinks });
            setIsLoading(false);
            if (finalNodes.length > 0) {
                showMessage('Граф построен!');
            } else {
                showMessage('Не найдено связей по заданным критериям.');
            }
        }, 1000);
    };

    return (
        <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('graphTitle')}</h2>

            <div className="p-3 bg-gray-50 rounded-lg space-y-4">
                <h3 className="text-md font-semibold text-gray-800">1. {t('walletSelection')}</h3>
                <div className="flex justify-between items-center mb-3">
                    <Button variant="secondary" className="text-xs" onClick={handleSelectAll}>{t('selectAll')}</Button>
                    <Button variant="secondary" className="text-xs" onClick={handleDeselectAll}>{t('deselectAll')}</Button>
                    <Select value={walletSelectionSort} onChange={(e) => setWalletSelectionSort(e.target.value)} className="ml-2">
                        <option value="name">{t('sortByName')}</option>
                        <option value="balance">{t('sortByBalance')}</option>
                    </Select>
                </div>
                <div className="flex space-x-2 mb-4 text-sm overflow-x-auto pb-2">
                    {availableGroups.map(filter => (
                        <button key={filter} onClick={() => setWalletSelectionFilter(filter)} className={cx('px-4 py-1.5 rounded-full flex-shrink-0 transition-colors', walletSelectionFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700')}>
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2">
                    {getFilteredAndSortedWalletsForSelection().map(wallet => (
                        <div key={wallet.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`cb-${wallet.id}`}
                                checked={selectedWalletIds.includes(wallet.id)}
                                onChange={() => handleWalletCheckboxChange(wallet.id)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`cb-${wallet.id}`} className="ml-2 text-sm text-gray-700 truncate">{wallet.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <h3 className="text-md font-semibold text-gray-800">2. {t('graphSettings')}</h3>
                <Select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
                    <option value="1">{t('depth1')}</option>
                    <option value="2">{t('depth2')}</option>
                    <option value="3">{t('depth3')}</option>
                </Select>
                <div className="flex space-x-2 mt-3 text-sm">
                    <button onClick={() => setGraphFilterType('all')} className={cx('px-3 py-1 rounded-full', graphFilterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200')}>{t('allWallets')}</button>
                    <button onClick={() => setGraphFilterType('TON')} className={cx('px-3 py-1 rounded-full', graphFilterType === 'TON' ? 'bg-indigo-600 text-white' : 'bg-gray-200')}>{t('onlyTon')}</button>
                    <button onClick={() => setGraphFilterType('Jetton')} className={cx('px-3 py-1 rounded-full', graphFilterType === 'Jetton' ? 'bg-indigo-600 text-white' : 'bg-gray-200')}>{t('onlyJetton')}</button>
                </div>
            </div>

            <Button onClick={buildGraph} className="w-full" disabled={isLoading || selectedWalletIds.length === 0}>
                {isLoading ? <>{Icons.spinner} <span>{t('dataLoading')}</span></> : t('buildGraph')}
            </Button>

            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">{t('legendTitle')}</h4>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-indigo-600 mr-2"></span>
                        <span>{t('tonWallet')}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                        <span>{t('jettonWallet')}</span>
                    </div>
                </div>
            </div>

            {(graphData && !isLoading) ? (
                <D3Graph
                    graphData={graphData}
                    onNodeClick={selectWallet}
                    setTooltipContent={setTooltipContent}
                    setTooltipPosition={setTooltipPosition}
                    setShowTooltip={setShowTooltip}
                />
            ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                    {isLoading ? <>{Icons.spinner} <span className="ml-2 text-gray-500">{t('dataLoading')}</span></> : <p className="text-gray-500 text-center p-4">{t('graphHint')}</p>}
                </div>
            )}
        </Card>
    );
};

export default GraphSection;
