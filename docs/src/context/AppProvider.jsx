import React, { useState, useEffect } from 'react';
import { AppContext } from './AppContext';
import { mockWallets, mockTransactionsData, mockNotifications } from '../data/mockData';
import { translate } from '../lib/i18n';

export const AppProvider = ({ children }) => {
    const [wallets, setWallets] = useState(mockWallets);
    const [transactions, setTransactions] = useState(mockTransactionsData);
    const [notifications, setNotifications] = useState(mockNotifications);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [walletToDelete, setWalletToDelete] = useState(null);
    const [message, setMessage] = useState('');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'ru');

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 2500);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.lang = language;
        localStorage.setItem('lang', language);
    }, [language]);

    const showMessage = (msg) => setMessage(msg);

    const addNotification = (type, text) => {
        const newNotif = {
            id: Date.now(),
            type,
            text,
            time: t('justNow'),
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const clearNotifications = () => {
        setNotifications([]);
        showMessage(t('notificationsCleared'));
    };

    const navigateTo = (section) => {
        setActiveSection(section);
        if (section !== 'walletDetails') {
            setSelectedWallet(null);
        }
    };

    const selectWallet = (wallet) => {
        const fullWallet = wallets.find(w => w.address === wallet.address || w.id === wallet.id);
        if(fullWallet){
            setSelectedWallet(fullWallet);
            navigateTo('walletDetails');
            return true;
        }
        showMessage(t('walletNotFound').replace('{address}', wallet.address.substring(0,10)));
        return false;
    };

    const openAddWalletModal = () => setAddModalOpen(true);
    const closeAddWalletModal = () => setAddModalOpen(false);

    const addWallet = (walletData) => {
        const newWallet = {
            id: walletData.address,
            name: walletData.name,
            address: walletData.address,
            balance: `${(Math.random() * 100).toFixed(2)} TON`,
            tonValue: Math.random() * 100,
            groups: walletData.groups,
            tokenType: 'TON',
            status: 'active'
        };
        setWallets(prev => [...prev, newWallet]);
        setTransactions(prev => ({
            ...prev,
            [newWallet.address]: [
                 { type: 'in', amount: (Math.random() * 50).toFixed(2), token: newWallet.tokenType, counterparty: 'Новый Источник', date: new Date().toLocaleString('ru-RU'), hash: 'TX_NEW_IN_' + Math.random().toString(36).substring(7), description: 'Имитация входящей транзакции для нового кошелька.' },
                 { type: 'out', amount: (Math.random() * 10).toFixed(2), token: newWallet.tokenType, counterparty: 'Новый Получатель', date: new Date().toLocaleString('ru-RU'), hash: 'TX_NEW_OUT_' + Math.random().toString(36).substring(7), description: 'Имитация исходящей транзакции для нового кошелька.' }
            ]
        }));
        addNotification('success', t('walletAddedNotif').replace('{name}', newWallet.name));
        closeAddWalletModal();
        showMessage(t('walletAddedMessage'));
    };

    const openDeleteWalletModal = (wallet) => {
        setWalletToDelete(wallet);
        setDeleteModalOpen(true);
    };

    const closeDeleteWalletModal = () => {
        setWalletToDelete(null);
        setDeleteModalOpen(false);
    };

    const deleteWallet = () => {
        if(walletToDelete) {
            setWallets(prev => prev.filter(w => w.id !== walletToDelete.id));
            setTransactions(prev => {
                const newTrans = {...prev}; delete newTrans[walletToDelete.id]; return newTrans;
            });
            addNotification('warning', t('walletDeletedNotif').replace('{name}', walletToDelete.name));
            navigateTo('dashboard');
            closeDeleteWalletModal();
            showMessage(t('walletDeletedMessage'));
        }
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const changeLanguage = (lang) => setLanguage(lang);
    const t = (key) => translate(language, key);

    const value = {
        wallets, transactions, activeSection, selectedWallet, isAddModalOpen,
        isDeleteModalOpen, walletToDelete, navigateTo, selectWallet, openAddWalletModal,
        closeAddWalletModal, addWallet, openDeleteWalletModal, closeDeleteWalletModal,
        deleteWallet, showMessage, notifications, addNotification, clearNotifications,
        theme, toggleTheme, language, changeLanguage, t,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

