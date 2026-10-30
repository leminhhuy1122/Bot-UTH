import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  HelpCircle, 
  Sparkles, 
  RefreshCw,
  Layers,
  Tag
} from 'lucide-react';
import { batchCreateAdminKnowledge } from '../../services/adminService';

interface KnowledgeBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

export interface ParsedKnowledgeItem {
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}

export const KnowledgeBatchModal: React.FC<KnowledgeBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedKnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý đọc và phân tích file đa định dạng (CSV, JSON, TXT)
  const processFile = async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setIsLoading(true);

    try {
      const fileName = file.name.toLowerCase();
      const text = await file.text();

      let items: ParsedKnowledgeItem[] = [];

      if (fileName.endsWith('.json')) {
        // Parse JSON
        const raw = JSON.parse(text);
        const list = Array.isArray(raw) ? raw : (raw.items || raw.data || []);
        items = list.map((item: any) => ({
          category: (item.category || item['Chuyên mục'] || 'Chung').trim(),
          question: (item.question || item['Câu hỏi'] || '').trim(),
          keywords: Array.isArray(item.keywords) 
            ? item.keywords 
            : typeof (item.keywords || item['Từ khóa']) === 'string'
              ? (item.keywords || item['Từ khóa']).split(',').map((k: string) => k.trim()).filter(Boolean)
              : [],
          answer: (item.answer || item['Câu trả lời'] || item['Nội dung'] || '').trim(),
        })).filter((item: ParsedKnowledgeItem) => item.question && item.answer);

      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        // Parse CSV bằng RFC 4180 parser hỗ trợ xuống dòng trong ngoặc kép
        items = parseCSVKnowledge(text);
      } else {
        throw new Error('Định dạng tệp chưa được hỗ trợ trực tiếp. Vui lòng chọn tệp .csv, .json hoặc .txt.');
      }

      if (items.length === 0) {
        throw new Error('Không tìm thấy mục tri thức hợp lệ trong tệp. Hãy kiểm tra các cột: Chuyên mục, Câu hỏi, Từ khóa, Câu trả lời.');
      }

      setParsedItems(items);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc tệp');
      setParsedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parser CSV chuyên dụng hỗ trợ tiếng Việt UTF-8 và multiline cell
  const parseCSVKnowledge = (csvText: string): ParsedKnowledgeItem[] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    // Loại bỏ BOM nếu có
    const cleanText = csvText.replace(/^\uFEFF/, '');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // Bỏ qua ký tự escape
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) return [];

    // Nhận diện header cột
    const headers = lines[0].map(h => h.toLowerCase());
    let catIdx = headers.findIndex(h => h.includes('chuyên mục') || h.includes('category') || h.includes('nhóm'));
    let qIdx = headers.findIndex(h => h.includes('câu hỏi') || h.includes('question') || h.includes('tiêu đề') || h.includes('title'));
    let kwIdx = headers.findIndex(h => h.includes('từ khóa') || h.includes('keywords') || h.includes('tag'));
    let ansIdx = headers.findIndex(h => h.includes('câu trả lời') || h.includes('answer') || h.includes('nội dung') || h.includes('content'));

    // Fallback nếu không khớp header: giả định thứ tự cột chuẩn: 0=Category, 1=Question, 2=Keywords, 3=Answer
    if (qIdx === -1 && lines[0].length >= 2) {
      catIdx = 0;
      qIdx = 1;
      kwIdx = lines[0].length >= 3 ? 2 : -1;
      ansIdx = lines[0].length >= 4 ? 3 : 2;
    }

    const result: ParsedKnowledgeItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const question = qIdx !== -1 && row[qIdx] ? row[qIdx].trim() : '';
      const answer = ansIdx !== -1 && row[ansIdx] ? row[ansIdx].trim() : '';
      const category = catIdx !== -1 && row[catIdx] ? row[catIdx].trim() : 'Chung';
      const rawKeywords = kwIdx !== -1 && row[kwIdx] ? row[kwIdx].trim() : '';
      const keywords = rawKeywords.split(/[,;]/).map(k => k.trim()).filter(Boolean);

      if (question && answer) {
        result.push({
          category: category || 'Chung',
          question,
          keywords,
          answer
        });
      }
    }

    return result;
  };

  // Nạp dữ liệu lên server
  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setIsLoading(true);

    try {
      const res = await batchCreateAdminKnowledge(parsedItems);
      if (res.success) {
        showToast(
          res.message || `Đã nạp thành công ${parsedItems.length} câu hỏi vào Cơ sở tri thức AI!`,
          'success',
          'Nạp tri thức thành công'
        );
        onSuccess();
        onClose();
      } else {
        showToast(res.message || 'Lỗi khi nạp dữ liệu lên máy chủ', 'error');
      }
    } catch (err: any) {
      showToast(`Không thể nạp tri thức: ${err.message || 'Lỗi kết nối'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải file mẫu CSV
  const handleDownloadCsvSample = () => {
    const csvContent = '\uFEFF"Chuyên mục","Câu hỏi","Từ khóa (cách nhau bởi dấu phẩy)","Câu trả lời chi tiết"\n' +
      '"Thời khóa biểu","Lịch học trong tuần này của tôi như thế nào?","lịch học, thời khóa biểu, tuần này, hôm nay, phòng học","Hệ thống tự động đồng bộ lịch học cá nhân của từng sinh viên UTH từ CSDL đào tạo. Sinh viên có thể tra cứu theo từng ngày hoặc cả tuần."\n' +
      '"Học vụ","Xem điểm GPA và kết quả học tập tích lũy hiện tại","gpa, cpa, điểm, kết quả, học tập, bảng điểm, xếp loại","Điểm trung bình và kết quả học tập của sinh viên được tính theo cả 2 hệ thống: Thang điểm 10 và Thang điểm 4 (kèm quy chiếu điểm chữ A, B+, B, C+, C, D+, D, F)."\n' +
      '"Học phí","Tình trạng công nợ học phí của tôi ra sao?","học phí, công nợ, tiền học, thanh toán, biên lai, nợ phí","Sinh viên có thể kiểm tra chi tiết: Tổng tiền học phí, số tiền được miễn giảm, số tiền đã đóng, số tiền còn nợ và tình trạng thanh toán."\n' +
      '"Quy chế tín chỉ","Quy trình và điều kiện đăng ký học phần bổ sung","đăng ký, học phần, tín chỉ, mở lớp, rút môn, học lại","Đợt đăng ký học phần bổ sung mở từ ngày 01 đến ngày 10 hàng tháng trên cổng Elearning. Sinh viên được đăng ký tối đa 24 tín chỉ/học kỳ."\n' +
      '"Cơ sở & Phòng ban","Các cơ sở và phòng ban chức năng của trường UTH","cơ sở, địa chỉ, võ oanh, bình thạnh, thủ đức, quận 12","Trường Đại học Giao thông Vận tải TP.HCM có các cơ sở chính:\n- Cơ sở 1: Số 2 Võ Oanh, P.25, Bình Thạnh, TP.HCM.\n- Cơ sở 2: Số 10 Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức.\n- Cơ sở 3: Số 70 Tô Ký, P. Tân Chánh Hiệp, Quận 12."';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_tri_thuc_uth.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tải file mẫu JSON
  const handleDownloadJsonSample = () => {
    const jsonSample = [
      {
        category: "Tuyển sinh & Ngành học",
        question: "Trường Đại học Giao thông Vận tải TP.HCM có những hệ đào tạo nào?",
        keywords: ["hệ đào tạo", "chính quy", "tiên tiến", "tiếng anh", "vừa làm vừa học"],
        answer: "▪ Hệ đại học chính quy gồm 3 chương trình: Chương trình chuẩn, Chương trình tiên tiến, và Chương trình dạy bằng tiếng Anh.\n▪ Hệ vừa làm vừa học và đào tạo thường xuyên do Trung tâm Đào tạo Thường xuyên quản lý."
      },
      {
        category: "Hệ thống & E-learning",
        question: "Làm thế nào để đổi mật khẩu tài khoản E-learning / LMS khi bị quên?",
        keywords: ["e-learning", "lms", "mật khẩu", "quên mật khẩu", "portal"],
        answer: "Sinh viên truy cập portal.ut.edu.vn, nhấn vào avatar cá nhân ở góc trên bên phải → chọn 'Đổi mật khẩu' để cấp lại mật khẩu đồng bộ cho toàn bộ hệ thống LMS."
      }
    ];

    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_tri_thuc_uth.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#008272] to-[#005f53] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Upload className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nạp Tri thức Hàng loạt vào Bot (Batch Import)</h3>
              <p className="text-xs text-teal-100">
                Hỗ trợ tệp CSV (Excel), JSON hoặc TXT chứa các câu hỏi & đáp của trường UTH
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

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Hướng dẫn và Nút tải mẫu */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Quy chuẩn tệp nạp tri thức:</span>
              </h4>
              <p className="text-slate-600 leading-relaxed text-[11.5px]">
                Tệp cần có 4 thông tin: <strong>Chuyên mục</strong>, <strong>Câu hỏi</strong>, <strong>Từ khóa</strong> (cách nhau dấu phẩy), và <strong>Câu trả lời</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadCsvSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-2xs"
                title="Tải tệp mẫu Excel / CSV đã được định dạng chuẩn tiếng Việt UTF-8"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải mẫu CSV (Excel)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJsonSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs cursor-pointer transition-colors"
                title="Tải tệp mẫu JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải mẫu JSON</span>
              </button>
            </div>
          </div>

          {/* Khung Kéo & Thả tệp */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#008272] bg-teal-50/60 ring-2 ring-[#008272]/20'
                : 'border-slate-300 hover:border-[#008272] bg-white hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-[#008272] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-xs">
                  {selectedFile ? selectedFile.name : 'Kéo thả tệp tri thức vào đây, hoặc nhấn để duyệt tệp'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hỗ trợ định dạng <strong>.CSV (Excel UTF-8)</strong>, <strong>.JSON</strong> hoặc <strong>.TXT</strong> (Dung lượng tối đa 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Thông báo lỗi nếu có */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">Lỗi đọc tệp:</p>
                <p className="text-[11.5px] text-rose-600">{parseError}</p>
              </div>
            </div>
          )}

          {/* Bảng Xem trước dữ liệu (Preview) */}
          {parsedItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã trích xuất thành công <strong>{parsedItems.length}</strong> câu hỏi hợp lệ:</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Hiển thị tối đa 5 câu hỏi đầu tiên
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {parsedItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-3 bg-white hover:bg-slate-50 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 text-xs">
                        {idx + 1}. {item.question}
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-[#008272] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                      {item.answer}
                    </p>
                    {item.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {item.keywords.slice(0, 5).map((kw, kIdx) => (
                          <span key={kIdx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            #{kw}
                          </span>
                        ))}
                        {item.keywords.length > 5 && (
                          <span className="text-[10px] text-slate-400">+{item.keywords.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0 || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008272] hover:bg-[#006e60] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang nạp tri thức vào CSDL...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận nạp {parsedItems.length > 0 ? `${parsedItems.length} câu hỏi` : ''} vào Bot</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

