import Card from '../../components/ui/Card';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const SettingsSection = ({ title }) => {
    const { t } = useContext(AppContext);
    return (
        <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
            <p className="text-gray-500">{t('settingsPlaceholder')}</p>
        </Card>
    );
};

export default SettingsSection;
