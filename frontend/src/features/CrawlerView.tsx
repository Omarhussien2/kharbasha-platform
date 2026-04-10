import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { useDialect } from './DialectContext';
import { streamCall, invalidateCache } from '../api';
import { LayoutGrid, Globe, ExternalLink, Hash } from 'lucide-react';

export function CrawlerView() {
  const { t, dialect } = useDialect();
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleCrawl = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setPages([]);
    setStatus('');
    setProgress(0);
    console.log("[ACTION_START] Crawl Domain:", url);

    try {
      await streamCall({
        func: 'crawl_domain_streaming',
        args: { url, limit, dialect },
        onChunk: (chunk) => {
          if (chunk.type === 'status') {
            setStatus(chunk.content);
            if (chunk.progress !== undefined) setProgress(chunk.progress);
          } else if (chunk.type === 'page') {
            setPages(prev => [...prev, chunk]);
          }
        },
        onError: (err) => {
          setError(err.message);
          console.error("[STREAM_ERROR]", err);
        }
      });
      console.log("[STREAM_DONE] Crawl complete");
      invalidateCache(['get_history_rpc']);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            {t.crawl}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder={t.urlPlaceholder} 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="w-full md:w-32 flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <Input 
                type="number" 
                min={1} 
                max={50} 
                value={limit} 
                onChange={(e) => setLimit(parseInt(e.target.value))}
                placeholder="Limit"
              />
            </div>
            <Button onClick={handleCrawl} disabled={loading || !url} className="md:min-w-[120px]">
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : t.crawlBtn}
            </Button>
          </div>

          {loading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-primary font-medium">{status}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
      </Card>

      {pages.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg flex items-center gap-2 px-1">
            <Globe className="h-5 w-5 text-primary" />
            {t.pages} ({pages.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {pages.map((page, idx) => (
              <Card key={idx} className="hover:shadow-md transition-all border-white/5 bg-card/40 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base truncate flex-1 ml-4">{page.title || "No Title"}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono whitespace-nowrap">
                      {new URL(page.url).pathname}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <ExternalLink className="h-3 w-3" />
                    {page.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-20 w-full rounded-md border border-white/5 bg-black/20 p-2 text-xs text-muted-foreground">
                    {page.content}
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
