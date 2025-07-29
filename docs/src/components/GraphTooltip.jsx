import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const GraphTooltip = ({ tooltipContent, tooltipPosition, show }) => {
    const { t } = useContext(AppContext);
    const leftStyle = tooltipPosition.left || '0px';
    const topStyle = tooltipPosition.top || '0px';

    return (
        <div
            id="graphTooltip"
            className={`tooltip ${show ? 'visible' : ''} dark:bg-gray-800`}
            style={{ left: leftStyle, top: topStyle, transform: 'translateX(-50%)' }}
        >
            {tooltipContent.name && <p className="font-bold text-white">{tooltipContent.name}</p>}
            {tooltipContent.balance && <p className="text-xs text-gray-300 dark:text-gray-300">{t('balanceLabel')} {tooltipContent.balance}</p>}
            {tooltipContent.groups && <p className="text-xs text-gray-300 dark:text-gray-300">{t('groupsTooltipLabel')} {tooltipContent.groups.join(', ')}</p>}
        </div>
    );
};

export default GraphTooltip;
