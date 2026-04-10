import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { rpcCall, invalidateCache } from '../api';
import { useDialect } from './DialectContext';
import { History, Trash2, Calendar, Globe, Search, Bot } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyTitle, EmptyDescription } from '../components/ui/empty';

export function HistoryView() {
  const { t } = useDialect();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rpcCall({ func: 'get_history_rpc', args: { limit: 30 } });
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    try {
      await rpcCall({ func: 'delete_job_rpc', args: { job_id: id } });
      setHistory(prev => prev.filter(item => item.id !== id));
      invalidateCache(['get_history_rpc']);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );

  if (history.length === 0) return (
    <Empty className="py-20">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <History className="h-10 w-10 text-primary" />
      </div>
      <EmptyTitle>{t.noHistory}</EmptyTitle>
      <EmptyDescription>{t.description}</EmptyDescription>
    </Empty>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-heading font-bold flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          {t.history}
        </h2>
        <Badge variant="outline" className="border-primary/20">
          {history.length} Jobs
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-all border-white/10 bg-card/50 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-primary/10">
                  {item.type === 'scrape' ? <Globe className="h-4 w-4 text-primary" /> : 
                   item.type === 'crawl' ? <Search className="h-4 w-4 text-primary" /> : 
                   <Bot className="h-4 w-4 text-primary" />}
                </div>
                <Badge className={
                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                  item.status === 'pending' || item.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-destructive/10 text-destructive'
                }>
                  {item.status}
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium mt-3 truncate" title={item.url}>
                {item.url}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-[10px]">
                <Calendar className="h-3 w-3" />
                {new Date(item.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              {item.result_url && (
                <div className="text-xs text-muted-foreground bg-black/20 p-2 rounded truncate">
                   {item.result_url}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 border-t border-white/5 bg-muted/20">
              <div className="flex justify-between items-center w-full mt-3">
                <span className="text-[10px] text-muted-foreground italic">
                  {item.dialect === 'egyptian' ? '🇪🇬 مصري' : '🇸🇦 سعودي'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
