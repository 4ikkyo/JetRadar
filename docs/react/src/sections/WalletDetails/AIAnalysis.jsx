import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Icons } from '../../lib/icons';

const AIAnalysis = () => {
    const { showMessage, selectedWallet, transactions } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');

    const getAIResponse = async (type) => {
        setIsLoading(true);
        setAnalysis('');
        setError('');

        const walletTransactions = selectedWallet ? (transactions[selectedWallet.address] || []) : [];
        const transactionsText = walletTransactions.map(tx =>
            `${tx.type === 'in' ? 'Получено' : 'Отправлено'} ${tx.amount} ${tx.token} ${tx.type === 'in' ? 'от' : 'на адрес'} ${tx.counterparty} (${tx.date})`
        ).join('\n');

        // ... (Здесь могла бы быть логика запроса к AI)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (type === 'risk') {
                setAnalysis('Оценка рисков: кошелек не взаимодействовал с известными скам-адресами. Большинство транзакций проходят с кошельками из вашего Watchlist. Риск оценивается как низкий.');
            } else {
                setAnalysis('Профиль кошелька: это активный кошелек, используемый для частых, но небольших переводов. Вероятно, используется как операционный кошелек, а не для долгосрочного хранения.');
            }
        } catch (err) {
            setError(`Ошибка: ${err.message || 'Не удалось получить ответ от AI.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-gray-50">
            <h3 className="text-md font-semibold text-gray-800 mb-3">AI-Анализ ✨</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <Button variant="secondary" onClick={() => getAIResponse('profile')}>Определить профиль</Button>
                <Button variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100" onClick={() => getAIResponse('risk')}>Оценить риски</Button>
            </div>
            {isLoading && <div className="text-center text-gray-500 pt-3 flex items-center justify-center space-x-2">{Icons.spinner} <span>Анализируем...</span></div>}
            {analysis && <div className="text-gray-700 text-sm leading-relaxed mt-3 p-2 bg-indigo-50 rounded-lg">{analysis}</div>}
            {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        </Card>
    );
};

export default AIAnalysis;