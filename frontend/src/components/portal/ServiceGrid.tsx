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
        return <Laptop className="w-6 h-6 text-[#00897b]" />;
      case 'srv-2':
        return <Headset className="w-6 h-6 text-[#5c6bc0]" />;
      case 'srv-3':
        return <UserRound className="w-6 h-6 text-[#00838f]" />;
      case 'srv-4':
        return <BadgeDollarSign className="w-6 h-6 text-[#fb8c00]" />;
      case 'srv-5':
        return <FileText className="w-6 h-6 text-[#43a047]" />;
      case 'srv-6':
        return <CalendarRange className="w-6 h-6 text-[#e53935]" />;
      case 'srv-7':
        return <Grid3X3 className="w-6 h-6 text-[#8e24aa]" />;
      case 'srv-8':
        return <MessageSquare className="w-6 h-6 text-[#00695c]" />;
      case 'srv-9':
        return <RotateCw className="w-6 h-6 text-[#ef6c00]" />;
      case 'srv-10':
        return <GraduationCap className="w-6 h-6 text-[#546e7a]" />;
      default:
        return <FileText className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    /* Đổi sang lg:grid-cols-8 để hàng 1 có 8 ô, hàng 2 có 2 ô */
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelectService(service)}
          className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 sm:p-3.5 flex flex-col items-center justify-center text-center group hover:shadow-md hover:border-teal-300 transition-all cursor-pointer min-h-[105px]"
        >
          <div className="mb-2 p-1 rounded-xl group-hover:scale-110 transition-transform">
            {getIcon(service.id)}
          </div>
          <span className="text-[11.5px] font-medium text-slate-700 group-hover:text-teal-900 transition-colors leading-tight line-clamp-2">
            {service.title}
          </span>
        </button>
      ))}
    </div>
  );
};