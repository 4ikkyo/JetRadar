import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const AnalyticsSection = () => {
    return (
        <Card className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Аналитика и Обзоры</h2>
            <div>
                <h3 className="font-semibold mb-2 text-gray-700">🏆 Топ-10 Китов по балансу TON</h3>
                <ul className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <li>1. Whale #1 - 50,000 TON</li>
                    <li>2. Проект Ston.fi - 15,200 TON</li>
                    <li>3. Binance Cold Wallet - 1,234,567 TON (API Mock)</li>
                    <li className="text-gray-500">...</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold mb-2 text-gray-700">🔥 Самые активные трейдеры за 24ч</h3>
                <ul className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <li>1. TraderX - 152 транзакции</li>
                    <li>2. Jetton-Master - 98 транзакций</li>
                    <li className="text-gray-500">...</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold mb-2 text-gray-700">📈 Глобальный Граф</h3>
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400 mb-2 border border-dashed border-gray-300">
                    [Визуализация связей между биржами и фондами]
                </div>
                <Button variant="secondary" className="w-full text-sm">Построить глобальный граф</Button>
            </div>
        </Card>
    );
};

export default AnalyticsSection;