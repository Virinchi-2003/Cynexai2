import React, { useEffect, useState } from 'react';
import { getSales, Sale } from '../../lib/api/sales';
import { Card } from '../../components/ui/erp/Card';

import { getCurrentUser } from '../../lib/auth';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const user = getCurrentUser();
  const isManager = user?.role === 'Manager' || user?.role === 'CEO';

  useEffect(() => {
    getSales().then(setSales);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0">
        <h1 className="text-3xl font-display font-bold text-erp-text mb-6">Sales History</h1>
        
        <div className="hidden md:block bg-erp-surface border-2 border-erp-border rounded-3xl overflow-hidden flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-erp-background sticky top-0 z-10 border-b-2 border-erp-border">
              <tr>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Sale ID</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Course</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Total Fee</th>
                {isManager && <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Amount Paid</th>}
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center font-bold text-erp-text/50">No sales recorded yet.</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="border-b border-erp-border/50 hover:bg-erp-primary/5 transition-colors">
                    <td className="p-4 font-bold text-erp-text font-mono text-sm">{sale.id}</td>
                    <td className="p-4 font-bold text-erp-text">{sale.course_id}</td>
                    <td className="p-4 font-bold text-erp-text/70">₹{sale.total_fee.toLocaleString()}</td>
                    {isManager && <td className="p-4 font-bold text-erp-primary">₹{sale.amount_paid.toLocaleString()}</td>}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'Sale completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-4 overflow-y-auto flex-1 pb-32">
          {sales.length === 0 ? (
            <div className="text-center p-10 text-erp-text/50 font-bold border-2 border-dashed border-erp-border rounded-3xl">
              No sales recorded yet.
            </div>
          ) : (
            sales.map((sale) => (
              <Card key={sale.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-erp-text">{sale.course_id}</h3>
                    <p className="text-erp-text/50 font-mono text-xs">{sale.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    sale.status === 'Sale completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sale.status}
                  </span>
                </div>
                <div className="flex justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-erp-text/70 font-bold">Total</span>
                    <span className="font-bold">₹{sale.total_fee.toLocaleString()}</span>
                  </div>
                  {isManager && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-erp-text/70 font-bold">Paid</span>
                      <span className="font-bold text-erp-primary">₹{sale.amount_paid.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
