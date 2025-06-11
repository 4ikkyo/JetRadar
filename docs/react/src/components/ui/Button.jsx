import { cx } from '../../lib/classNameHelper';
import { Icons } from '../../lib/icons';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false, icon }) => {
    // Base styles applied to all buttons
    const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group';

    // Variant specific styles for Liquid Glass design
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        secondary: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
    };
    
    return (
            <button
                onClick={onClick}
                className={cx(
                    baseStyles,
                    variants[variant],
                    className,
                    {
                        'pointer-events-none': loading,
                        'backdrop-blur-sm': true, // всегда добавляем блюр для glass-эффекта
                    }
                )}
                disabled={disabled || loading}
            >
                {loading && (
                    <span className="mr-2">
                        {Icons.spinner}
                    </span>
                )}
                
                {icon && !loading && (
                    <span className="mr-2">
                        {icon}
                    </span>
                )}
                
                {children}

                {/* Optional ripple effect on click (for visual flair) */}
            </button>
    );
};

export default Button;
