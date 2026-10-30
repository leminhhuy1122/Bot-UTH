import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ArrowRightLeft, 
  GitMerge, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal,
  Layers,
  HelpCircle,
  Tag
} from 'lucide-react';
import { 
  DuplicatePair, 
  fetchKnowledgeDuplicates, 
  resolveKnowledgeDuplicate 
} from '../../services/adminService';

interface KnowledgeDuplicateCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

export const KnowledgeDuplicateCenter: React.FC<KnowledgeDuplicateCenterProps> = ({
  isOpen,
  onClose,
  onResolved,
  showToast,
}) => {
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThreshold] = useState<number>(0.65);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDuplicates = async (t: number = threshold) => {
    setIsLoading(true);
    try {
      const data = await fetchKnowledgeDuplicates(t);
      setDuplicatePairs(data);
    } catch {
      showToast('Lỗi khi quét danh sách câu hỏi trùng lặp.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDuplicates(threshold);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý giữ A và xóa B
  const handleKeepA = async (pair: DuplicatePair) => {
    setProcessingId(pair.id);
    try {
      const res = await resolveKnowledgeDuplicate({
        action: 'keep_a',
        keep_id: pair.itemA.id,
        delete_id: pair.itemB.id,
        merge_keywords: true,
      });

      if (res.success) {
        showToast(
          `Đã duyệt giữ câu A và XÓA HOÀN TOÀN câu B khỏi CSDL!`,
          'success',
          'Đã giải quyết trùng lặp'
        );
        setDuplicatePairs((prev) => prev.filter((p) => p.id !== pair.id));
        onResolved();
      } else {
        showToast(res.message || 'Lỗi khi xử lý', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý giữ B và xóa A
  const handleKeepB = async (pair: DuplicatePair) => {
    setProcessingId(pair.id);
    try {
      const res = await resolveKnowledgeDuplicate({
        action: 'keep_b',
        keep_id: pair.itemB.id,
        delete_id: pair.itemA.id,
        merge_keywords: true,
      });

      if (res.success) {
        showToast(
          `Đã duyệt giữ câu B và XÓA HOÀN TOÀN câu A khỏi CSDL!`,
          'success',
          'Đã giải quyết trùng lặp'
        );
        setDuplicatePairs((prev) => prev.filter((p) => p.id !== pair.id));
        onResolved();
      } else {
        showToast(res.message || 'Lỗi khi xử lý', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý gộp 2 câu
  const handleMerge = async (pair: DuplicatePair) => {
    setProcessingId(pair.id);
    try {
      // Mặc định chọn câu dài hơn hoặc có câu trả lời chi tiết hơn để làm câu giữ lại
      const keepA = pair.itemA.answer.length >= pair.itemB.answer.length;
      const keepId = keepA ? pair.itemA.id : pair.itemB.id;
      const delId = keepA ? pair.itemB.id : pair.itemA.id;

      const res = await resolveKnowledgeDuplicate({
        action: 'merge',
        keep_id: keepId,
        delete_id: delId,
        merge_keywords: true,
      });

      if (res.success) {
        showToast(
          `Đã hợp nhất từ khóa của cả 2 câu làm một và xóa bản ghi trùng!`,
          'success',
          'Hợp nhất tri thức thành công'
        );
        setDuplicatePairs((prev) => prev.filter((p) => p.id !== pair.id));
        onResolved();
      } else {
        showToast(res.message || 'Lỗi khi hợp nhất', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Bỏ qua cặp này (Không trùng)
  const handleDismiss = async (pair: DuplicatePair) => {
    setDuplicatePairs((prev) => prev.filter((p) => p.id !== pair.id));
    showToast('Đã bỏ qua cặp câu hỏi này.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Trung Tâm Duyệt & Loại Bỏ Câu Hỏi Trùng Lặp</h3>
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                  {duplicatePairs.length} cặp nghi vấn
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Đề xuất các câu hỏi tương đồng ngữ nghĩa để Admin duyệt: giữ 1 câu chuẩn, xóa hoàn toàn câu trùng khỏi CSDL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh điều khiển độ nhạy lọc trùng */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Độ nhạy phát hiện tương đồng:</span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Rất cao (80%)', val: 0.8 },
                { label: 'Tiêu chuẩn (65%)', val: 0.65 },
                { label: 'Rộng (50%)', val: 0.5 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setThreshold(opt.val);
                    loadDuplicates(opt.val);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                    threshold === opt.val
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => loadDuplicates(threshold)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>Quét lại toàn bộ CSDL</span>
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-100/50 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-slate-600 font-medium">Đang chạy thuật toán NLP quét đối soát toàn bộ CSDL tri thức...</p>
            </div>
          ) : duplicatePairs.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Tuyệt vời! Không phát hiện câu hỏi nào bị trùng lặp</h4>
              <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed">
                Tất cả các câu hỏi trong Cơ sở tri thức AI của bạn đều độc lập và rõ ràng theo ngưỡng tương đồng {Math.round(threshold * 100)}%.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicatePairs.map((pair, idx) => (
                <div
                  key={pair.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-amber-300"
                >
                  {/* Top Bar của Cặp câu hỏi */}
                  <div className="px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-amber-900 text-xs">
                        Độ tương đồng: <strong className="text-rose-600">{pair.similarityPercent}%</strong>
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600 text-[11px] italic">
                        {pair.reason}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMerge(pair)}
                        disabled={processingId === pair.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#008272] border border-teal-200 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
                        title="Giữ lại câu trả lời chi tiết hơn và hợp nhất toàn bộ từ khóa của cả 2 câu"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Gộp 2 câu làm một</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDismiss(pair)}
                        className="text-slate-400 hover:text-slate-600 px-2 py-1 text-[11px] hover:bg-slate-100 rounded-md cursor-pointer"
                        title="Bỏ qua cảnh báo nếu 2 câu này hỏi 2 nội dung khác nhau"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>

                  {/* So sánh Đối sánh 2 cột: CÂU HỎI A vs CÂU HỎI B */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* CỘT CÂU HỎI A */}
                    <div className="p-5 flex flex-col justify-between space-y-3 bg-white">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            LỰA CHỌN A (ID: {pair.itemA.id.slice(0, 8)}...)
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            {pair.itemA.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {pair.itemA.question}
                        </h4>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11.5px] text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line">
                          {pair.itemA.answer}
                        </div>

                        {pair.itemA.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {pair.itemA.keywords.slice(0, 5).map((kw, ki) => (
                              <span key={ki} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Nút hành động giữ A và xóa B */}
                      <button
                        type="button"
                        onClick={() => handleKeepA(pair)}
                        disabled={processingId === pair.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>GIỮ CÂU A (Xóa câu B hoàn toàn)</span>
                      </button>
                    </div>

                    {/* CỘT CÂU HỎI B */}
                    <div className="p-5 flex flex-col justify-between space-y-3 bg-white">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            LỰA CHỌN B (ID: {pair.itemB.id.slice(0, 8)}...)
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            {pair.itemB.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {pair.itemB.question}
                        </h4>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11.5px] text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line">
                          {pair.itemB.answer}
                        </div>

                        {pair.itemB.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {pair.itemB.keywords.slice(0, 5).map((kw, ki) => (
                              <span key={ki} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Nút hành động giữ B và xóa A */}
                      <button
                        type="button"
                        onClick={() => handleKeepB(pair)}
                        disabled={processingId === pair.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>GIỮ CÂU B (Xóa câu A hoàn toàn)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <p className="text-slate-500 text-[11.5px]">
            💡 <em>Mẹo: Khi bạn bấm giữ 1 câu và xóa câu kia, hệ thống sẽ tự động gộp các từ khóa độc đáo của câu bị xóa vào câu được giữ để đảm bảo sinh viên hỏi bằng bất kỳ cách nào Bot cũng trả lời được!</em>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};

