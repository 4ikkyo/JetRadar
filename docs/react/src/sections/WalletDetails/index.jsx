import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Icons } from "../../lib/icons";
import WalletInfo from "./WalletInfo";
import AIAnalysis from "./AIAnalysis";
import TransactionSection from "./TransactionSection";


const WalletDetails = () => {
    const { selectedWallet, navigateTo } = useContext(AppContext);

    if (!selectedWallet) {
        return (
            <div className="text-center p-8">
                <p>Кошелек не выбран.</p>
                <Button onClick={() => navigateTo('dashboard')} className="mt-4">Вернуться к списку</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <button onClick={() => navigateTo('dashboard')} className="text-indigo-600 mb-4 flex items-center space-x-1 font-medium -ml-1">
                    {Icons.back}<span>Назад</span>
                </button>
                <WalletInfo />
            </Card>
            <AIAnalysis />
            <TransactionSection />
        </div>
    );
};

export default WalletDetails;
