import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import MessageBox from './MessageBox';

const MessageManager = () => {
    const { message } = useContext(AppContext);
    return <MessageBox message={message} />;
};

export default MessageManager;