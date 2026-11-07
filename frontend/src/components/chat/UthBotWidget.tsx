import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  BookOpen, 
  ExternalLink, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Paperclip,
  ChevronRight,
  Calendar,
  GraduationCap,
  FileText,
  CreditCard,
  MapPin,
  Square,
  ShieldAlert,
  Sparkles,
  Clock
} from 'lucide-react';
import { ChatMessage } from '../../types/uth';
import { useAuth } from '../../contexts/AuthContext';
import { streamChatMessage } from '../../services/chatService';
import { BotThinkingSkeleton } from '../common/Skeleton';

interface UthBotWidgetProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onRequireLogin?: () => void;
}

export const UthBotWidget: React.FC<UthBotWidgetProps> = ({
  initialQuery,
  onClearInitialQuery,
  onRequireLogin,
}) => {
  const { role, session } = useAuth();
  const isGuest = role === 'guest';
  const isParent = role === 'parent';
  const student = isParent ? session.parentStudent : session.student;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate initial welcome message based on user role
  const getWelcomeMessage = (): ChatMessage => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isParent) {
      return {
        id: 'msg-welcome-parent',
        sender: 'bot',
        text: `Xin chào Quý phụ huynh của sinh viên **${student?.name || 'con em'}**! 👋\n\nTôi là **UTH Assistant**, trợ lý ảo đồng hành cùng Quý phụ huynh.\n\nBạn có thể đặt câu hỏi về kết quả học tập, thời khóa biểu, học phí và các thủ tục sinh viên.`,
        timestamp: timeStr,
      };
    }

    if (isGuest) {
      return {
        id: 'msg-welcome-guest',
        sender: 'bot',
        text: `Xin chào quý khách và các bạn học sinh! 👋\n\nTôi là **UTH Assistant**, trợ lý ảo Trường Đại học Giao thông Vận tải TP.HCM.\n\nBạn có thể đặt câu hỏi về thông tin tuyển sinh, ngành đào tạo, học phí và các cơ sở của trường.`,
        timestamp: timeStr,
      };
    }

    const pendingAsms = (student?.assignments || []).filter((a: any) => a.status === 'pending');
    const urgentAsms = pendingAsms.filter((a: any) => (a.daysLeft ?? 99) <= 3);
    const deadlineNote = urgentAsms.length > 0
      ? `\n\n🚨 **CẢNH BÁO DEADLINE**: Bạn đang có bài tập sắp hết hạn trong 3 ngày tới (*${urgentAsms[0].courseName}: ${urgentAsms[0].title}*). Bạn có thể bấm vào máy bay 3D hoặc hỏi tôi để nộp bài ngay nhé! ✈️`
      : pendingAsms.length > 0
      ? `\n\n📚 Bạn đang có **${pendingAsms.length} bài tập** trực tuyến trên Elearning. Hãy hỏi tôi bất cứ lúc nào để kiểm tra tiến độ nộp bài!`
      : '';

    return {
      id: 'msg-welcome-student',
      sender: 'bot',
      text: `Xin chào bạn **${student?.name || 'Nguyễn Văn A'}**! 👋\n\nTôi là **UTH Assistant**, trợ lý ảo đồng hành cùng bạn.${deadlineNote}\n\nBạn có thể hỏi tôi về bài tập, hạn nộp, lịch học, điểm số và học phí của riêng bạn.`,
      timestamp: timeStr,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);

  // Update welcome message when auth role changes
  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, [role, session.parentStudent?.mssv, session.student?.mssv]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Handle external query trigger (e.g. from service cards or public buttons)
  useEffect(() => {
    if (initialQuery) {
      setIsOpen(true);
      setIsMinimized(false);
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: currentTime,
    };

    const botMsgId = `msg-bot-${Date.now() + 1}`;
    const botPlaceholderMsg: ChatMessage = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg, botPlaceholderMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    // Hỗ trợ tự động mở nếu người dùng ra lệnh trực tiếp ('mở lịch', 'mở tkb', 'mở bài tập', 'mở học phí')
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery.startsWith('mở ') || lowerQuery.includes('mở giúp') || lowerQuery.includes('mở cho tôi') || lowerQuery.includes('xem thời khóa biểu')) {
      if (lowerQuery.includes('lịch') || lowerQuery.includes('thời khóa biểu') || lowerQuery.includes('tkb')) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('uth:open-schedule'));
          setIsMinimized(true);
        }, 600);
      } else if (lowerQuery.includes('bài tập') || lowerQuery.includes('elearning')) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('uth:open-elearning'));
          setIsMinimized(true);
        }, 600);
      } else if (lowerQuery.includes('học phí') || lowerQuery.includes('thanh toán')) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('uth:open-payment'));
          setIsMinimized(true);
        }, 600);
      } else if (lowerQuery.includes('thẻ')) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('uth:open-student-card'));
          setIsMinimized(true);
        }, 600);
      }
    }

    const history = messages
      .filter((m) => !m.id.startsWith('msg-welcome') && m.text.trim())
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    // BẢO MẬT: Nếu là Khách, TUYỆT ĐỐI không gửi studentContext
    const studentContext = isGuest
      ? undefined
      : {
          name: student?.name || 'Sinh viên UTH',
          mssv: student?.mssv || '056205008344',
          cohort: student?.cohort || '2023',
          major: student?.major || 'Công nghệ thông tin',
        };

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    let streamedText = '';

    try {
      await streamChatMessage(
        {
          message: query,
          role: isParent ? 'parent' : isGuest ? 'guest' : 'student',
          history,
          studentContext,
        },
        {
          onChunk: (chunk: string) => {
            streamedText += chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: streamedText } : m))
            );
          },
          onDone: (metadata?: any) => {
            setIsLoading(false);
            abortControllerRef.current = null;
            if (metadata?.intent) {
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...m, metadata } : m))
              );
            }
          },
          onError: (err: any) => {
            console.warn('Lỗi stream chat:', err);
            setIsLoading(false);
            abortControllerRef.current = null;

            let fallbackText = streamedText;
            if (!fallbackText) {
              if (isGuest) {
                fallbackText = `Cảm ơn bạn đã quan tâm đến Trường Đại học Giao thông Vận tải TP.HCM (UTH).\nĐường truyền AI đang bận. Bạn có thể liên hệ trực tiếp Bộ phận Tuyển sinh UTH: **(028) 3899 2862** hoặc truy cập [tuyensinh.ut.edu.vn](https://tuyensinh.ut.edu.vn).`;
              } else if (isParent) {
                fallbackText = `Kính chào Quý phụ huynh! Hệ thống kết nối AI đang gián đoạn. Quý phụ huynh có thể tra cứu thông tin học tập của con em trực tiếp trên bảng điều khiển hoặc liên hệ Văn phòng Khoa: **(028) 3899 2862 - Nhánh 104**.`;
              } else {
                fallbackText = `Chào bạn ${student?.name || 'bạn'}! Kết nối AI đang tạm thời gián đoạn. Bạn có thể kiểm tra trực tiếp bảng điểm và lịch học trên thanh menu bên trái.`;
              }
            }

            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: fallbackText } : m))
            );
          },
        },
        abortCtrl.signal
      );
    } catch {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleResetChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setMessages([getWelcomeMessage()]);
  };

  const handleExportChat = () => {
    const textLines = messages.map(m => {
      const sender = m.sender === 'user' ? 'Người dùng' : 'UTH Assistant';
      return `[${m.timestamp}] ${sender}:\n${m.text}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UTH_Assistant_HoiThoai_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3 stacked quick prompt cards matching the screenshot
  const studentQuickCards = [
    { 
      label: 'Bài tập sắp hết hạn?', 
      query: 'Những bài tập trực tuyến nào của tôi sắp hết hạn nộp và còn bao nhiêu ngày?', 
      icon: Clock, 
      bgClass: 'bg-[#fff7ed] hover:bg-[#ffedd5] border-amber-200/90', 
      iconBoxClass: 'bg-white border-amber-300/90 text-[#d97706]',
      chevronClass: 'text-slate-400 group-hover:text-amber-600'
    },
    { 
      label: 'Lịch học tuần này', 
      query: 'Lịch học trong tuần này của tôi như thế nào?', 
      icon: Calendar, 
      bgClass: 'bg-[#f0f6ff] hover:bg-[#e2eeff] border-blue-100/90', 
      iconBoxClass: 'bg-white border-blue-200/90 text-[#2563eb]',
      chevronClass: 'text-slate-400 group-hover:text-blue-600'
    },
    { 
      label: 'Điểm GPA của tôi', 
      query: 'Xem kết quả học tập và điểm GPA tích lũy hiện tại của tôi', 
      icon: GraduationCap, 
      bgClass: 'bg-[#fff1f2] hover:bg-[#ffe4e6] border-rose-100/90', 
      iconBoxClass: 'bg-white border-rose-200/90 text-[#e11d48]',
      chevronClass: 'text-slate-400 group-hover:text-rose-600'
    },
    { 
      label: 'Kiểm tra nợ học phí', 
      query: 'Kiểm tra tình trạng công nợ học phí và số tiền cần nộp của tôi', 
      icon: CreditCard, 
      bgClass: 'bg-[#f0fdf4] hover:bg-[#dcfce7] border-emerald-100/90', 
      iconBoxClass: 'bg-white border-emerald-200/90 text-[#059669]',
      chevronClass: 'text-slate-400 group-hover:text-emerald-600'
    },
  ];

  const parentQuickCards = [
    { 
      label: 'Lịch học con em', 
      query: 'Thời khóa biểu các môn học trong tuần của sinh viên', 
      icon: Calendar, 
      bgClass: 'bg-[#f0f6ff] hover:bg-[#e2eeff] border-blue-100/90', 
      iconBoxClass: 'bg-white border-blue-200/90 text-[#2563eb]',
      chevronClass: 'text-slate-400 group-hover:text-blue-600'
    },
    { 
      label: 'Kết quả học tập & Điểm số', 
      query: 'Xem điểm rèn luyện và kết quả GPA tích lũy của con em', 
      icon: GraduationCap, 
      bgClass: 'bg-[#fff1f2] hover:bg-[#ffe4e6] border-rose-100/90', 
      iconBoxClass: 'bg-white border-rose-200/90 text-[#e11d48]',
      chevronClass: 'text-slate-400 group-hover:text-rose-600'
    },
    { 
      label: 'Hướng dẫn nộp học phí', 
      query: 'Hướng dẫn các bước nộp học phí qua tài khoản ngân hàng nhà trường', 
      icon: FileText, 
      bgClass: 'bg-[#f0fdf4] hover:bg-[#dcfce7] border-emerald-100/90', 
      iconBoxClass: 'bg-white border-emerald-200/90 text-[#059669]',
      chevronClass: 'text-slate-400 group-hover:text-emerald-600'
    },
  ];

  const guestQuickCards = [
    { 
      label: 'Ngành tuyển sinh 2026', 
      query: 'Trường UTH có những ngành tuyển sinh đại học nào năm 2026?', 
      icon: GraduationCap, 
      bgClass: 'bg-[#f0f6ff] hover:bg-[#e2eeff] border-blue-100/90', 
      iconBoxClass: 'bg-white border-blue-200/90 text-[#2563eb]',
      chevronClass: 'text-slate-400 group-hover:text-blue-600'
    },
    { 
      label: 'Mức học phí đại học', 
      query: 'Mức học phí đại học chính quy của trường là bao nhiêu?', 
      icon: CreditCard, 
      bgClass: 'bg-[#fff1f2] hover:bg-[#ffe4e6] border-rose-100/90', 
      iconBoxClass: 'bg-white border-rose-200/90 text-[#e11d48]',
      chevronClass: 'text-slate-400 group-hover:text-rose-600'
    },
    { 
      label: 'Địa chỉ 3 cơ sở đào tạo', 
      query: 'Trường ĐH Giao thông Vận tải TP.HCM có những cơ sở nào?', 
      icon: MapPin, 
      bgClass: 'bg-[#f0fdf4] hover:bg-[#dcfce7] border-emerald-100/90', 
      iconBoxClass: 'bg-white border-emerald-200/90 text-[#059669]',
      chevronClass: 'text-slate-400 group-hover:text-emerald-600'
    },
  ];

  const activeCards = isParent ? parentQuickCards : isGuest ? guestQuickCards : studentQuickCards;

  // Xử lý thực thi hành động điều hướng giao diện từ Bot (Actionable AI Copilot)
  const handleExecuteAction = (action: any) => {
    if (!action || !action.target) return;

    if (action.type === 'OPEN_LINK' || action.target.startsWith('http')) {
      window.open(action.target, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.target === 'schedule') {
      window.dispatchEvent(new CustomEvent('uth:open-schedule'));
    } else if (action.target === 'full-schedule') {
      window.dispatchEvent(new CustomEvent('uth:open-full-schedule'));
    } else if (action.target === 'elearning') {
      window.dispatchEvent(new CustomEvent('uth:open-elearning'));
    } else if (action.target === 'payment') {
      window.dispatchEvent(new CustomEvent('uth:open-payment'));
    } else if (action.target === 'debt') {
      window.dispatchEvent(new CustomEvent('uth:open-debt'));
    } else if (action.target === 'card') {
      window.dispatchEvent(new CustomEvent('uth:open-student-card'));
    } else if (action.target === 'service') {
      window.dispatchEvent(new CustomEvent('uth:open-service'));
    } else if (action.target === 'course-registration') {
      window.dispatchEvent(new CustomEvent('uth:open-course-registration'));
    } else if (action.target === 'curriculum') {
      window.dispatchEvent(new CustomEvent('uth:open-curriculum'));
    }

    // Tự động thu nhỏ cửa sổ chat để sinh viên quan sát modal/view vừa được mở
    setIsMinimized(true);
  };

  // Suy luận Action thông minh client-side đảm bảo luôn hiển thị nút tương tác
  const getMessageAction = (msg: ChatMessage) => {
    if (msg.metadata?.action) return msg.metadata.action;
    if (msg.sender !== 'bot' || !msg.text) return null;

    const lower = msg.text.toLowerCase();

    // BẢO VỆ CHỐNG NHẦM LẪN: Tuyệt đối không sinh nút hành động nếu là câu chào hoặc giới thiệu năng lực
    if (
      lower.includes('mình luôn sẵn sàng giải đáp') ||
      lower.includes('mình có thể hỗ trợ bạn') ||
      lower.includes('nghiệp vụ học vụ sau') ||
      lower.includes('năng lực')
    ) {
      return null;
    }

    if (lower.includes('thời khóa biểu chi tiết') || (lower.includes('lịch học') && lower.includes('tuần này')) || (lower.includes('phòng:') && lower.includes('giờ:'))) {
      return {
        type: 'OPEN_MODAL',
        target: 'schedule',
        label: '📅 Mở Thời khóa biểu chi tiết',
        icon: 'Calendar',
        description: 'Xem chi tiết phòng học, tiết học và giảng viên tuần này'
      };
    }
    if ((lower.includes('bài tập') && (lower.includes('elearning') || lower.includes('nộp bài') || lower.includes('hạn nộp') || lower.includes('máy bay')))) {
      return {
        type: 'OPEN_VIEW',
        target: 'elearning',
        label: '✈️ Vào Đào tạo trực tuyến (Elearning)',
        icon: 'BookOpen',
        description: 'Mở danh sách bài tập để nộp bài hoặc xem nhận xét'
      };
    }
    if (lower.includes('học phí') && (lower.includes('công nợ') || lower.includes('vietcombank') || lower.includes('thanh toán'))) {
      return {
        type: 'OPEN_VIEW',
        target: 'payment',
        label: '💳 Mở Cổng thanh toán học phí UTH',
        icon: 'CreditCard',
        description: 'Xem chi tiết hóa đơn học phí và chuyển khoản trực tuyến'
      };
    }
    if (lower.includes('đăng ký học phần') || lower.includes('dkhp') || lower.includes('đăng ký môn')) {
      return {
        type: 'OPEN_VIEW',
        target: 'course-registration',
        label: '📝 Mở Đăng ký học phần',
        icon: 'BookOpen',
        description: 'Đăng ký học phần và chọn lớp tín chỉ theo học kỳ'
      };
    }
    if (lower.includes('chương trình khung') || lower.includes('chương trình đào tạo') || lower.includes('khung đào tạo')) {
      return {
        type: 'OPEN_VIEW',
        target: 'curriculum',
        label: '📚 Mở Chương trình khung',
        icon: 'BookOpen',
        description: 'Tra cứu chương trình khung và tiến độ tích lũy học phần'
      };
    }
    if (lower.includes('bảo hiểm y tế') || lower.includes('bhyt') || lower.includes('tiền bảo hiểm')) {
      return {
        type: 'OPEN_VIEW',
        target: 'payment',
        label: '💳 Cổng thanh toán BHYT & Học phí',
        icon: 'CreditCard',
        description: 'Nộp tiền BHYT trực tuyến qua Cổng thanh toán UTH'
      };
    }
    if (lower.includes('support.ut.edu.vn') || lower.includes('gửi yêu cầu hỗ trợ') || lower.includes('cổng hỗ trợ trực tuyến')) {
      return {
        type: 'OPEN_LINK',
        target: 'https://support.ut.edu.vn',
        label: '🌐 Gửi yêu cầu hỗ trợ (support.ut.edu.vn)',
        icon: 'ExternalLink',
        description: 'Mở Cổng hỗ trợ trực tuyến UTH để gửi yêu cầu đến phòng ban'
      };
    }
    return null;
  };

  // Formatting helper for rich text and lists
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const formattedLine = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[#006756] font-mono text-[12px]">{part.slice(1, -1)}</code>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('+ ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 my-1 leading-relaxed">
            {formattedLine}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-700 leading-relaxed my-0.5">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button in bottom-right with Avatar */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip */}
            <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
              <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium py-1.5 px-3.5 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-1.5 border border-slate-700/50">
                <span>
                  {isParent 
                    ? `Trợ lý Phụ huynh (${student?.name || 'Con em'})` 
                    : isGuest 
                    ? 'Hỏi Trợ lý UTH Assistant' 
                    : `Hỏi UTH Assistant (${student?.name || 'Sinh viên'})`}
                </span>
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>

            {/* Circular Bot Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="w-16 h-16 bg-white hover:bg-slate-50 border-2 border-[#007062] rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all transform hover:scale-105 active:scale-95 group relative p-0.5 overflow-hidden"
              title="Mở Trợ lý ảo UTH Assistant"
            >
              <img 
                src="/uth_bot_avatar.png" 
                alt="UTH Assistant" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uth_bot_avatar.svg';
                }}
              />

              {/* Status Online Pulse Indicator */}
              <span className="absolute top-1 right-1 w-3.5 h-3.5 border-2 border-white rounded-full bg-emerald-500 shadow-xs" />
            </button>
          </div>
        )}
      </div>

      {/* Bot Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-white shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-200 ${
            isMaximized
              ? 'inset-3 sm:inset-8 w-auto h-auto rounded-3xl'
              : isMinimized 
              ? 'bottom-6 right-4 sm:right-6 w-[94vw] sm:w-[420px] md:w-[440px] h-[66px] rounded-2xl' 
              : 'bottom-6 right-4 sm:right-6 w-[94vw] sm:w-[420px] md:w-[440px] h-[640px] max-h-[88vh] rounded-3xl'
          }`}
        >
          {/* Header - Matching user screenshot exactly */}
          <div className="bg-[#007062] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm select-none">
            <div className="flex items-center gap-3">
              {/* Circular Avatar */}
              <div className="w-10 h-10 rounded-full bg-white/10 ring-2 ring-white/20 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                <img 
                  src="/uth_bot_avatar.png" 
                  alt="UTH Assistant" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/uth_bot_avatar.svg';
                  }}
                />
              </div>

              {/* Title & Subtitle */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold tracking-tight text-white leading-none">
                    UTH Assistant
                  </h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs leading-none ${
                    isParent
                      ? 'bg-indigo-100 text-indigo-900'
                      : isGuest
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-[#6ee7b7] text-[#064e3b]'
                  }`}>
                    {isParent ? 'Phụ huynh' : isGuest ? 'Chế độ Khách' : 'Sinh viên UTH'}
                  </span>
                </div>
                <p className="text-[11.5px] text-emerald-100/90 mt-1 leading-none font-normal">
                  {isParent 
                    ? `Trợ lý phụ huynh • SV ${student?.name || 'Con em'}` 
                    : isGuest 
                    ? 'Trợ lý tư vấn tuyển sinh & dịch vụ' 
                    : 'Trợ lý ảo hỗ trợ học tập và sinh viên'}
                </p>
              </div>
            </div>

            {/* Window Controls: Minus, Maximize, Close (matching design reference) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  if (isMaximized) setIsMaximized(false);
                }}
                title={isMinimized ? 'Mở lại cửa sổ' : 'Thu nhỏ'}
                className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => {
                  setIsMaximized(!isMaximized);
                  if (isMinimized) setIsMinimized(false);
                }}
                title={isMaximized ? 'Thu nhỏ kích thước chuẩn' : 'Phóng to toàn màn hình'}
                className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý"
                className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Guest Notification Banner if needed */}
              {isGuest && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-1.5 text-[11px] text-amber-900 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Dữ liệu cá nhân (điểm, TKB, học phí) yêu cầu đăng nhập</span>
                  </span>
                  {onRequireLogin && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onRequireLogin();
                      }}
                      className="font-bold text-[#007062] hover:underline cursor-pointer ml-2"
                    >
                      Đăng nhập →
                    </button>
                  )}
                </div>
              )}

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2.5 max-w-[90%]">
                      {/* Bot Avatar on Left */}
                      {msg.sender === 'bot' && (
                        <div className="w-9 h-9 rounded-full bg-white ring-2 ring-slate-100 overflow-hidden shrink-0 mt-0.5 shadow-2xs">
                          <img 
                            src="/uth_bot_avatar.png" 
                            alt="UTH Assistant" 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/uth_bot_avatar.svg';
                            }}
                          />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-2xs leading-relaxed text-[13px] ${
                          msg.sender === 'user'
                            ? 'bg-[#007062] text-white rounded-br-xs'
                            : 'bg-[#f4f7fb] border border-slate-100 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                        ) : msg.text ? (
                          <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                        ) : (
                          <BotThinkingSkeleton />
                        )}
                      </div>
                    </div>

                    {/* Interactive Action Card / Quick Action Button */}
                    {msg.sender === 'bot' && !isLoading && getMessageAction(msg) && (
                      <div className="mt-2.5 ml-11.5 max-w-[90%] animate-fadeIn">
                        {(() => {
                          const act = getMessageAction(msg);
                          if (!act) return null;
                          const isSchedule = act.target === 'schedule' || act.target === 'full-schedule';
                          const isElearning = act.target === 'elearning';
                          const isLink = act.type === 'OPEN_LINK' || act.target?.startsWith('http');
                          return (
                            <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-teal-50/50 border border-teal-200/90 hover:border-teal-400 rounded-2xl p-3 shadow-2xs hover:shadow-sm transition-all group">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8.5 h-8.5 rounded-xl bg-white border border-teal-200 text-[#007062] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                    {isSchedule ? (
                                      <Calendar className="w-4 h-4 stroke-[2.2]" />
                                    ) : isElearning ? (
                                      <BookOpen className="w-4 h-4 stroke-[2.2]" />
                                    ) : isLink ? (
                                      <ExternalLink className="w-4 h-4 stroke-[2.2]" />
                                    ) : (
                                      <CreditCard className="w-4 h-4 stroke-[2.2]" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-[12.5px] leading-tight">
                                      {act.label}
                                    </div>
                                    {act.description && (
                                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                        {act.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(act)}
                                  className="px-3 py-1.5 bg-[#007062] hover:bg-[#005a4e] text-white rounded-xl text-[12px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all shrink-0 hover:shadow-xs"
                                >
                                  <span>{isLink ? 'Truy cập' : 'Mở ngay'}</span>
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Timestamp & Metadata */}
                    <div className={`flex items-center gap-2 mt-1 px-1 ${
                      msg.sender === 'user' ? 'mr-1' : 'ml-12'
                    }`}>
                      <span className="text-[11px] text-slate-400">
                        {msg.timestamp}
                      </span>
                      {msg.metadata && msg.sender === 'bot' && (
                        <span className="text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.2 rounded font-mono">
                          {msg.metadata.intent}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Stacked Quick Prompt Cards - exactly like the user's mockup */}
                {messages.length <= 1 && (
                  <div className="pt-2 pb-1 px-1 space-y-2.5 animate-fadeIn">
                    <p className="text-center text-[13.5px] font-medium text-slate-500 mb-3 select-none">
                      Bạn có thể hỏi nhanh:
                    </p>

                    <div className="space-y-2.5">
                      {activeCards.map((card, idx) => {
                        const IconComp = card.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(card.query)}
                            disabled={isLoading}
                            className={`w-full p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer shadow-2xs hover:shadow-xs group active:scale-[0.99] text-left disabled:opacity-50 disabled:pointer-events-none ${card.bgClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${card.iconBoxClass}`}>
                                <IconComp className="w-5 h-5 stroke-[2]" />
                              </div>
                              <span className="font-semibold text-slate-800 text-[13.5px]">
                                {card.label}
                              </span>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-0.5 ${card.chevronClass}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar matching screenshot */}
              <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2.5"
                >
                  {/* Rounded capsule wrapper with paperclip */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center shadow-2xs focus-within:border-[#007062] focus-within:ring-2 focus-within:ring-[#007062]/20 transition-all">
                    <span title="Đính kèm tệp / hình ảnh (Sắp ra mắt)">
                      <Paperclip 
                        className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer -rotate-45 mr-2.5 shrink-0 transition-colors" 
                      />
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Bạn muốn hỏi gì?"
                      className="w-full bg-transparent text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Send / Stop button */}
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={handleStopGenerating}
                      className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
                      title="Dừng phản hồi"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="w-10 h-10 rounded-full bg-[#007062] hover:bg-[#005a4e] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
                      title="Gửi câu hỏi"
                    >
                      <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
                    </button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
