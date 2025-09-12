import { ModeToggle } from '@/components/mode-toggle';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/use-debounce';
import { Index } from 'flexsearch';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ExternalLink,
  Eye,
  Flame,
  Github,
  Grid3X3,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'new' | 'hot'
  >('all');
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
            ...(plugin.topics || []),
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
    let pluginsToFilter = plugins;

    if (selectedCategory === 'new') {
      pluginsToFilter = [...plugins].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (selectedCategory === 'hot') {
      pluginsToFilter = [...plugins].sort((a, b) => b.stars - a.stars);
    }

    if (
      !debouncedSearchTerm.trim() ||
      !searchIndex.current ||
      plugins.length === 0
    ) {
      return pluginsToFilter;
    }

    try {
      const results = searchIndex.current.search(debouncedSearchTerm, {
        limit: 1000,
      });
      const uniqueResults = Array.from(new Set(results)) as number[];
      const searchFiltered = uniqueResults
        .map((index) => plugins[index])
        .filter((plugin) => plugin != null);

      if (selectedCategory === 'new') {
        return searchFiltered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (selectedCategory === 'hot') {
        return searchFiltered.sort((a, b) => b.stars - a.stars);
      }

      return searchFiltered;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, [plugins, debouncedSearchTerm, selectedCategory]);

  const displayedPlugins = useMemo(() => {
    return filteredPlugins.slice(0, displayedCount);
  }, [filteredPlugins, displayedCount]);

  const hasMorePlugins = displayedCount < filteredPlugins.length;

  const loadMore = useCallback(() => {
    if (hasMorePlugins && !loading) {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
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
  }, [filteredPlugins, selectedCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <div className='flex min-h-screen items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className='flex flex-col items-center gap-4'
        >
          <Spinner size='lg' />
          <p className='text-muted-foreground text-lg'>Loading plugins...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className='bg-background min-h-screen'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className='container mx-auto px-4 py-8'>
        <div className='fixed top-4 right-4 z-50 flex items-center gap-2'>
          <a
            href='https://github.com/terror/neovim.directory'
            target='_blank'
            rel='noopener noreferrer'
            className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <Github className='h-[1.2rem] w-[1.2rem]' />
            <span className='sr-only'>View on GitHub</span>
          </a>
          <ModeToggle />
        </div>
        <motion.div
          className='mb-8 text-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <h1 className='mb-4 text-4xl font-bold tracking-tight'>
            neovim.directory
          </h1>
          <p className='text-muted-foreground text-xl'>
            Discover and explore plugins for Neovim
          </p>
        </motion.div>

        <motion.div
          className='mb-8'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
          <div className='relative mx-auto max-w-md'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              type='text'
              placeholder='Search plugins...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </motion.div>

        <motion.div
          className='mb-6'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <div className='flex justify-center'>
            <div className='flex gap-2'>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Grid3X3 className='h-4 w-4' />
                All
              </button>
              <button
                onClick={() => setSelectedCategory('new')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'new'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Sparkles className='h-4 w-4' />
                New
              </button>
              <button
                onClick={() => setSelectedCategory('hot')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'hot'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Flame className='h-4 w-4' />
                Hot
              </button>
            </div>
          </div>
        </motion.div>

        <div className='text-muted-foreground mb-6 text-center text-sm'>
          {debouncedSearchTerm
            ? `${filteredPlugins.length} plugin${filteredPlugins.length !== 1 ? 's' : ''} found`
            : `Showing ${displayedPlugins.length} of ${plugins.length} plugins`}
        </div>

        <motion.div
          className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          style={{ minHeight: displayedPlugins.length > 0 ? 'auto' : '200px' }}
        >
          <AnimatePresence mode='wait'>
            {displayedPlugins.map((plugin, index) => (
              <motion.div
                key={`${plugin.name}-${plugin.url}-${index}`}
                layout
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.015, 0.3),
                  ease: 'easeOut',
                  layout: { duration: 0.3, ease: 'easeInOut' },
                }}
                whileHover={{
                  scale: 1.015,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.99,
                  transition: { duration: 0.1 },
                }}
              >
                <Card className='flex h-full flex-col transition-shadow hover:shadow-md'>
                  <CardHeader className='flex-shrink-0'>
                    <div className='flex items-start justify-between'>
                      <CardTitle className='text-lg font-semibold'>
                        {plugin.name}
                      </CardTitle>
                      <a
                        href={plugin.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-muted-foreground hover:text-foreground transition-colors'
                      >
                        <ExternalLink className='h-4 w-4' />
                      </a>
                    </div>
                    <CardDescription className='line-clamp-2 text-sm'>
                      {plugin.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='flex-grow'>
                    <div className='mb-4'>
                      <div className='flex flex-wrap gap-1'>
                        {plugin.topics.slice(0, 3).map((topic) => (
                          <Badge
                            key={topic}
                            variant='secondary'
                            className='text-xs'
                          >
                            {topic}
                          </Badge>
                        ))}
                        {plugin.topics.length > 3 && (
                          <Badge variant='outline' className='text-xs'>
                            +{plugin.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className='text-muted-foreground space-y-2 text-xs'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Star className='h-3 w-3' />
                          <span>{formatNumber(plugin.stars)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Eye className='h-3 w-3' />
                          <span>{formatNumber(plugin.watchers)}</span>
                        </div>
                      </div>
                      {selectedCategory === 'new' ? (
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          <span>Created {formatDate(plugin.created_at)}</span>
                        </div>
                      ) : (
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          <span>Updated {formatDate(plugin.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {hasMorePlugins && !loading && (
          <motion.div
            ref={loadMoreRef}
            className='flex justify-center py-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-2'>
              <Spinner size='sm' />
              <span className='text-muted-foreground text-sm'>
                Loading more plugins...
              </span>
            </div>
          </motion.div>
        )}

        {filteredPlugins.length === 0 && debouncedSearchTerm && !loading && (
          <motion.div
            className='py-12 text-center'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <p className='text-muted-foreground text-lg'>
              No plugins found matching your search.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default App;
