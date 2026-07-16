import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../lib/auth';
import { getStudentReferralCode, getStudentReferrals, Referral } from '../../lib/api/student';
import { Gift, Share2, Copy, Users, Check, ChevronRight, Trophy } from 'lucide-react';

const REWARD_TIERS = [
  { count: 3,  label: '₹500 Cash',  emoji: '💵' },
  { count: 5,  label: 'Earbuds',    emoji: '🎧' },
  { count: 10, label: '₹4000 Cash', emoji: '💰' },
];

function getNextTier(completed: number): { tier: (typeof REWARD_TIERS)[0]; progress: number } | null {
  const next = REWARD_TIERS.find(t => completed < t.count);
  if (!next) return null;
  const prev = REWARD_TIERS[REWARD_TIERS.indexOf(next) - 1];
  const from = prev ? prev.count : 0;
  const progress = ((completed - from) / (next.count - from)) * 100;
  return { tier: next, progress: Math.max(0, Math.min(100, progress)) };
}

export default function ReferralCenter() {
  const user = getCurrentUser();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getStudentReferralCode(user.id),
      getStudentReferrals(user.id),
    ]).then(([code, refs]) => {
      setReferralCode(code);
      setReferrals(refs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  const completedCount = referrals.filter(r => r.status === 'Completed').length;
  const nextTier = getNextTier(completedCount);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi! I am studying at CynexAI. Join using my referral code ${referralCode} and we both get rewards! Contact: https://cynexai.in`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading referrals…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Refer &amp; Earn</h1>
            <p className="text-muted-foreground text-sm">Share your code, earn amazing rewards!</p>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-px shadow-xl shadow-emerald-500/20">
          <div className="rounded-[15px] bg-surface p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Your Referral Code</span>
            </div>

            {/* Code display */}
            <div className="flex items-center justify-between bg-background rounded-xl border border-border px-5 py-4">
              <span className="text-2xl font-mono font-extrabold tracking-widest text-foreground select-all">
                {referralCode || '—'}
              </span>
              <button
                onClick={handleCopy}
                disabled={!referralCode}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleWhatsApp}
              disabled={!referralCode}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm shadow-lg shadow-green-500/30 transition-all duration-200 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Share via WhatsApp
            </button>
          </div>
        </div>

        {/* Progress Card */}
        <div className="rounded-2xl bg-surface border border-border p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-foreground">Referral Progress</span>
          </div>

          {/* Completed count */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-yellow-500 leading-none">{completedCount}</span>
              <span className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wide">Done</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-foreground font-semibold text-sm">
                {nextTier
                  ? `${nextTier.tier.count - completedCount} more to earn ${nextTier.tier.emoji} ${nextTier.tier.label}`
                  : '🎉 All tiers unlocked! You\'re a referral champion!'}
              </p>
              {nextTier && (
                <>
                  <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-700"
                      style={{ width: `${nextTier.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {Math.round(nextTier.progress)}% toward {nextTier.tier.emoji} {nextTier.tier.label}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Tier list */}
          <div className="grid grid-cols-3 gap-3">
            {REWARD_TIERS.map(tier => {
              const achieved = completedCount >= tier.count;
              return (
                <div
                  key={tier.count}
                  className={`rounded-xl p-3 border text-center transition-all ${
                    achieved
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-foreground/5 border-border'
                  }`}
                >
                  <div className="text-xl mb-1">{tier.emoji}</div>
                  <div className={`text-xs font-bold ${achieved ? 'text-emerald-500' : 'text-foreground'}`}>
                    {tier.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {tier.count} referrals
                  </div>
                  {achieved && (
                    <div className="mt-1.5 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-bold">Earned</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Referrals Table / List */}
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <Users className="w-4 h-4 text-foreground/60" />
            <span className="text-sm font-bold text-foreground">My Referrals</span>
            <span className="ml-auto text-xs text-muted-foreground font-medium bg-foreground/5 px-2 py-0.5 rounded-full">
              {referrals.length} total
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center">
                <Gift className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold">No referrals yet</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Share your code to earn rewards!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Table header — desktop */}
              <div className="hidden md:grid grid-cols-3 px-6 py-3 bg-foreground/5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</span>
              </div>

              {referrals.map(ref => (
                <div key={ref.id} className="grid grid-cols-1 md:grid-cols-3 items-center px-6 py-4 gap-1 md:gap-0 hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(ref.lead_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{ref.lead_name || 'Unknown'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 md:justify-start pl-11 md:pl-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        ref.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          ref.status === 'Completed' ? 'bg-emerald-500' : 'bg-yellow-500'
                        }`}
                      />
                      {ref.status || 'Pending'}
                    </span>
                  </div>

                  <div className="pl-11 md:pl-0">
                    <span className="text-xs text-muted-foreground font-medium">{formatDate(ref.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
