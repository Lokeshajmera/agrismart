import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, disabled, error, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1); // reset selection when opening or filtering
    }
  }, [searchTerm, isOpen]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
      // scroll into view
      const listNode = listRef.current;
      if (listNode && listNode.children[highlightedIndex + 1]) {
        listNode.children[highlightedIndex + 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      const listNode = listRef.current;
      if (listNode && listNode.children[highlightedIndex - 1]) {
        listNode.children[highlightedIndex - 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        onChange(filteredOptions[highlightedIndex]);
        setSearchTerm(filteredOptions[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm(value || '');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-stretch rounded-md shadow-sm w-full transition-colors cursor-text group ${disabled ? 'opacity-80 cursor-not-allowed' : ''} ${error ? 'border border-red-500 focus-within:ring-1 focus-within:ring-red-500' : 'border border-nature-300 dark:border-nature-700 focus-within:border-earth-500 focus-within:ring-1 focus-within:ring-earth-500 hover:border-earth-400'}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {icon && (
          <span className="inline-flex items-center justify-center px-3 border-r border-nature-300 dark:border-nature-700 bg-nature-50 dark:bg-nature-900 text-nature-500 dark:text-nature-400 sm:text-sm rounded-l-md shrink-0 group-focus-within:border-earth-500 transition-colors">
            {icon}
          </span>
        )}
        <div className={`flex-1 flex items-center w-full px-3 py-2 bg-white dark:bg-nature-950 ${icon ? 'rounded-r-md' : 'rounded-md'}`}>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            className="w-full h-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-nature-900 dark:text-white placeholder-nature-400 p-0 m-0 sm:text-sm"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              onChange(''); 
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            disabled={disabled}
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen) inputRef.current?.focus();
              }
            }}
            className="p-1 cursor-pointer focus:outline-none ml-1 flex items-center justify-center"
          >
            <ChevronDown className={`w-4 h-4 shrink-0 text-nature-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-nature-950 border border-nature-200 dark:border-nature-800 rounded-lg shadow-xl top-full left-0 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1">
          <ul ref={listRef} className="overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-nature-200 dark:scrollbar-thumb-nature-700">
            {filteredOptions.length === 0 ? (
               <li className="px-3 py-3 text-sm text-nature-500 dark:text-nature-400 italic text-center">No results found</li>
            ) : (
               filteredOptions.map((option, index) => (
                 <li
                   key={option}
                   onClick={() => {
                     onChange(option);
                     setSearchTerm(option);
                     setIsOpen(false);
                   }}
                   className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${value === option ? 'text-earth-700 font-bold bg-earth-50 dark:bg-earth-900/40 dark:text-earth-400' : (highlightedIndex === index ? 'bg-nature-100 dark:bg-nature-800 text-earth-600 dark:text-earth-300' : 'text-nature-700 dark:text-nature-300 hover:bg-nature-50 dark:hover:bg-nature-800/80 hover:text-earth-600 dark:hover:text-earth-300')}`}
                 >
                   <span className="truncate pr-2">{option}</span>
                   {value === option && <Check className="w-4 h-4 shrink-0" />}
                 </li>
               ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
