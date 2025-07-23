"use client";

interface TaskCategory {
  category_name: string;
}

interface CategoryFiltersProps {
  taskCategories: TaskCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryName: string) => void;
  onClearFilters: () => void;
}

export default function CategoryFilters({ 
  taskCategories, 
  selectedCategories, 
  onToggleCategory, 
  onClearFilters 
}: CategoryFiltersProps) {
  if (taskCategories.length === 0) return null;

  return (
    <div className="w-full max-w-4xl">
      <h3 className="font-semibold mb-4">Browse by category:</h3>
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {taskCategories.map((category, index) => {
          const isSelected = selectedCategories.includes(category.category_name);

          return (
            <div
              key={index}
              onClick={() => onToggleCategory(category.category_name)}
              className={`flex-shrink-0 h-10 px-4 flex items-center rounded-full border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">
                {category.category_name}
              </span>
            </div>
          );
        })}
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearFilters}
            className="h-10 px-4 flex items-center text-sm bg-gray-300 rounded-full hover:bg-gray-400 text-gray-800 border border-gray-300"
          >
            Clear Category Filters
          </button>
        )}
      </div>
    </div>
  );
}
