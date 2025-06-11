import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { cx } from '../lib/classNameHelper';

const AddWalletModal = () => {
    const { isAddModalOpen, closeAddWalletModal, addWallet, showMessage, wallets } = useContext(AppContext);
    const [address, setAddress] = useState('');
    const [alias, setAlias] = useState('');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [groupInput, setGroupInput] = useState('');

    const existingGroups = [...new Set(wallets.flatMap(w => w.groups || []))];

    const toggleGroup = (group) => {
        setSelectedGroups(prev =>
            prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
        );
    };

    const handleAddGroup = () => {
        const newGroup = groupInput.trim();
        if (newGroup && !selectedGroups.includes(newGroup)) {
            setSelectedGroups(prev => [...prev, newGroup]);
        }
        setGroupInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddGroup();
        }
    };
    
    const resetForm = () => {
        setAddress('');
        setAlias('');
        setSelectedGroups([]);
        setGroupInput('');
    }

    const handleSubmit = () => {
        if (!address.trim()) {
            showMessage("Адрес кошелька не может быть пустым.");
            return;
        }
        addWallet({ address, name: alias || 'Без метки', groups: selectedGroups });
        resetForm();
    };

    return (
        <Modal isOpen={isAddModalOpen} onClose={closeAddWalletModal} title="Добавить Кошелек">
            <div className="space-y-4">
                <div>
                    <label htmlFor="newWalletAddress" className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                    <input type="text" id="newWalletAddress" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="EQC...ABC" />
                </div>
                <div>
                    <label htmlFor="newWalletAlias" className="block text-sm font-medium text-gray-700 mb-1">Метка</label>
                    <input type="text" id="newWalletAlias" value={alias} onChange={e => setAlias(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Мой Депозит" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Группы</label>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-md min-h-[40px]">
                        {selectedGroups.length > 0 ? selectedGroups.map(group => (
                            <span key={group} className="bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                                {group}
                                <button onClick={() => toggleGroup(group)} className="ml-1.5 text-indigo-200 hover:text-white">✕</button>
                            </span>
                        )) : <p className="text-sm text-gray-400">Выберите или создайте группу...</p>}
                    </div>
                    
                    <div className="flex">
                        <input
                            type="text"
                            value={groupInput}
                            onChange={e => setGroupInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Создать новую группу..."
                        />
                        <button onClick={handleAddGroup} className="bg-indigo-500 text-white px-3 rounded-r-md hover:bg-indigo-600">
                            ↵
                        </button>
                    </div>
                
                    {existingGroups.length > 0 && <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Существующие группы:</p>
                        <div className="flex flex-wrap gap-1">
                            {existingGroups.map(group => (
                                <button 
                                    key={group} 
                                    onClick={() => toggleGroup(group)}
                                    className={cx(
                                        "px-2 py-0.5 rounded-full text-xs transition-colors",
                                        selectedGroups.includes(group) ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>}
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={closeAddWalletModal}>Отмена</Button>
                <Button variant="primary" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Modal>
    );
};

export default AddWalletModal;