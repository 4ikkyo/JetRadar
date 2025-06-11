const GraphTooltip = ({ tooltipContent, tooltipPosition, show }) => {
    const leftStyle = tooltipPosition.left || '0px';
    const topStyle = tooltipPosition.top || '0px';

    return (
        <div
            id="graphTooltip"
            className={`tooltip ${show ? 'visible' : ''}`}
            style={{ left: leftStyle, top: topStyle, transform: 'translateX(-50%)' }}
        >
            {tooltipContent.name && <p className="font-bold">{tooltipContent.name}</p>}
            {tooltipContent.balance && <p className="text-xs text-gray-300">Баланс: {tooltipContent.balance}</p>}
            {tooltipContent.groups && <p className="text-xs text-gray-300">Группы: {tooltipContent.groups.join(', ')}</p>}
        </div>
    );
};

export default GraphTooltip;