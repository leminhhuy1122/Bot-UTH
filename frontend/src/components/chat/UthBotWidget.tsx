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

  // Vị trí kéo thả nổi của Bot trên màn hình (Hỗ trợ kéo thả tự do mọi vị trí trên mobile & desktop)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('uth_bot_pos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  // Khởi tạo vị trí mặc định thông minh và hút dính sát 2 bên viền màn hình (Trái hoặc Phải)
  useEffect(() => {
    const updateDefaultPos = () => {
      const btnSize = 64;
      const isMobile = window.innerWidth < 768;
      const defaultX = window.innerWidth - btnSize - 14;
      const defaultY = Math.max(70, window.innerHeight - btnSize - (isMobile ? 135 : 30));

      setPosition((prev) => {
        if (!prev) return { x: defaultX, y: defaultY };
        // Luôn hút dính sang mép TRÁI hoặc PHẢI gần nhất (Không để lơ lửng ở giữa)
        const midX = window.innerWidth / 2;
        const isLeft = (prev.x + btnSize / 2) < midX;
        const snapX = isLeft ? 14 : (window.innerWidth - btnSize - 14);
        const clampedY = Math.max(60, Math.min(window.innerHeight - btnSize - (isMobile ? 85 : 25), prev.y));
        return { x: snapX, y: clampedY };
      });
    };

    updateDefaultPos();
    window.addEventListener('resize', updateDefaultPos);
    return () => window.removeEventListener('resize', updateDefaultPos);
  }, []);

  // Xử lý chạm/nhấp bắt đầu kéo
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const btnSize = 64;
    const currentX = position?.x ?? (window.innerWidth - btnSize - 16);
    const currentY = position?.y ?? (window.innerHeight - (window.innerWidth < 768 ? 135 : 30));

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initX: currentX,
      initY: currentY,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.hasMoved = true;
      }

      const btnSize = 64;
      const minX = 8;
      const maxX = window.innerWidth - btnSize - 8;
      const minY = 60;
      const maxY = window.innerHeight - btnSize - 10;

      const newX = Math.max(minX, Math.min(maxX, dragRef.current.initX + dx));
      const newY = Math.max(minY, Math.min(maxY, dragRef.current.initY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.hasMoved = true;
      }

      const btnSize = 64;
      const minX = 8;
      const maxX = window.innerWidth - btnSize - 8;
      const minY = 60;
      const maxY = window.innerHeight - btnSize - 10;

      const newX = Math.max(minX, Math.min(maxX, dragRef.current.initX + dx));
      const newY = Math.max(minY, Math.min(maxY, dragRef.current.initY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
      // Nếu chỉ chạm nhẹ và không di chuyển (< 4px) thì mở cửa sổ Bot
      if (!dragRef.current.hasMoved) {
        setIsOpen(true);
        setIsMinimized(false);
      } else {
        // TỰ ĐỘNG HÚT DÍNH VÀO 2 BÊN VIỀN (MAGNETIC EDGE SNAPPING - CHỈ DỪNG Ở 2 BÊN, KHÔNG CHO TỰ DO Ở GIỮA)
        const btnSize = 64;
        const isMobile = window.innerWidth < 768;
        const midX = window.innerWidth / 2;

        setPosition((curr) => {
          if (!curr) return null;
          // Nếu tâm nút Bot ở nửa trái (< midX) -> Nhảy dính mép TRÁI (14px)
          // Nếu tâm nút Bot ở nửa phải (>= midX) -> Nhảy dính mép PHẢI (14px từ mép phải)
          const isLeft = (curr.x + btnSize / 2) < midX;
          const snapX = isLeft ? 14 : (window.innerWidth - btnSize - 14);

          // Giữ vị trí Y an toàn (không bị lọt lên thanh top bar và không đè thanh Bottom Bar trên mobile)
          const minY = 60;
          const maxY = window.innerHeight - btnSize - (isMobile ? 85 : 25);
          const snapY = Math.max(minY, Math.min(maxY, curr.y));

          const finalPos = { x: snapX, y: snapY };
          try {
            localStorage.setItem('uth_bot_pos_v2', JSON.stringify(finalPos));
          } catch (err) {}
          return finalPos;
        });
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging]);

  // Generate initial welcome message based on user role (Ngắn gọn, đúng trọng tâm)
  const getWelcomeMessage = (): ChatMessage => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isParent) {
      return {
        id: 'msg-welcome-parent',
        sender: 'bot',
        text: `Kính chào Quý phụ huynh! Mình là **UTH Assistant**. Bạn cần tra cứu điểm số, thời khóa biểu hay học phí của sinh viên **${student?.name || 'con em'}**?`,
        timestamp: timeStr,
      };
    }

    if (isGuest) {
      return {
        id: 'msg-welcome-guest',
        sender: 'bot',
        text: `Xin chào bạn! Mình là **UTH Assistant**. Bạn cần tìm hiểu ngành tuyển sinh, cơ sở đào tạo hay mức học phí nào của trường?`,
        timestamp: timeStr,
      };
    }

    const pendingAsms = (student?.assignments || []).filter((a: any) => a.status === 'pending');
    const urgentAsms = pendingAsms.filter((a: any) => (a.daysLeft ?? 99) <= 3);
    const deadlineNote = urgentAsms.length > 0
      ? ` 🚨 *Bài tập môn ${urgentAsms[0].courseName} sắp hết hạn (còn ${urgentAsms[0].daysLeft} ngày).*`
      : '';

    return {
      id: 'msg-welcome-student',
      sender: 'bot',
      text: `Chào **${student?.name || 'bạn'}**!${deadlineNote} Bạn cần tra cứu điểm GPA, lịch học tuần, bài tập hay học phí?`,
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

  // Khóa cuộn trang nền trên Mobile & Dispatch sự kiện ẩn/hiện BottomNav khi mở Chatbot
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // 1. Dispatch sự kiện để ẩn MobileBottomNav
      window.dispatchEvent(new CustomEvent('uth:chatbot-open', { detail: { isOpen: true } }));

      // 2. Body Scroll Lock trên mobile & desktop chống trôi trang phía sau
      const scrollY = window.scrollY;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const originalBodyOverflow = document.body.style.overflow;
      const originalDocOverflow = document.documentElement.style.overflow;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalDocOverflow;
        window.scrollTo(0, scrollY);

        window.dispatchEvent(new CustomEvent('uth:chatbot-open', { detail: { isOpen: false } }));
      };
    } else {
      window.dispatchEvent(new CustomEvent('uth:chatbot-open', { detail: { isOpen: false } }));
    }
  }, [isOpen, isMinimized]);

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
          name: student?.name || 'Nguyễn Văn A',
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
      {/* Floating Draggable Trigger Button: Tự động nhảy hút dính 2 bên viền màn hình (Magnetic Edge Snapping) */}
      {!isOpen && position && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 50,
            touchAction: 'none',
            transition: isDragging
              ? 'none'
              : 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.25s ease-out, transform 0.2s ease',
          }}
          className="select-none"
        >
          <div className="relative group">
            {/* Tooltip khi hover trên Desktop */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none ${
                position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 300)
                  ? 'right-full mr-3.5'
                  : 'left-full ml-3.5'
              }`}
            >
              <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium py-1.5 px-3.5 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-2 border border-slate-700/50">
                <span>
                  {isParent 
                    ? `Trợ lý Phụ huynh (${student?.name || 'Con em'})` 
                    : isGuest 
                    ? 'Hỏi Trợ lý UTH Assistant' 
                    : `Hỏi UTH Assistant (${student?.name || 'Sinh viên'})`}
                </span>
                <span className="text-[10px] text-teal-300 font-semibold bg-teal-950/60 px-1.5 py-0.5 rounded">
                  Kéo thả
                </span>
              </div>
            </div>

            {/* Nút Bot tròn: Hỗ trợ Touch Drag & Mouse Drag */}
            <button
              type="button"
              onTouchStart={handleTouchStart}
              onMouseDown={handleTouchStart}
              style={{ touchAction: 'none' }}
              className={`w-15 h-15 sm:w-16 sm:h-16 bg-white border-2 border-[#007062] rounded-full shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing p-0.5 overflow-hidden transition-all duration-150 ${
                isDragging
                  ? 'scale-110 shadow-[0_12px_36px_rgba(0,112,98,0.45)] ring-4 ring-teal-500/30'
                  : 'hover:scale-105 active:scale-95'
              }`}
              title="Kéo thả đến bất cứ đâu hoặc chạm để mở UTH Assistant"
            >
              <img 
                src="/uth_bot_avatar.png" 
                alt="UTH Assistant" 
                className="w-full h-full object-cover rounded-full pointer-events-none"
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uth_bot_avatar.svg';
                }}
              />

              {/* Status Online Pulse Indicator */}
              <span className="absolute top-1 right-1 w-3.5 h-3.5 border-2 border-white rounded-full bg-emerald-500 shadow-xs pointer-events-none" />
            </button>
          </div>
        </div>
      )}

      {/* Bot Chat Window: Toàn màn hình chuẩn Native App trên Mobile, Thẻ nổi tinh tế trên Desktop */}
      {isOpen && (
        <div 
          className={`fixed z-[70] bg-white flex flex-col overflow-hidden overscroll-contain transition-all duration-200 ${
            isMaximized
              ? 'inset-0 sm:inset-6 md:inset-8 w-full sm:w-auto h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl sm:border sm:border-slate-200/80'
              : isMinimized 
              ? 'bottom-0 sm:bottom-6 left-0 sm:left-auto right-0 sm:right-6 w-full sm:w-[420px] md:w-[440px] h-[66px] rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/80 shadow-2xl' 
              : 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[420px] md:w-[440px] h-[100dvh] sm:h-[640px] sm:max-h-[88vh] rounded-none sm:rounded-3xl border-none sm:border sm:border-slate-200/80 shadow-none sm:shadow-2xl'
          }`}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header - Thiết kế tối ưu Mobile Safe-Area & Desktop */}
          <div className="bg-[#007062] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between shrink-0 shadow-sm select-none touch-none">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Circular Avatar */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 ring-2 ring-white/20 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
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
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-[15px] font-bold tracking-tight text-white leading-none truncate">
                    UTH Assistant
                  </h3>
                  <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs leading-none shrink-0 ${
                    isParent
                      ? 'bg-indigo-100 text-indigo-900'
                      : isGuest
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-[#6ee7b7] text-[#064e3b]'
                  }`}>
                    {isParent ? 'Phụ huynh' : isGuest ? 'Khách' : 'Sinh viên'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] text-emerald-100/90 mt-0.5 leading-tight font-normal truncate">
                  {isParent 
                    ? `Trợ lý phụ huynh • SV ${student?.name || 'Con em'}` 
                    : isGuest 
                    ? 'Tư vấn tuyển sinh & dịch vụ' 
                    : 'Trợ lý học tập & sinh viên UTH'}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Nút thu nhỏ - chỉ hiện trên desktop */}
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  if (isMaximized) setIsMaximized(false);
                }}
                title={isMinimized ? 'Mở lại cửa sổ' : 'Thu nhỏ'}
                className="hidden sm:inline-flex p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Nút phóng to - chỉ hiện trên desktop */}
              <button
                type="button"
                onClick={() => {
                  setIsMaximized(!isMaximized);
                  if (isMinimized) setIsMinimized(false);
                }}
                title={isMaximized ? 'Thu nhỏ kích thước chuẩn' : 'Phóng to toàn màn hình'}
                className="hidden sm:inline-flex p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Nút Đóng - Touch target chuẩn >= 44px trên mobile */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý ảo"
                className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
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
              <div 
                className="flex-1 p-4 overflow-y-auto overscroll-contain space-y-4 bg-white text-xs touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
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

              {/* Input Bar: Cố định đáy kèm Safe-Area cho iPhone & Android */}
              <div className="p-2.5 sm:p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-100 shrink-0 touch-none">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 sm:gap-2.5"
                >
                  {/* Rounded capsule wrapper with paperclip */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center shadow-2xs focus-within:border-[#007062] focus-within:ring-2 focus-within:ring-[#007062]/20 transition-all min-h-[44px]">
                    <span title="Đính kèm tệp / hình ảnh">
                      <Paperclip 
                        className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer -rotate-45 mr-2 sm:mr-2.5 shrink-0 transition-colors" 
                      />
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Bạn muốn hỏi gì?"
                      className="w-full bg-transparent text-[16px] sm:text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Send / Stop button */}
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={handleStopGenerating}
                      className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
                      title="Dừng phản hồi"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-[#007062] hover:bg-[#005a4e] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
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
