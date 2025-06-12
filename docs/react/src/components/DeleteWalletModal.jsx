import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const DeleteWalletModal = () => {
    const { isDeleteModalOpen, closeDeleteWalletModal, deleteWallet, walletToDelete, t } = useContext(AppContext);
    
    return (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteWalletModal} title={t('confirmDeleteTitle')}>
            <p className="text-gray-700 mb-6">{t('confirmDeleteMessage').replace('{name}', walletToDelete?.name || '')}</p>
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={closeDeleteWalletModal}>{t('cancel')}</Button>
                <Button variant="danger" onClick={deleteWallet}>{t('delete')}</Button>
            </div>
        </Modal>
    );
};

export default DeleteWalletModal;
