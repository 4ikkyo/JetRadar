const MessageBox = ({ message }) => {
    if (!message) return null;
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-lg z-[5000] animate-fade-in-out text-sm font-medium">
            {message}
        </div>
    );
};

export default MessageBox;
