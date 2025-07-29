import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Icons } from '../lib/icons';

const Header = () => {
    const { openAddWalletModal, toggleTheme, theme, language, changeLanguage, showMessage, t } = useContext(AppContext);

    const handleToggleTheme = () => {
        toggleTheme();
        showMessage(theme === 'dark' ? t('lightModeOn') : t('darkModeOn'));
    };
    return (
        <header className="bg-white dark:bg-gray-800 p-4 shadow-sm sticky top-0 z-40">
            <div className="flex justify-between items-center space-x-2">
                <h1 className="text-xl font-bold">JetRadar</h1>
                <div className="flex items-center space-x-2">
                    <select value={language} onChange={e => changeLanguage(e.target.value)} className="border border-gray-300 dark:border-gray-700 rounded-md text-sm py-1 px-2">
                        <option value="ru">RU</option>
                        <option value="uk">UK</option>
                        <option value="en">EN</option>
                    </select>
                    <button className="text-gray-600 dark:text-gray-300" onClick={handleToggleTheme} aria-label="Toggle theme">
                        {theme === 'dark' ? Icons.sun : Icons.moon}
                    </button>
                    <button className="text-gray-600 hover:text-indigo-600" onClick={openAddWalletModal}>
                        {Icons.add}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
