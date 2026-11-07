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
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { ServiceItem } from '../../types/uth';

interface ServiceGridProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = React.memo(({ services, onSelectService }) => {
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
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4 select-none">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onSelectService(service)}
          className="bg-white rounded-2xl shadow-xs border border-slate-100 p-3 sm:p-3.5 flex flex-col items-center justify-between text-center group hover:shadow-md hover:border-teal-300 transition-all cursor-pointer min-h-[108px] h-[108px] active:scale-96 relative overflow-hidden"
          title={service.title}
        >
          {/* Biểu tượng Icon dịch vụ */}
          <div className="p-1 rounded-xl group-hover:scale-110 transition-transform mt-0.5">
            {getIcon(service.id)}
          </div>

          {/* Tiêu đề ngắn gọn: tối đa 2 dòng (line-clamp-2) */}
          <span className="text-[12px] sm:text-[11.5px] font-semibold text-slate-800 group-hover:text-teal-900 transition-colors leading-tight line-clamp-2 px-1">
            {service.title}
          </span>

          {/* Nút tròn nhỏ kích thích hành động ở góc dưới bên phải */}
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-slate-50 group-hover:bg-[#00897b] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
            <ChevronRight className="w-3 h-3 stroke-[2.5]" />
          </div>
        </button>
      ))}
    </div>
  );
});
