import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Icons } from '../lib/icons';

const Header = () => {
    const { openAddWalletModal } = useContext(AppContext);
    return (
        <header className="bg-white p-4 shadow-sm sticky top-0 z-40">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">JetRadar</h1>
                <button className="text-gray-600 hover:text-indigo-600" onClick={openAddWalletModal}>
                    {Icons.add}
                </button>
            </div>
        </header>
    );
};

export default Header;