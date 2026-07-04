import React from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { Gift, Copy, Share2, Users, IndianRupee } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';

export default function ReferralCenter() {
  const user = getCurrentUser();
  const referralCode = "CYNEX" + (user?.id || '999');

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0F172A] text-white">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-blue-400">Refer & Earn</h1>
            <p className="text-slate-400 font-medium mt-1">Invite friends and earn rewards!</p>
          </div>
        </div>
        
        {/* Scrolling News Marquee */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 mb-8 overflow-hidden relative flex items-center">
          <div className="bg-yellow-500 text-yellow-900 font-bold px-3 py-1 rounded-md text-xs z-10 flex-shrink-0">LATEST</div>
          <div className="flex-1 overflow-hidden ml-4">
            <div className="whitespace-nowrap animate-[marquee_15s_linear_infinite] inline-block">
              <span className="text-slate-300 mx-4"><span className="text-blue-400 font-bold">Priya P.</span> just redeemed a ₹500 Amazon Voucher! 🎉</span>
              <span className="text-slate-300 mx-4"><span className="text-blue-400 font-bold">Rahul S.</span> earned ₹24,000 this month! 💸</span>
              <span className="text-slate-300 mx-4"><span className="text-blue-400 font-bold">Anjali M.</span> claimed Wireless Earbuds! 🎧</span>
              <span className="text-slate-300 mx-4"><span className="text-blue-400 font-bold">Priya P.</span> just redeemed a ₹500 Amazon Voucher! 🎉</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 flex flex-col md:flex-row items-center gap-6 p-8 shadow-xl">
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-display mb-2">Earn ₹2,000 per Referral!</h2>
              <p className="text-blue-100 font-medium mb-6">When your friend enrolls in any advanced course using your link, you get ₹2,000 directly to your bank account, and they get 10% off!</p>
              
              <div className="flex items-center gap-2 bg-blue-900/50 p-2 rounded-xl border border-blue-400/30">
                <div className="flex-1 text-center font-mono font-bold text-lg tracking-widest text-blue-100">
                  {referralCode}
                </div>
                <Button variant="secondary" className="bg-white text-blue-900 hover:bg-blue-50">
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
            </div>
            <div className="hidden md:flex w-32 h-32 bg-white/10 rounded-full items-center justify-center backdrop-blur-md">
              <Gift className="w-16 h-16 text-white" />
            </div>
          </Card>

          <Card className="flex flex-col justify-center items-center p-6 text-center bg-slate-900 border border-slate-800">
            <IndianRupee className="w-12 h-12 text-green-500 mb-2" />
            <h3 className="text-3xl font-display font-bold text-slate-100">₹4,000</h3>
            <p className="text-slate-400 font-bold text-sm">Total Earned</p>
            
            <div className="w-full h-px bg-slate-800 my-4"></div>
            
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="text-2xl font-display font-bold text-slate-100">2</h3>
            <p className="text-slate-400 font-bold text-sm">Friends Enrolled</p>
          </Card>
        </div>

        <h2 className="text-xl font-bold font-display text-slate-200 mb-4 mt-12">Rewards Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="text-center p-6 bg-slate-900 border border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-200 mb-1">Tier 1: 3 Referrals</h3>
            <p className="text-xl font-bold text-blue-400 mb-4">₹500 Amazon Voucher</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '66%' }}></div>
            </div>
            <p className="text-xs text-slate-400 font-bold">2/3 Completed</p>
          </Card>
          <Card className="text-center p-6 bg-slate-900 border border-slate-800 flex flex-col items-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-200 mb-1">Tier 2: 5 Referrals</h3>
            <p className="text-xl font-bold text-purple-400 mb-4">Wireless Earbuds</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="text-xs text-slate-400 font-bold">2/5 Completed</p>
          </Card>
          <Card className="text-center p-6 bg-slate-900 border border-slate-800 flex flex-col items-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-200 mb-1">Tier 3: 10 Referrals</h3>
            <p className="text-xl font-bold text-yellow-400 mb-4">₹4,000 Amazon Voucher</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
            <p className="text-xs text-slate-400 font-bold">2/10 Completed</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-200 mb-4">How it works</h2>
            <div className="space-y-4">
              <Card className="p-4 bg-slate-900 border border-slate-800 border-l-4 border-l-blue-500 flex gap-4 items-center">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-slate-200">Share your Code</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">Send your unique referral code to friends interested in upskilling.</p>
                </div>
              </Card>
              <Card className="p-4 bg-slate-900 border border-slate-800 border-l-4 border-l-purple-500 flex gap-4 items-center">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-slate-200">Friend Enrolls</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">They use your code during checkout and get a 10% discount on fees.</p>
                </div>
              </Card>
              <Card className="p-4 bg-slate-900 border border-slate-800 border-l-4 border-l-green-500 flex gap-4 items-center">
                <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-slate-200">Get Paid</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">Once they pay their first installment, you receive ₹2,000 via UPI/Bank.</p>
                </div>
              </Card>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold font-display text-slate-200 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
            </h2>
            <Card className="p-0 bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Top Referrers This Month</span>
              </div>
              <div className="divide-y divide-slate-800">
                {[
                  { rank: 1, name: 'Rahul Sharma', refs: 12, amount: '₹24,000' },
                  { rank: 2, name: 'Priya Patel', refs: 8, amount: '₹16,000' },
                  { rank: 3, name: 'Arjun Reddy', refs: 5, amount: '₹10,000' },
                  { rank: 4, name: 'Neha Gupta', refs: 4, amount: '₹8,000' },
                  { rank: 5, name: 'You', refs: 2, amount: '₹4,000', isYou: true },
                ].map((l) => (
                  <div key={l.rank} className={`flex items-center justify-between p-4 ${l.isYou ? 'bg-blue-500/10' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${l.rank === 1 ? 'bg-yellow-500 text-yellow-900' : l.rank === 2 ? 'bg-slate-300 text-slate-800' : l.rank === 3 ? 'bg-amber-600 text-amber-100' : 'bg-slate-800 text-slate-400'}`}>
                        {l.rank}
                      </div>
                      <span className={`font-bold ${l.isYou ? 'text-blue-400' : 'text-slate-200'}`}>{l.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-green-400">{l.amount}</span>
                      <span className="text-xs font-bold text-slate-500">{l.refs} friends</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
