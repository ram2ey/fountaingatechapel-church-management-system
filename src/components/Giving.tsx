import React, { useState } from 'react';
import { Wallet, CreditCard, ChevronRight, CheckCircle, ShieldCheck, Heart, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Giving() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number>(0);
  const [history, setHistory] = useState([
    { id: '1', date: 'May 1, 2026', amount: 50, status: 'Completed' },
    { id: '2', date: 'Apr 1, 2026', amount: 50, status: 'Completed' },
  ]);

  const amounts = [10, 25, 50, 100, 250, 500];

  const handleGive = () => {
    const amount = selectedAmount;
    if (!amount || amount <= 0) {
      alert("Please select or enter an amount to give.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAmount(amount);
      setShowSuccess(true);
      
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setHistory(prev => [
        {
          id: String(Date.now()),
          date: dateString,
          amount: amount,
          status: 'Completed'
        },
        ...prev
      ]);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif font-bold text-church-burgundy">Digital Giving</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Support our missions and community. All gifts are tax-deductible and securely processed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-church-gold/20 shadow-lg">
            <h3 className="text-xl font-serif font-bold text-slate-800 mb-6">Choose an amount</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer ${
                    selectedAmount === amt 
                      ? 'border-church-burgundy bg-church-burgundy/5 text-church-burgundy ring-4 ring-church-burgundy/5' 
                      : 'border-slate-100 hover:border-church-gold/30 text-slate-600'
                  }`}
                >
                  ${amt}
                </button>
              ))}
              <div className="relative group">
                <input 
                  type="number"
                  placeholder="Other"
                  className="w-full h-full py-4 px-4 rounded-2xl font-bold text-lg border-2 border-slate-100 outline-none focus:border-church-burgundy transition-all text-center"
                  onChange={(e) => setSelectedAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-8">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${isRecurring ? 'bg-church-burgundy text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <Repeat size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Make this a recurring gift</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Supports monthly missions</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-14 h-8 rounded-full transition-all relative cursor-pointer ${isRecurring ? 'bg-church-burgundy' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <button 
              onClick={handleGive}
              disabled={isProcessing}
              className="w-full py-5 bg-church-burgundy disabled:bg-slate-400 text-white rounded-2xl font-bold text-xl shadow-xl shadow-church-burgundy/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-3 cursor-pointer"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Processing secure gift...</span>
                </div>
              ) : (
                <>
                  <Heart size={24} />
                  <span>Give ${selectedAmount || 0}</span>
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center space-x-4 mt-8 text-slate-400 text-xs">
              <div className="flex items-center space-x-1">
                <ShieldCheck size={14} />
                <span>Secure SSL Encryption</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              <Heart size={14} className="text-church-burgundy" />
              <span>Processed by Stripe</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-church-burgundy p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 rotate-45"></div>
             <h3 className="text-xl font-serif font-bold mb-4">Why we give</h3>
             <p className="text-white/80 text-sm leading-relaxed italic mb-6">
                "Honor the Lord with your wealth and with the firstfruits of all your produce; then your barns will be filled with plenty..."
                <span className="block mt-2 font-serif font-bold text-church-gold">— Proverbs 3:9-10</span>
             </p>
             <ul className="space-y-3">
                <BenefitItem label="Local Community Support" />
                <BenefitItem label="Global Missions" />
                <BenefitItem label="Family Ministries" />
             </ul>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <CheckCircle size={18} className="text-church-olive" />
              <span>Giving History</span>
            </h4>
            <div className="space-y-4">
              {history.map((item) => (
                <HistoryItem key={item.id} date={item.date} amount={item.amount} status={item.status} />
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-church-burgundy font-bold text-xs hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
              Download 2025 Statement
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 max-w-md w-full relative z-10 border border-church-gold/20 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100/50">
                <CheckCircle size={44} />
              </div>
              
              <div>
                <p className="text-slate-405 text-xs uppercase font-bold tracking-widest">Transaction Successful</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">Thank you!</h3>
                <p className="text-4xl font-serif font-bold text-church-burgundy mt-3">${successAmount.toFixed(2)}</p>
                {isRecurring && <p className="text-[10px] text-church-gold uppercase font-bold tracking-widest mt-1 font-mono">Monthly Recurring Donation</p>}
              </div>

              <div className="bg-church-cream/50 border-l-4 border-church-gold p-4 text-left rounded-r-2xl">
                <p className="text-slate-600 text-sm italic font-serif leading-relaxed">
                  "Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver."
                </p>
                <p className="text-church-gold text-[10px] font-bold mt-2 uppercase tracking-wide">— 2 Corinthians 9:7</p>
              </div>

              <div className="text-slate-400 text-[10px] font-mono border-t border-slate-100 pt-4 flex justify-between">
                <span>REF: TXN-{Math.floor(Math.random() * 900000 + 100000)}</span>
                <span>STATUS: SECURE / STRIPE</span>
              </div>

              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full py-4 bg-church-burgundy text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Close Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BenefitItem({ label }: { label: string }) {
  return (
    <li className="flex items-center space-x-2 text-xs">
      <div className="w-1 h-1 rounded-full bg-church-gold"></div>
      <span>{label}</span>
    </li>
  );
}

function HistoryItem({ date, amount, status }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 animate-fade-in">
      <div>
        <p className="text-sm font-bold text-slate-800">{date}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{status}</p>
      </div>
      <p className="font-bold text-slate-700">${amount}</p>
    </div>
  );
}
