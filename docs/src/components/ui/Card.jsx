import { cx } from '../../lib/classNameHelper';

const Card = ({ children, className = '', ...props }) => (
    <section className={cx('bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4', className)} {...props}>
    {children}
    </section>
);

export default Card;
