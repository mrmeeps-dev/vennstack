import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Clock, HelpCircle, Info, Mail } from 'lucide-react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

function MenuItem({ icon, title, subtitle, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left"
    >
      <div className="flex-shrink-0 text-slate-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

export function Menu({ isOpen, onClose, onNavigate }: MenuProps) {
  const handleMenuItemClick = (item: string) => {
    if (onNavigate) {
      onNavigate(item);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Menu Overlay */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                <MenuItem
                  icon={<BarChart3 size={20} />}
                  title="Your Stats"
                  subtitle="View your progress"
                  onClick={() => handleMenuItemClick('stats')}
                />
                <MenuItem
                  icon={<Clock size={20} />}
                  title="Puzzle Archive"
                  subtitle="Browse past puzzles"
                  onClick={() => handleMenuItemClick('archive')}
                />
                <MenuItem
                  icon={<HelpCircle size={20} />}
                  title="How to Play"
                  subtitle="Learn the rules"
                  onClick={() => handleMenuItemClick('how-to-play')}
                />

                {/* Separator */}
                <div className="h-px bg-slate-200 my-2" />

                <MenuItem
                  icon={<Info size={20} />}
                  title="About"
                  subtitle="Learn about the game"
                  onClick={() => handleMenuItemClick('about')}
                />
                <MenuItem
                  icon={<Mail size={20} />}
                  title="Contact Us"
                  subtitle="Send feedback or questions"
                  onClick={() => handleMenuItemClick('contact')}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

