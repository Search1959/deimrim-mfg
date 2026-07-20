import React, { useState } from "react";
import { Warehouse, Download, Edit, X } from "lucide-react";
import type { FinishedGood, BOMItem, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props { finishedGoods: FinishedGood[]; setFinishedGoods: React.Dispatch<React.SetStateAction<FinishedGood[]>>; boms: BOMItem[]; currentUser: User; }

export default function FinishedGoodsView({ finishedGoods, setFinishedGoods, currentUser }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const totalQty = finishedGoods.reduce((s, f) => s + f.quantityNos, 0);
  const totalWt = finishedGoods.reduce((s, f) => s + f.weightKgTotal, 0);

  const saveLocation = (id: string) => {
    setFinishedGoods(prev => prev.map(f => f.id === id ? { ...f, location: editLocation } : f));
    setEditingId(null); toast.success("Location Updated");
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = finishedGoods.map(f => ({
      "Drawing No": f.drawingNo, "Spring Name": f.springName, "Batch No": f.batchNo,
      "Qty (nos)": f.quantityNos, "Weight (kg)": f.weightKgTotal,
      "Location": f.location, "Date Received": f.receivedDate,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "FinishedGoods");
    XLSX.writeFile(wb, "FinishedGoods_Export.xlsx"); toast.success("Exported");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Warehouse className="h-6 w-6 text-orange-400" /> Finished Goods</h1>
          <p className="text-slate-400 text-sm mt-1">Ready-to-dispatch spring stock — post QC cleared</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Total Items (drawing-wise)",value:finishedGoods.length, color:"text-orange-400"},
          {label:"Total Quantity",value:`${totalQty.toLocaleString()} nos`, color:"text-blue-400"},
          {label:"Total Weight",value:`${totalWt.toLocaleString()} kg`, color:"text-emerald-400"},
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full text-xs divide-y divide-slate-800">
          <thead className="bg-slate-950 text-slate-400 font-bold text-left">
            <tr>
              {["Drawing No","Spring Name","Batch No","Qty (nos)","Weight (kg)","Location","Date",""].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {finishedGoods.map(fg => (
              <tr key={fg.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-white text-[10px]">{fg.drawingNo}</td>
                <td className="px-4 py-3 text-slate-200">{fg.springName}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{fg.batchNo}</td>
                <td className="px-4 py-3 font-bold text-blue-300 font-mono">{fg.quantityNos.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-300 font-mono">{fg.weightKgTotal.toLocaleString()} kg</td>
                <td className="px-4 py-3">
                  {editingId === fg.id ? (
                    <div className="flex gap-1">
                      <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-orange-500" />
                      <button onClick={() => saveLocation(fg.id)} className="px-2 py-1 bg-orange-600 rounded text-white text-[10px] font-bold cursor-pointer">OK</button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 cursor-pointer"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <span className="text-slate-300">{fg.location}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{fg.receivedDate}</td>
                <td className="px-4 py-3">
                  {canWrite && editingId !== fg.id && (
                    <button onClick={() => { setEditingId(fg.id); setEditLocation(fg.location); }} className="p-1 text-slate-500 hover:text-blue-400 cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
            {finishedGoods.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-500">No finished goods yet. Passed QC batches appear here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
