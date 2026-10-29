import React, { useState } from 'react';
import { X, Send, ArrowRight } from 'lucide-react';
import { ServiceItem, StudentProfile } from '../../types/uth';
import { useToast } from '../../contexts/ToastContext';

interface ServiceModalProps {
  service: ServiceItem | null;
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithQuery?: (query: string) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  service,
  student,
  isOpen,
  onClose,
  onOpenChatWithQuery,
}) => {
  const { showToast } = useToast();
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  if (!isOpen || !service) return null;

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      const ticketCode = '#UTH-' + Math.floor(100000 + Math.random() * 900000);
      setSupportMessage('');
      onClose();
      showToast(
        `Yêu cầu hỗ trợ học vụ của bạn đã được chuyển đến Phòng Đào tạo UTH. Mã tiếp nhận: ${ticketCode}`,
        'success',
        'Gửi yêu cầu thành công'
      );
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 block">
              Dịch vụ học đường UTH
            </span>
            <h3 className="font-bold text-slate-900 text-base">
              {service.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on service */}
        <div className="p-6 text-xs sm:text-sm text-slate-600 space-y-4">
          <p className="text-slate-700 leading-relaxed">
            {service.description}
          </p>

          {service.id === 'srv-9' && (
            // Tra cứu công nợ
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Họ tên sinh viên:</span>
                <span className="font-bold text-slate-900">{student.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mã số sinh viên:</span>
                <span className="font-mono font-bold text-slate-900">{student.mssv}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Học phí Học kỳ 1 (2026-2027):</span>
                <span className="font-mono font-medium text-slate-800">
                  {(student.totalTuition || 14850000).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tiền đã đóng:</span>
                <span className="font-mono font-medium text-emerald-700">
                  {(student.paidAmount || (student.totalTuition || 14850000) - (student.debtAmount || 0)).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Công nợ còn lại:</span>
                {(student.debtAmount ?? 0) > 0 ? (
                  <span className="font-bold text-rose-600 font-mono text-sm">
                    {(student.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ (Còn nợ)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 font-mono text-sm">0 VNĐ (Đã thanh toán đủ 100%)</span>
                )}
              </div>
            </div>
          )}

          {service.id === 'srv-4' && (
            // Cổng thanh toán trực tuyến
            <div className="space-y-3">
              {(student.debtAmount ?? 0) > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                  Khoản nợ học phí cần thanh toán: <strong className="font-mono text-rose-700">{(student.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ</strong>. Vui lòng thanh toán trước ngày 30/11/2026.
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  Hiện tại tài khoản sinh viên không có khoản nợ học phí nào cần thanh toán (Đã hoàn thành 100%).
                </div>
              )}
              <p className="text-xs text-slate-500">
                Phương thức hỗ trợ: VNPAY, Thẻ nội địa Napas, Thẻ quốc tế Visa/Mastercard và quét mã VietQR.
              </p>
            </div>
          )}

          {service.id === 'srv-2' && (
            // Hỗ trợ trực tuyến
            <form onSubmit={handleSendSupport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung yêu cầu hỗ trợ (Phòng Đào tạo / CTSV):
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc yêu cầu cấp giấy xác nhận sinh viên, mở thêm lớp tín chỉ..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                {onOpenChatWithQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChatWithQuery('Tôi cần hướng dẫn thủ tục học vụ');
                    }}
                    className="text-xs text-[#0e7472] font-semibold hover:underline cursor-pointer"
                  >
                    Hỏi trực tiếp UTH Bot →
                  </button>
                )}

                <button
                  type="submit"
                  disabled={supportSubmitted}
                  className="px-4 py-2 bg-[#0e7472] hover:bg-[#0b5e5c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{supportSubmitted ? 'Đang gửi...' : 'Gửi phiếu yêu cầu'}</span>
                </button>
              </div>
            </form>
          )}

          {service.id === 'srv-7' && (
            // Đăng ký học phần
            <div className="space-y-2">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900">
                <span className="font-bold block mb-1">Thông báo đợt đăng ký:</span>
                Đợt đăng ký tín chỉ bổ sung Học kỳ 1 mở từ 08:00 ngày 01 đến 17:00 ngày 10 hàng tháng.
              </div>
              <p className="text-xs text-slate-500">
                Tổng tín chỉ tối đa được phép đăng ký trong một kỳ: 24 tín chỉ.
              </p>
            </div>
          )}

          {service.id === 'srv-6' && (
            // Chương trình khung
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800">
                Ngành Công nghệ thông tin (Chất lượng cao) - Mã ngành: 7480201CLC
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Khối lượng toàn khóa: 145 tín chỉ (chưa bao gồm GDTC và GDQP-AN).</li>
                <li>Thời gian đào tạo chuẩn: 4 năm (8 học kỳ chính).</li>
                <li>Chuẩn đầu ra ngoại ngữ: Chứng chỉ tiếng Anh tương đương TOEIC 550 / B1.</li>
              </ul>
            </div>
          )}

          {/* Quick link to ask bot */}
          {service.id !== 'srv-2' && onOpenChatWithQuery && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Cần trợ giúp thêm về tính năng này?</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenChatWithQuery(`Hướng dẫn tôi về ${service.title}`);
                }}
                className="text-[#0e7472] hover:text-[#0b5e5c] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Hỏi UTH Bot</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0e7472] hover:bg-[#0b5e5c] rounded-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

