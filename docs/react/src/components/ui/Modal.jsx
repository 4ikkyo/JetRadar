const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-md m-4 animate-slide-up">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};

export default Modal;