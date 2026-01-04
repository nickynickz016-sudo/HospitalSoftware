import React from 'react';
import { AIAnalysisResult } from '../types';
import { Sparkles, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AIInsightPanelProps {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ analysis, isLoading, onAnalyze }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Gemini Intelligence</h3>
            <p className="text-xs text-gray-400">AI-Powered Inventory Analytics</p>
          </div>
        </div>
        
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isLoading 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
          }`}
        >
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {!analysis && !isLoading && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Click "Run Analysis" to generate insights from your inventory data using Gemini.
        </div>
      )}

      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-20 bg-gray-800 rounded w-full"></div>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-sm text-gray-300 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Alerts */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} /> Critical Attention
              </h4>
              {analysis.criticalAlerts.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.criticalAlerts.map((alert, idx) => (
                    <li key={idx} className="text-xs text-red-200 bg-red-900/20 border border-red-900/50 px-3 py-2 rounded-lg">
                      {alert}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-500 italic">No critical alerts detected.</div>
              )}
            </div>

            {/* Expiry Warnings */}
            <div className="space-y-3">
               <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Clock size={14} /> Expiring Soon
              </h4>
              {analysis.expiryWarnings.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.expiryWarnings.map((warn, idx) => (
                    <li key={idx} className="text-xs text-amber-200 bg-amber-900/20 border border-amber-900/50 px-3 py-2 rounded-lg">
                      {warn}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-500 italic">No immediate expiry risks.</div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
              <CheckCircle size={14} /> Restock Recommendations
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {analysis.restockRecommendations.map((rec, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div>
                    <span className="font-medium text-indigo-300 block">{rec.itemName}</span>
                    <span className="text-xs text-gray-400">{rec.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500">Suggest</span>
                    <span className="font-bold text-white">+{rec.suggestedQuantity}</span>
                  </div>
                </div>
              ))}
              {analysis.restockRecommendations.length === 0 && (
                <div className="text-xs text-gray-500 italic">Inventory levels look optimal.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightPanel;