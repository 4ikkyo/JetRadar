import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const DeleteWalletModal = () => {
    const { isDeleteModalOpen, closeDeleteWalletModal, deleteWallet, walletToDelete } = useContext(AppContext);
    
    return (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteWalletModal} title="Подтвердить Удаление">
            <p className="text-gray-700 mb-6">Вы уверены, что хотите удалить кошелек "<span className="font-medium">{walletToDelete?.name}</span>"?</p>
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={closeDeleteWalletModal}>Отмена</Button>
                <Button variant="danger" onClick={deleteWallet}>Удалить</Button>
            </div>
        </Modal>
    );
};

export default DeleteWalletModal;