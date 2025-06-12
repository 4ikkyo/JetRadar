import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Icons } from '../../lib/icons';

const AIAnalysis = () => {
    const { t } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');

    const getAIResponse = async (type) => {
        setIsLoading(true);
        setAnalysis('');
        setError('');

        // Здесь могла бы быть логика запроса к AI

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (type === 'risk') {
                setAnalysis(t('riskAssessment'));
            } else {
                setAnalysis(t('profileAssessment'));
            }
        } catch (err) {
            setError(`${t('error')}: ${err.message || t('aiResponseFailed')}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-gray-50">
            <h3 className="text-md font-semibold text-gray-800 mb-3">{t('aiAnalysisTitle')}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <Button variant="secondary" onClick={() => getAIResponse('profile')}>{t('determineProfile')}</Button>
                <Button variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100" onClick={() => getAIResponse('risk')}>{t('assessRisk')}</Button>
            </div>
            {isLoading && <div className="text-center text-gray-500 pt-3 flex items-center justify-center space-x-2">{Icons.spinner} <span>{t('analyzing')}</span></div>}
            {analysis && <div className="text-gray-700 text-sm leading-relaxed mt-3 p-2 bg-indigo-50 rounded-lg">{analysis}</div>}
            {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        </Card>
    );
};

export default AIAnalysis;
