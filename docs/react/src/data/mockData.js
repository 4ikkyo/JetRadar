export const mockWallets = [
    { id: "EQC...ABC", name: "Мой Основной Кошелек", address: "EQC...ABC", balance: "123.45 TON", tonValue: 123.45, groups: ["Личные"], tokenType: "TON", status: "active" },
    { id: "EQB...XYZ", name: "Кошелек Команды", address: "EQB...XYZ", balance: "56.78 TON", tonValue: 56.78, groups: ["Команда", "Работа"], tokenType: "TON", status: "active" },
    { id: "EQA...DEF", name: "Биржа (Huobi)", address: "EQA...DEF", balance: "8.91 TON", tonValue: 8.91, groups: ["Биржи"], tokenType: "TON", status: "inactive" },
    { id: "EQC...LMN", name: "Мой Jetton (Fish)", address: "EQC...LMN", balance: "1234.56 FISH", tonValue: 25.3, groups: ["DeFi", "Личные"], tokenType: "Jetton", status: "alert" },
    { id: "EQD...WHALE", name: "Кит #1", address: "EQD...WHALE", balance: "50,000 TON", tonValue: 50000, groups: ["Киты", "Анализ"], tokenType: "TON", status: "active" },
    { id: "EQE...NFT", name: "Кошелек NFT", address: "EQE...NFT", balance: "0.1 TON", tonValue: 0.1, groups: ["Коллекции"], tokenType: "TON", status: "active" },
    { id: "EQF...GHI", name: "Проект Ston.fi", address: "EQF...GHI", balance: "15,200 TON", tonValue: 15200, groups: ["DeFi", "Анализ"], tokenType: "TON", status: "active" },
    { id: "EQG...JKL", name: "Скам-кошелек", address: "EQG...JKL", balance: "0.001 TON", tonValue: 0.001, groups: ["Риск"], tokenType: "TON", status: "inactive" },
];

export const mockTransactionsData = {
    "EQC...ABC": [
        { type: 'in', amount: '10.5', token: 'TON', counterparty: 'EQB...XYZ', date: '2024-06-01 14:30', hash: 'TX123...', description: 'Входящий перевод TON от Кошелька Команды. Возможно, выплата зарплаты или возврат долга.' },
        { type: 'out', amount: '2.0', token: 'TON', counterparty: 'EQD...WHALE', date: '2024-05-28 10:00', hash: 'TX124...', description: 'Исходящий перевод TON на кошелек известного кита. Возможно, участие в крупной сделке.' },
    ],
    "EQB...XYZ": [
        { type: 'in', amount: '5.0', token: 'TON', counterparty: 'EQC...ABC', date: '2024-06-01 11:00', hash: 'TX128...', description: 'Входящий перевод от "Мой Основной".' },
        { type: 'out', amount: '15.0', token: 'TON', counterparty: 'EQF...GHI', date: '2024-05-30 16:30', hash: 'TX129...', description: 'Перевод на кошелек проекта Ston.fi. Вероятно, инвестиции или оплата услуг.' },
    ],
    "EQD...WHALE": [
        { type: 'in', amount: '2.0', token: 'TON', counterparty: 'EQC...ABC', date: '2024-05-28 10:00', hash: 'TX124...', description: 'Получение средств от "Мой Основной".' },
        { type: 'out', amount: '10000', token: 'TON', counterparty: 'EQA...DEF', date: '2024-05-27 12:00', hash: 'TX555...', description: 'Крупный вывод средств на биржу Huobi.' },
    ],
    "EQF...GHI": [
        { type: 'in', amount: '15.0', token: 'TON', counterparty: 'EQB...XYZ', date: '2024-05-30 16:30', hash: 'TX129...', description: 'Получение средств от "Кошелек Команды".' },
    ],
};

export const mockNotifications = [
    { id: 1, type: 'success', text: 'Кошелек "Кит #1" был успешно добавлен в ваш Watchlist.', time: '5 минут назад' },
    { id: 2, type: 'warning', text: 'Обнаружена подозрительная активность на кошельке "Скам-кошелек".', time: '1 час назад' },
    { id: 3, type: 'info', text: 'Баланс кошелька "Мой Основной" обновлен.', time: '3 часа назад' },
];