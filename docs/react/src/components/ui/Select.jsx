import { Icons } from '../../lib/icons';

const Select = ({ children, className = '', ariaLabel, ...props }) => (
    <div className={`relative ${className}`}>
        <select
            {...props}
            // Applying glassmorphism styles: semi-transparent background, white border, blurred backdrop
            className="block appearance-none w-full bg-white/10 border border-white/20 text-white py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white/20 focus:border-indigo-500/50 text-sm backdrop-blur-sm"
            aria-label={ariaLabel} // Accessibility improvement
        >
            {children}
        </select>
        {/* Dropdown icon within the select for visual indication, also white for contrast */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            {Icons.arrowDown} {/* Use MockIcons or actual Icons imported from your project */}
        </div>
    </div>
);

export default Select;
