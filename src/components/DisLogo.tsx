import React from 'react';

export default function DisLogo() {
  return (
    <div className="flex items-center space-x-2.5 select-none" id="dis-brand-logo">
      {/* Letter D */}
      <span className="font-sans text-5xl font-extrabold uppercase tracking-tighter text-dis leading-none">
        D
      </span>
      
      {/* Iconic Dotted Grid of 2 columns x 6 rows */}
      <div className="grid grid-cols-2 gap-[3px] py-1" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="w-[7px] h-[7px] bg-dis rounded-[1px] transition-all duration-300 hover:scale-125" 
          />
        ))}
      </div>
      
      {/* Letter S */}
      <span className="font-sans text-5xl font-extrabold uppercase tracking-tighter text-dis leading-none">
        S
      </span>
      
      {/* Year Stack 20 / 26 */}
      <div className="flex flex-col justify-between h-[38px] pl-1 text-[19px] font-extrabold text-dis leading-[0.95]">
        <span>20</span>
        <span>26</span>
      </div>
    </div>
  );
}
