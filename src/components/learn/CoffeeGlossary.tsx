import { useState } from 'react';
import { BookOpen, Search, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GlossaryTerm {
  term: string;
  pronunciation: string;
  definition: string;
  category: 'ceremony' | 'equipment' | 'food' | 'culture';
}

const glossaryTerms: GlossaryTerm[] = [
  // Ceremony
  { term: "Buna", pronunciation: "BOO-nah", definition: "The Amharic word for coffee. Ethiopia is the birthplace of coffee, and buna is central to daily life.", category: "ceremony" },
  { term: "Buna Tetu", pronunciation: "BOO-nah TEH-too", definition: "The traditional Ethiopian coffee ceremony, meaning 'drink coffee'. A ritual of hospitality lasting 1-3 hours.", category: "ceremony" },
  { term: "Abol", pronunciation: "ah-BOWL", definition: "The first round of coffee in the ceremony — the strongest and most flavorful pour.", category: "ceremony" },
  { term: "Tona", pronunciation: "TOH-nah", definition: "The second round of coffee, mellower than Abol as the same grounds are reused.", category: "ceremony" },
  { term: "Baraka", pronunciation: "bah-RAH-kah", definition: "The third and final blessed round. Leaving before this cup brings bad luck.", category: "ceremony" },
  
  // Equipment
  { term: "Jebena", pronunciation: "jeh-BEH-nah", definition: "A traditional clay coffee pot with a spherical base, long neck, and straw lid, used to brew Ethiopian coffee.", category: "equipment" },
  { term: "Sini", pronunciation: "SEE-nee", definition: "Small handleless ceramic cups used to serve Ethiopian coffee, holding about 2-3 ounces.", category: "equipment" },
  { term: "Rekbot", pronunciation: "REK-bot", definition: "A woven tray or stand that holds the sini cups during the coffee ceremony.", category: "equipment" },
  { term: "Menkeshkesh", pronunciation: "men-kesh-KESH", definition: "A long-handled pan used to roast green coffee beans over an open flame.", category: "equipment" },
  { term: "Mukecha", pronunciation: "moo-KEH-cha", definition: "A wooden mortar and pestle used to grind roasted coffee beans by hand.", category: "equipment" },
  
  // Food & Accompaniments
  { term: "Etan", pronunciation: "EH-tahn", definition: "Frankincense burned during the coffee ceremony to create a fragrant, spiritual atmosphere.", category: "food" },
  { term: "Fendisha", pronunciation: "fen-DEE-sha", definition: "Freshly popped popcorn, a traditional accompaniment served alongside Ethiopian coffee.", category: "food" },
  { term: "Kolo", pronunciation: "KOH-loh", definition: "Roasted barley snack often served with coffee, sometimes mixed with peanuts or chickpeas.", category: "food" },
  { term: "Korerima", pronunciation: "koh-reh-REE-mah", definition: "Ethiopian cardamom, sometimes added to coffee for extra flavor and aroma.", category: "food" },
  { term: "Rue", pronunciation: "ROO", definition: "An aromatic herb (tena adam) occasionally added to Ethiopian coffee for its distinctive flavor.", category: "food" },
  
  // Culture & Regions
  { term: "Habesha", pronunciation: "hah-BEH-sha", definition: "Term for Ethiopian and Eritrean peoples, their culture, and traditions.", category: "culture" },
  { term: "Yirgacheffe", pronunciation: "yer-gah-CHEF-feh", definition: "A renowned coffee-growing region in southern Ethiopia, famous for floral and fruity coffees.", category: "culture" },
  { term: "Sidamo", pronunciation: "see-DAH-moh", definition: "A major coffee region in Ethiopia known for complex, wine-like coffees with berry notes.", category: "culture" },
  { term: "Harrar", pronunciation: "hah-RAR", definition: "An ancient coffee region in eastern Ethiopia, producing bold, wine-like dry-processed coffees.", category: "culture" },
  { term: "Kaffa", pronunciation: "KAH-fah", definition: "The southwestern region of Ethiopia where coffee was first discovered — the origin of the word 'coffee'.", category: "culture" },
];

const categoryLabels = {
  ceremony: "Ceremony",
  equipment: "Equipment",
  food: "Food & Drink",
  culture: "Culture & Regions"
};

const categoryColors = {
  ceremony: "bg-primary/10 text-primary border-primary/20",
  equipment: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  food: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  culture: "bg-violet-500/10 text-violet-600 border-violet-500/20"
};

export default function CoffeeGlossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ceremony', 'equipment', 'food', 'culture'] as const;

  return (
    <div className="w-full">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              !selectedCategory 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-muted text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                selectedCategory === cat 
                  ? categoryColors[cat]
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((item) => (
          <div
            key={item.term}
            className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.term}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <span className="italic">{item.pronunciation}</span>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border",
                categoryColors[item.category]
              )}>
                {categoryLabels[item.category]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.definition}
            </p>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No terms found matching your search.</p>
        </div>
      )}
    </div>
  );
}
