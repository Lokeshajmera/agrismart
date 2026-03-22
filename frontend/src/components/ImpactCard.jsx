import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

export default function ImpactCard({ icon: Icon, value, label, description, delay = 0 }) {
 const [count, setCount] = useState(0);
 const inViewRef = React.useRef(null);
 const isInView = useInView(inViewRef, { once: true, margin: "-50px" });

 useEffect(() => {
 if (isInView) {
 let start = 0;
 const end = parseInt(value, 10);
 const duration = 2000; // ms
 const stepTime = Math.abs(Math.floor(duration / end) || 10);
 const timer = setInterval(() => {
 start += 1;
 setCount(start);
 if (start >= end) {
 clearInterval(timer);
 setCount(end); // ensure we hit the exact end value
 }
 }, stepTime);

 return () => clearInterval(timer);
 }
 }, [value, isInView]);

 return (
 <motion.div
 ref={inViewRef}
 initial={{ opacity: 0, y: -10 }}
 animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
 transition={{ duration: 0.5, delay: delay }}
 className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-green-50/50 to-white/80 border border-green-100 shadow-sm relative group cursor-default transition-all hover:shadow-md hover:border-green-200"
 title={description}
 >
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-full bg-green-100 text-green-600">
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-xl font-bold text-green-700 leading-none">
 {count}%
 </span>
 <span className="text-[10px] font-semibold text-green-600/80 uppercase tracking-wider mt-0.5">
 {label}
 </span>
 </div>
 </div>

 {/* Tooltip on hover (tailor-made, hidden by default, shown on group hover) */}
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
 {description}
 </div>
 </motion.div>
 );
}
