"use client";

import { useState, useEffect, useRef } from "react";
import { House, Users, Plus, MessageSquare, User, X, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { icon: House, label: "Home", href: "/home" },
    { icon: Users, label: "Community", href: "/communities" },
    { icon: Plus, label: "Create", href: "/create" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  // Animation variants
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, staggerChildren: 0.07, delayChildren: 0.1 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2, staggerChildren: 0.03, staggerDirection: -1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#800517] text-white shadow-lg flex items-center justify-center focus:outline-none"
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-20 right-0 flex flex-col items-end gap-3"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  {/* Label (appears to the left of icon) */}
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md shadow-md rounded-full text-sm font-medium text-gray-800">
                    {item.label}
                  </span>
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                        isActive
                          ? "bg-[#800517] text-white"
                          : "bg-white/90 backdrop-blur-md text-gray-700"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={24} />
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}