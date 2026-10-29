import React from 'react';

/**
 * Khối Skeleton Shimmer cơ bản
 * Tạo hiệu ứng ánh sáng lướt qua (shimmer) mềm mại giúp giao diện sống động,
 * người dùng không bị cảm giác trang bị treo hay đứng hình.
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton dành cho Bảng Quản lý Sinh viên (Admin Tab 1)
 */
export const StudentTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-in fade-in duration-150">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            {/* Cột 1: Avatar + Tên + MSSV */}
            <div className="flex items-center gap-3 w-64 shrink-0">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>

            {/* Cột 2: Khoa & Chuyên ngành */}
            <div className="hidden sm:block space-y-1.5 w-52">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>

            {/* Cột 3: GPA & Tiến độ tín chỉ */}
            <div className="hidden md:block space-y-1.5 w-32">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>

            {/* Cột 4: Trạng thái học phí */}
            <div className="w-28 shrink-0">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Cột 5: Nút hành động */}
            <div className="w-20 flex justify-end shrink-0">
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton dành cho Lưới Thẻ Cơ sở Tri thức AI (Admin Tab 3)
 */
export const KnowledgeCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Chuyên mục + Icon */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-12 rounded" />
            </div>
            {/* Tiêu đề câu hỏi */}
            <Skeleton className="h-4 w-4/5 rounded" />
            {/* Nội dung câu trả lời */}
            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-11/12 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </div>

          {/* Hashtags ở dưới */}
          <div className="pt-3 border-t border-slate-100 flex gap-1.5">
            <Skeleton className="h-4 w-14 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton dành cho AI Playground Inspector khi đang truy vấn thử nghiệm (Admin Tab 4)
 */
export const PlaygroundInspectorSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
      {/* Header status */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      {/* NLP Intent box */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Real AI Response Box with shimmer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-60 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2.5">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-11/12 rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>
      </div>

      {/* RAG Docs */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-44 rounded" />
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <Skeleton className="h-3.5 w-1/2 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton dành cho Bảng Thống kê Tổng quan (Admin Tab 2)
 */
export const OverviewStatsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* 2 Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton dành cho Bảng Nhật ký An ninh Audit Logs (Admin Tab 5)
 */
export const AuditLogTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 animate-in fade-in duration-150">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3.5 flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-64 rounded hidden sm:block" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton dành cho Bot Trợ lý Ảo khi đang suy nghĩ (UthBotWidget)
 */
export const BotThinkingSkeleton: React.FC = () => {
  return (
    <div className="space-y-2.5 py-1 min-w-[240px] sm:min-w-[280px]">
      {/* Tiêu đề trạng thái chuyển động */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007062] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007062]" />
        </span>
        <span className="text-[12px] font-medium text-[#007062]">
          UTH Assistant đang tra cứu & suy nghĩ...
        </span>
      </div>

      {/* 3 dòng skeleton shimmer mô phỏng câu trả lời đang hình thành */}
      <div className="space-y-2 pt-0.5">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
        <Skeleton className="h-3.5 w-3/5 rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton dành cho Cổng Sinh viên Dashboard khi tải dữ liệu
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Info card + 3 stat cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-44 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>

        {/* Right: Calendar */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
