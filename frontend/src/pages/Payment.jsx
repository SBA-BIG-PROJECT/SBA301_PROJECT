import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services';

const Payment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [selectedPlan, setSelectedPlan] = useState('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'PENDING', 'SUCCESS', 'FAILED'
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  useEffect(() => {
    let intervalId;
    if (paymentInfo && paymentStatus !== 'SUCCESS') {
      intervalId = setInterval(async () => {
        try {
          const res = await paymentService.getPaymentStatus(paymentInfo.orderCode);
          if (res.data && res.data.status) {
             setPaymentStatus(res.data.status);
             if (res.data.status === 'SUCCESS' || res.data.paid) {
               setPaymentStatus('SUCCESS');
               clearInterval(intervalId);
             }
          }
        } catch (err) {
          console.error("Error polling payment status", err);
        }
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentInfo, paymentStatus]);

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.createPremiumPayment({
        userId: user.id,
        plan: selectedPlan
      });
      setPaymentInfo(res.data);
      setPaymentStatus('PENDING');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white py-20 px-4 font-['Inter'] flex justify-center items-start">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-yellow-500/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
            </svg>
            TÀI KHOẢN ROX
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nâng cấp trải nghiệm điện ảnh</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Không quảng cáo. Chất lượng 4K. Truy cập toàn bộ kho phim độc quyền. Hủy bất cứ lúc nào.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8 text-center">
            {error}
          </div>
        )}

        {!paymentInfo ? (
          /* Step 1: Select Plan */
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div 
              onClick={() => setSelectedPlan('MONTHLY')}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
                selectedPlan === 'MONTHLY' 
                  ? 'border-yellow-500 bg-[#1E293B]' 
                  : 'border-gray-700 bg-[#151C2C] hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-200">Gói 1 tháng</h3>
                  <p className="text-sm text-gray-400 mt-1">Linh hoạt hàng tháng</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'MONTHLY' ? 'border-yellow-500' : 'border-gray-600'}`}>
                  {selectedPlan === 'MONTHLY' && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                </div>
              </div>
              <div className="mt-8">
                <span className="text-4xl font-bold text-white">100.000đ</span>
                <span className="text-gray-400"> / tháng</span>
              </div>
            </div>

            {/* Yearly Plan */}
            <div 
              onClick={() => setSelectedPlan('YEARLY')}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
                selectedPlan === 'YEARLY' 
                  ? 'border-yellow-500 bg-[#1E293B]' 
                  : 'border-gray-700 bg-[#151C2C] hover:border-gray-500'
              }`}
            >
              <div className="absolute -top-4 right-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                TIẾT KIỆM 16%
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-200">Gói 1 năm</h3>
                  <p className="text-sm text-gray-400 mt-1">Cam kết dài lâu, giá tốt nhất</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'YEARLY' ? 'border-yellow-500' : 'border-gray-600'}`}>
                  {selectedPlan === 'YEARLY' && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                </div>
              </div>
              <div className="mt-8">
                <span className="text-4xl font-bold text-white">1.000.000đ</span>
                <span className="text-gray-400"> / năm</span>
              </div>
            </div>

            <div className="md:col-span-2 mt-8 flex justify-center">
              <button 
                onClick={handlePayment}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black px-12 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>Tiếp tục thanh toán <span className="text-xl">→</span></>
                )}
              </button>
            </div>
          </div>
        ) : paymentStatus === 'SUCCESS' ? (
          /* Step 3: Success */
          <div className="bg-[#1E293B] rounded-3xl p-10 max-w-2xl mx-auto text-center border border-gray-800 shadow-2xl">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Thanh toán thành công!</h2>
            <p className="text-gray-400 text-lg mb-8">
              Chào mừng bạn đến với tài khoản RoX. Trải nghiệm xem phim không giới hạn đã sẵn sàng.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-3 rounded-full font-bold text-lg transition-colors"
            >
              Bắt đầu xem phim
            </button>
          </div>
        ) : (
          /* Step 2: QR Code & Transfer Details */
          <div className="bg-[#1E293B] rounded-3xl p-8 md:p-12 max-w-4xl mx-auto border border-gray-800 shadow-2xl flex flex-col md:flex-row gap-12 items-center">
            
            {/* Left: QR Code */}
            <div className="flex-1 w-full flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <img src={paymentInfo.qrImageUrl} alt="QR Code Thanh Toán" className="w-64 h-64 object-contain" />
              </div>
              
              <div className="flex items-center gap-3 text-yellow-500">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Đang chờ thanh toán...</span>
              </div>
            </div>

            {/* Right: Transfer Details */}
            <div className="flex-1 w-full">
              <h3 className="text-xl font-bold mb-6 text-gray-200">Hoặc chuyển khoản thủ công</h3>
              
              <div className="space-y-4">
                <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                  <div>
                    <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-wider">Ngân hàng</p>
                    <p className="font-medium text-gray-200">{paymentInfo.bank}</p>
                  </div>
                </div>

                <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                  <div>
                    <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-wider">Chủ tài khoản</p>
                    <p className="font-medium text-gray-200">{paymentInfo.accountName}</p>
                  </div>
                </div>

                <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                  <div>
                    <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-wider">Số tài khoản</p>
                    <p className="font-bold text-xl text-yellow-500">{paymentInfo.accountNumber}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(paymentInfo.accountNumber)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    title="Copy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>

                <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                  <div>
                    <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-wider">Số tiền</p>
                    <p className="font-bold text-xl text-green-400">{formatCurrency(paymentInfo.amount)}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(paymentInfo.amount.toString())}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    title="Copy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>

                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center group">
                  <div>
                    <p className="text-yellow-500/70 text-xs mb-1 uppercase font-bold tracking-wider">Nội dung chuyển khoản (Bắt buộc)</p>
                    <p className="font-bold text-xl text-yellow-500">{paymentInfo.transferContent}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(paymentInfo.transferContent)}
                    className="text-yellow-500 hover:text-yellow-400 p-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                    title="Copy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>
                
                <p className="text-xs text-red-400 mt-4 italic text-center">
                  * Vui lòng chuyển đúng nội dung để hệ thống tự động kích hoạt tài khoản.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
