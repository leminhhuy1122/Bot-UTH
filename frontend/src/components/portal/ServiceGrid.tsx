import React from 'react';
import { 
  Laptop, 
  Headset, 
  UserRound, 
  BadgeDollarSign, 
  FileText, 
  CalendarRange, 
  Grid3X3, 
  MessageSquare, 
  RotateCw, 
  GraduationCap 
} from 'lucide-react';
import { ServiceItem } from '../../types/uth';

interface ServiceGridProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ services, onSelectService }) => {
  // Mapping icons to closely match the original screenshot icons
  const getIcon = (id: string) => {
    switch (id) {
      case 'srv-1':
        return <Laptop className="w-7 h-7 text-[#00897b]" />;
      case 'srv-2':
        return <Headset className="w-7 h-7 text-[#5c6bc0]" />;
      case 'srv-3':
        return <UserRound className="w-7 h-7 text-[#00838f]" />;
      case 'srv-4':
        return <BadgeDollarSign className="w-7 h-7 text-[#fb8c00]" />;
      case 'srv-5':
        return <FileText className="w-7 h-7 text-[#43a047]" />;
      case 'srv-6':
        return <CalendarRange className="w-7 h-7 text-[#e53935]" />;
      case 'srv-7':
        return <Grid3X3 className="w-7 h-7 text-[#8e24aa]" />;
      case 'srv-8':
        return <MessageSquare className="w-7 h-7 text-[#00695c]" />;
      case 'srv-9':
        return <RotateCw className="w-7 h-7 text-[#ef6c00]" />;
      case 'srv-10':
        return <GraduationCap className="w-7 h-7 text-[#546e7a]" />;
      default:
        return <FileText className="w-7 h-7 text-teal-600" />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelectService(service)}
          className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5 flex flex-col items-center justify-center text-center group hover:shadow-md hover:border-teal-300 transition-all cursor-pointer min-h-[110px]"
        >
          <div className="mb-2.5 p-2 rounded-xl group-hover:scale-110 transition-transform">
            {getIcon(service.id)}
          </div>
          <span className="text-xs sm:text-[13px] font-medium text-slate-700 group-hover:text-teal-900 transition-colors leading-tight line-clamp-2">
            {service.title}
          </span>
        </button>
      ))}
    </div>
  );
};
