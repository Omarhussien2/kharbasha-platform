import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useDialect } from './DialectContext';
import { rpcCall, invalidateCache } from '../api';
import { FileText, Globe, List, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ScraperView() {
  const { t, dialect } = useDialect();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setResult(null);
    console.log("[ACTION_START] Scrape URL:", url);

    try {
      const res = await rpcCall({ func: 'scrape_url', args: { url, dialect } });
      setResult(res);
      console.log("[FETCH_RESPONSE] Scrape success");
      invalidateCache(['get_history_rpc']);
    } catch (err: any) {
      setError(err.message || "Error");
      console.error("[FETCH_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.markdown) {
      navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t.scrape}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder={t.urlPlaceholder} 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
            <Button onClick={handleScrape} disabled={loading || !url} className="min-w-[120px]">
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : t.scrapeBtn}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{result.metadata?.title || "Scrape Result"}</CardTitle>
                <CardDescription className="truncate max-w-md">{result.metadata?.url}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="markdown" className="w-full">
              <div className="px-6 border-b bg-muted/10">
                <TabsList className="bg-transparent border-b-0 -mb-px">
                  <TabsTrigger value="markdown" className="data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                    <FileText className="h-4 w-4 ml-2" />
                    {t.markdown}
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                    <List className="h-4 w-4 ml-2" />
                    {t.metadata}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="markdown" className="p-0 m-0">
                <ScrollArea className="h-[500px] w-full p-6">
                  <div className="prose prose-invert max-w-none prose-amber">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.markdown}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="metadata" className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.metadata || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 rounded-lg bg-muted/30 border border-white/5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{key}</div>
                      <div className="font-medium truncate">{String(val)}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
