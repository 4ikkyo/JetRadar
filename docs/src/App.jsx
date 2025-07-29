import React, { useState } from 'react';
import { AppProvider } from './context/AppProvider';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BottomNav from './components/BottomNav';
import AddWalletModal from './components/AddWalletModal';
import DeleteWalletModal from './components/DeleteWalletModal';
import MessageManager from './components/MessageManager';
import GraphTooltip from './components/GraphTooltip';

export default function App() {
    // Глобальное состояние для всплывающей подсказки графа, так как она должна быть поверх всего
    const [graphTooltipContent, setGraphTooltipContent] = useState({});
    const [graphTooltipPosition, setGraphTooltipPosition] = useState({ left: 0, top: 0 });
    const [showGraphTooltip, setShowGraphTooltip] = useState(false);

    return (
        <AppProvider>
            <div className="min-h-screen font-sans flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <Header />
                <MainContent
                    setGraphTooltipContent={setGraphTooltipContent}
                    setGraphTooltipPosition={setGraphTooltipPosition}
                    setShowGraphTooltip={setShowGraphTooltip}
                />
                <BottomNav />
                <AddWalletModal />
                <DeleteWalletModal />
                <MessageManager />
                <GraphTooltip
                    tooltipContent={graphTooltipContent}
                    tooltipPosition={graphTooltipPosition}
                    show={showGraphTooltip}
                />
            </div>
        </AppProvider>
    );
}
