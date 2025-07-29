import { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import D3Graph from './D3Graph';
import { Icons, Icon } from '../../lib/icons';
import { cx } from '../../lib/classNameHelper';
import PropTypes from 'prop-types'; // Добавляем PropTypes

const GraphSection = ({ setTooltipContent, setTooltipPosition, setShowTooltip }) => {
    const { wallets, transactions, selectWallet, showMessage, t } = useContext(AppContext);

    const handleNodeClick = useCallback((node) => {
        selectWallet(node);
        // Здесь можно дополнительно показывать детали кошелька в модальном окне/сайдбаре
    }, [selectWallet]);

    const [graphData, setGraphData] = useState(null);
    const [selectedWalletIds, setSelectedWalletIds] = useState([]);
    const [depth, setDepth] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [graphFilterType, setGraphFilterType] = useState('all'); // Тип фильтра для построения графа
    const filterAllLabel = t('filterAll');
    const [walletSelectionFilter, setWalletSelectionFilter] = useState(filterAllLabel); // Фильтр для списка выбора кошельков
    const [walletSelectionSort, setWalletSelectionSort] = useState('name');

    // Новые состояния для поиска и фильтрации, которые будут переданы в D3Graph
    const [searchTerm, setSearchTerm] = useState('');
    const [tokenFilter, setTokenFilter] = useState(''); // '' для всех, 'TON', 'Jetton', 'ETH' и т.д.

    // availableGroups включает 'Все', 'TON', 'Jetton' и группы из кошельков
    const availableGroups = [filterAllLabel, 'TON', 'Jetton', ...new Set(wallets.flatMap(w => w.groups).filter(Boolean))].filter(Boolean);

    // Функция для получения отфильтрованных и отсортированных кошельков для отображения в списке выбора
    const getFilteredAndSortedWalletsForSelection = useCallback(() => {
        let currentWallets = [...wallets];

        if (walletSelectionFilter !== filterAllLabel) {
            if (walletSelectionFilter === 'TON') {
                currentWallets = currentWallets.filter(w => w.tokenType === 'TON');
            } else if (walletSelectionFilter === 'Jetton') {
                currentWallets = currentWallets.filter(w => w.tokenType === 'Jetton');
            } else {
                currentWallets = currentWallets.filter(w => w.groups && w.groups.includes(walletSelectionFilter));
            }
        }

        if (walletSelectionSort === 'name') {
            currentWallets.sort((a, b) => a.name.localeCompare(b.name));
        } else if (walletSelectionSort === 'balance') {
            currentWallets.sort((a, b) => b.tonValue - a.tonValue);
        }
        return currentWallets;
    }, [wallets, walletSelectionFilter, walletSelectionSort, filterAllLabel]);

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

    // Функция для построения графа
    const buildGraph = () => {
        if (selectedWalletIds.length === 0) {
            showMessage(t('selectWalletsForGraph'));
            setGraphData(null);
            return;
        }
        setIsLoading(true);
        setGraphData(null); // Очистить предыдущие данные графа перед загрузкой

        setTimeout(() => { // Имитация асинхронной загрузки данных
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

                            // Убедитесь, что токены соответствуют фильтру графа, если он применен
                            if (graphFilterType === 'all' || (sourceWallet.tokenType === graphFilterType && targetWallet.tokenType === graphFilterType)) {
                                if (!nodesMap.has(sourceWallet.id)) nodesMap.set(sourceWallet.id, { ...sourceWallet });
                                if (!nodesMap.has(targetWallet.id)) nodesMap.set(targetWallet.id, { ...targetWallet });

                                // Сохраняем связи как объекты с id, а не полными объектами узлов,
                                // D3.forceLink будет разрешать их по id. Добавляем value для ширины линии.
                                links.add(JSON.stringify({
                                    source: sourceWallet.id,
                                    target: targetWallet.id,
                                    value: parseFloat(tx.amount), // Используем сумму как 'value'
                                    description: tx.description // Дополнительная информация для тултипа связи
                                }));

                                if (d < depth - 1) { // Проверяем глубину для добавления в следующую очередь
                                    if (!visited.has(counterpartyWallet.id)) {
                                        nextQueue.push(counterpartyWallet.id);
                                    }
                                }
                            }
                        });
                    }
                });
                queue = [...new Set(nextQueue)]; // Удаляем дубликаты из следующей очереди
            }

            const finalNodes = Array.from(nodesMap.values());
            const finalLinks = Array.from(links).map(l => JSON.parse(l));

            setGraphData({ nodes: finalNodes, links: finalLinks });
            setIsLoading(false);
            if (finalNodes.length > 0) {
                showMessage(t('graphBuilt'));
            } else {
                showMessage(t('noConnectionsFound'));
            }
        }, 1000); // Задержка для имитации загрузки
    };

    // Определение доступных типов токенов для фильтра
    const availableTokenTypes = Array.from(new Set(wallets.map(w => w.tokenType))).filter(Boolean);

    return (
        <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('graphTitle')}</h2>

            {/* Блок выбора кошельков */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">1. {t('walletSelection')}</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
                    <div className="flex gap-2">
                        <Button variant="secondary" className="text-xs" onClick={handleSelectAll}>{t('selectAll')}</Button>
                        <Button variant="secondary" className="text-xs" onClick={handleDeselectAll}>{t('deselectAll')}</Button>
                    </div>
                    <Select value={walletSelectionSort} onChange={(e) => setWalletSelectionSort(e.target.value)} className="w-full sm:w-auto">
                        <option value="name">{t('sortByName')}</option>
                        <option value="balance">{t('sortByBalance')}</option>
                    </Select>
                </div>
                <div className="flex space-x-2 mb-4 text-sm overflow-x-auto pb-2 scrollbar-hide"> {/* scrollbar-hide для скрытия скроллбара */}
                    {availableGroups.map(filter => (
                        <button key={filter} onClick={() => setWalletSelectionFilter(filter)} className={cx('px-4 py-1.5 rounded-full flex-shrink-0 transition-colors', walletSelectionFilter === filter ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200')}>
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2">
                    {getFilteredAndSortedWalletsForSelection().map(wallet => (
                        <div key={wallet.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`cb-${wallet.id}`}
                                checked={selectedWalletIds.includes(wallet.id)}
                                onChange={() => handleWalletCheckboxChange(wallet.id)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`cb-${wallet.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-200 truncate">{wallet.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Блок настроек графа */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">2. {t('graphSettings')}</h3>
                <label htmlFor="depth-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">{t('graphDepth')}:</label>
                <Select id="depth-select" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
                    <option value="1">{t('depth1')}</option>
                    <option value="2">{t('depth2')}</option>
                    <option value="3">{t('depth3')}</option>
                </Select>
                <div className="flex flex-wrap gap-2 mt-3 text-sm">
                    <button onClick={() => setGraphFilterType('all')} className={cx('px-3 py-1 rounded-full', graphFilterType === 'all' ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-800 dark:text-gray-200')}>{t('allWallets')}</button>
                    {availableTokenTypes.map(type => (
                        <button key={type} onClick={() => setGraphFilterType(type)} className={cx('px-3 py-1 rounded-full', graphFilterType === type ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-800 dark:text-gray-200')}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <Button onClick={buildGraph} className="w-full" disabled={isLoading || selectedWalletIds.length === 0}>
                {isLoading ? <><Icon icon={Icons.spinner} className="animate-spin mr-2" /> <span>{t('dataLoading')}</span></> : t('buildGraph')}
            </Button>

            {/* Добавлены поля поиска и фильтрации для D3Graph */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">3. {t('graphDisplayFilters')}</h3>
                <input
                    type="text"
                    placeholder={t('searchWalletsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                />
                <Select value={tokenFilter} onChange={(e) => setTokenFilter(e.target.value)} className="w-full">
                    <option value="">{t('allTokenTypes')}</option>
                    {availableTokenTypes.map(type => (
                        <option key={`display-${type}`} value={type}>{type}</option>
                    ))}
                </Select>
            </div>


            {/* Легенда */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-200">
                <h4 className="font-semibold mb-2">{t('legendTitle')}</h4>
                <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                    <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-indigo-600 mr-2"></span>
                        <span>{t('tonWallet')}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                        <span>{t('jettonWallet')}</span>
                    </div>
                    {/* Добавьте легенду для других типов токенов, если они есть и окрашены по-разному */}
                    <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span>ETH (пример)</span> {/* Пример для других токенов */}
                    </div>
                </div>
                <div className="flex items-center space-x-4 flex-wrap gap-y-2 mt-2">
                    <div className="flex items-center">
                        <span className="inline-block h-1 w-6 bg-blue-500 mr-2"></span>
                        <span>{t('highlightedNode')}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="inline-block h-1 w-6 bg-green-500 mr-2"></span>
                        <span>{t('highlightedLink')}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="inline-block h-1 w-6 bg-gray-400 opacity-30 mr-2"></span>
                        <span>{t('dimmedElements')}</span>
                    </div>
                </div>
            </div>

            {/* Отображение D3Graph или сообщения о загрузке/отсутствии данных */}
            {(graphData && !isLoading) ? (
                <D3Graph
                    graphData={graphData}
                    onNodeClick={handleNodeClick}
                    setTooltipContent={setTooltipContent}
                    setTooltipPosition={setTooltipPosition}
                    setShowTooltip={setShowTooltip}
                    searchTerm={searchTerm}
                    tokenFilter={tokenFilter} // Передаем фильтры в D3Graph
                />
            ) : (
                <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    {isLoading ? <><Icon icon={Icons.spinner} className="animate-spin" /> <span className="ml-2 text-gray-500">{t('dataLoading')}</span></> : <p className="text-gray-500 text-center p-4">{t('graphHint')}</p>}
                </div>
            )}
        </Card>
    );
};

// Определение PropTypes для GraphSection
GraphSection.propTypes = {
    setTooltipContent: PropTypes.func.isRequired,
    setTooltipPosition: PropTypes.func.isRequired,
    setShowTooltip: PropTypes.func.isRequired,
};

export default GraphSection;
