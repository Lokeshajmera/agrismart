import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 return (
 <div className="flex h-screen bg-nature-50 dark:bg-nature-900 overflow-hidden text-nature-900 dark:text-white font-sans">
 <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
 <div className="flex flex-col flex-1 overflow-hidden relative">
 <Navbar setIsMobileMenuOpen={setIsMobileMenuOpen} />
 <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative z-0">
 <Outlet />
 </main>
 </div>
 </div>
 );
}
