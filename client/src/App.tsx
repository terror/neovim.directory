import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Eye, Calendar, ExternalLink } from 'lucide-react';
import { Index } from 'flexsearch';

interface Plugin {
  name: string;
  description: string;
  created_at: string;
  stars: number;
  topics: string[];
  updated_at: string;
  url: string;
  watchers: number;
}

const ITEMS_PER_PAGE = 20;

function App() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const searchIndex = useRef<Index>();
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const response = await fetch('/plugins.json');

        const data = await response.json();

        setPlugins(data);

        const index = new Index({
          tokenize: 'forward',
          cache: true,
        });

        data.forEach((plugin: Plugin, i: number) => {
          const searchableText = [
            plugin.name,
            plugin.description,
            ...(plugin.topics || [])
          ].join(' ');
          index.add(i, searchableText);
        });

        searchIndex.current = index;
      } catch (error) {
        console.error('Failed to load plugins:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugins();
  }, []);

  const filteredPlugins = useMemo(() => {
    if (!searchTerm.trim() || !searchIndex.current || plugins.length === 0) {
      return plugins;
    }

    try {
      const results = searchIndex.current.search(searchTerm, { limit: 1000 });
      const uniqueResults = Array.from(new Set(results)) as number[];
      return uniqueResults
        .map(index => plugins[index])
        .filter(plugin => plugin != null);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, [plugins, searchTerm]);

  const displayedPlugins = useMemo(() => {
    return filteredPlugins.slice(0, displayedCount);
  }, [filteredPlugins, displayedCount]);

  const hasMorePlugins = displayedCount < filteredPlugins.length;

  const loadMore = useCallback(() => {
    if (hasMorePlugins && !loading) {
      setDisplayedCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [hasMorePlugins, loading]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [filteredPlugins]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading plugins...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">neovim.directory</h1>
          <p className="text-xl text-muted-foreground">
            Discover and explore plugins for Neovim
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-6 text-center text-sm text-muted-foreground">
          {searchTerm ? `${filteredPlugins.length} plugin${filteredPlugins.length !== 1 ? 's' : ''} found` : `Showing ${displayedPlugins.length} of ${plugins.length} plugins`}
        </div>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {displayedPlugins.map((plugin, index) => (
            <Card key={`${plugin.name}-${plugin.url}-${index}`} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {plugin.name}
                  </CardTitle>
                  <a
                    href={plugin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <CardDescription className="text-sm line-clamp-2">
                  {plugin.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {plugin.topics.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {plugin.topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{plugin.topics.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{formatNumber(plugin.stars)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatNumber(plugin.watchers)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {formatDate(plugin.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {hasMorePlugins && !loading && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading more plugins...</div>
          </div>
        )}

        {filteredPlugins.length === 0 && searchTerm && !loading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No plugins found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
