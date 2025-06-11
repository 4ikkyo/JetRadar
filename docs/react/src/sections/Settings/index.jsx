import Card from '../../components/ui/Card';

const SettingsSection = ({ title }) => (
    <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-500">Этот раздел находится в разработке.</p>
    </Card>
);

export default SettingsSection;