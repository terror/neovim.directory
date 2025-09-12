import { Flame, Grid3X3, Sparkles } from 'lucide-react';

type Category = 'all' | 'new' | 'hot';

interface CategoriesProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories = [
  { id: 'all' as const, label: 'All', icon: Grid3X3 },
  { id: 'new' as const, label: 'New', icon: Sparkles },
  { id: 'hot' as const, label: 'Hot', icon: Flame },
];

export function Categories({
  selectedCategory,
  onCategoryChange,
}: CategoriesProps) {
  return (
    <div className='flex justify-center'>
      <div className='flex gap-2'>
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onCategoryChange(id)}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <Icon className='h-4 w-4' />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
