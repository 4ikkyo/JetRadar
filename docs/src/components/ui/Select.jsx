import { Icons } from '../../lib/icons';

const Select = ({ children, className = '', ariaLabel, ...props }) => (
    <div className={`relative ${className}`}>
        <select
            {...props}
            className="block appearance-none w-full bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            aria-label={ariaLabel} // Accessibility improvement
        >
            {children}
        </select>
        {/* Dropdown icon within the select for visual indication, also white for contrast */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            {Icons.arrowDown} {/* Use MockIcons or actual Icons imported from your project */}
        </div>
    </div>
);

export default Select;
