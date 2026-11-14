import React from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Pizza,
  Wine,
  IceCream,
  Croissant,
  Home,
  Lightbulb,
  Droplets,
  Wifi,
  Wrench,
  Sofa,
  Sparkles,
  Key,
  Car,
  Fuel,
  Bus,
  Train,
  Plane,
  Bike,
  MapPin,
  Compass,
  Dices,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Ticket,
  Trophy,
  Camera,
  HeartPulse,
  Pill,
  Dumbbell,
  Scissors,
  Shirt,
  Watch,
  PawPrint,
  Stethoscope,
  Briefcase,
  Wallet,
  Landmark,
  TrendingUp,
  CreditCard,
  Gift,
  Smartphone,
  Package,
  Tag,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

export const CATEGORY_ICONS_MAP = {
  // Cibo & Spesa
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Pizza,
  Wine,
  IceCream,
  Croissant,

  // Casa & Utenze
  Home,
  Lightbulb,
  Droplets,
  Wifi,
  Wrench,
  Sofa,
  Sparkles,
  Key,

  // Trasporti & Viaggi
  Car,
  Fuel,
  Bus,
  Train,
  Plane,
  Bike,
  MapPin,
  Compass,

  // Tempo Libero & Cultura
  Dices,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Ticket,
  Trophy,
  Camera,

  // Salute, Cura & Animali
  HeartPulse,
  Pill,
  Dumbbell,
  Scissors,
  Shirt,
  Watch,
  PawPrint,
  Stethoscope,

  // Finanza, Lavoro & Altro
  Briefcase,
  Wallet,
  Landmark,
  TrendingUp,
  CreditCard,
  Gift,
  Smartphone,
  Package,
  Tag,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  ExternalLink
};

export const COMMON_CATEGORY_ICONS = [
  // Cibo & Spesa (8)
  { name: 'ShoppingCart', label: 'Spesa', group: 'Cibo & Spesa' },
  { name: 'ShoppingBag', label: 'Shopping', group: 'Cibo & Spesa' },
  { name: 'Utensils', label: 'Ristoranti', group: 'Cibo & Spesa' },
  { name: 'Coffee', label: 'Bar & Caffè', group: 'Cibo & Spesa' },
  { name: 'Pizza', label: 'Pizza & Fast Food', group: 'Cibo & Spesa' },
  { name: 'Wine', label: 'Aperitivo & Locali', group: 'Cibo & Spesa' },
  { name: 'IceCream', label: 'Dolci & Gelato', group: 'Cibo & Spesa' },
  { name: 'Croissant', label: 'Colazione & Forno', group: 'Cibo & Spesa' },

  // Casa & Utenze (8)
  { name: 'Home', label: 'Affitto & Mutuo', group: 'Casa & Utenze' },
  { name: 'Lightbulb', label: 'Luce & Energia', group: 'Casa & Utenze' },
  { name: 'Droplets', label: 'Acqua & Utenze', group: 'Casa & Utenze' },
  { name: 'Wifi', label: 'Internet & WiFi', group: 'Casa & Utenze' },
  { name: 'Wrench', label: 'Manutenzione', group: 'Casa & Utenze' },
  { name: 'Sofa', label: 'Arredamento', group: 'Casa & Utenze' },
  { name: 'Key', label: 'Casa & Chiavi', group: 'Casa & Utenze' },
  { name: 'Sparkles', label: 'Pulizia & Extra', group: 'Casa & Utenze' },

  // Trasporti & Viaggi (8)
  { name: 'Car', label: 'Auto & Manutenzione', group: 'Trasporti & Viaggi' },
  { name: 'Fuel', label: 'Carburante', group: 'Trasporti & Viaggi' },
  { name: 'Bus', label: 'Mezzi Pubblici', group: 'Trasporti & Viaggi' },
  { name: 'Train', label: 'Treno & Pendolari', group: 'Trasporti & Viaggi' },
  { name: 'Plane', label: 'Voli & Viaggi', group: 'Trasporti & Viaggi' },
  { name: 'Bike', label: 'Bici & Mobilità', group: 'Trasporti & Viaggi' },
  { name: 'MapPin', label: 'Pedaggi & Parcheggi', group: 'Trasporti & Viaggi' },
  { name: 'Compass', label: 'Vacanze & Hotel', group: 'Trasporti & Viaggi' },

  // Tempo Libero & Cultura (8)
  { name: 'Dices', label: 'Giochi & Serate', group: 'Tempo Libero' },
  { name: 'Gamepad2', label: 'Gaming & Console', group: 'Tempo Libero' },
  { name: 'Music', label: 'Musica & Strumenti', group: 'Tempo Libero' },
  { name: 'Film', label: 'Cinema & Streaming', group: 'Tempo Libero' },
  { name: 'BookOpen', label: 'Libri & Corsi', group: 'Tempo Libero' },
  { name: 'Ticket', label: 'Concerti & Eventi', group: 'Tempo Libero' },
  { name: 'Trophy', label: 'Sport & Gare', group: 'Tempo Libero' },
  { name: 'Camera', label: 'Foto & Hobby', group: 'Tempo Libero' },

  // Salute, Cura & Animali (8)
  { name: 'HeartPulse', label: 'Salute & Visite', group: 'Salute & Cura' },
  { name: 'Pill', label: 'Farmacia & Medicine', group: 'Salute & Cura' },
  { name: 'Dumbbell', label: 'Palestra & Fitness', group: 'Salute & Cura' },
  { name: 'Scissors', label: 'Barbiere & Bellezza', group: 'Salute & Cura' },
  { name: 'Shirt', label: 'Abbigliamento', group: 'Salute & Cura' },
  { name: 'Watch', label: 'Accessori & Moda', group: 'Salute & Cura' },
  { name: 'PawPrint', label: 'Animali & Vets', group: 'Salute & Cura' },
  { name: 'Stethoscope', label: 'Dottore & Cure', group: 'Salute & Cura' },

  // Finanza, Lavoro & Altro (10)
  { name: 'Briefcase', label: 'Stipendio & Lavoro', group: 'Finanza & Lavoro' },
  { name: 'Wallet', label: 'Portafoglio & Contanti', group: 'Finanza & Lavoro' },
  { name: 'Landmark', label: 'Banca & Tasse', group: 'Finanza & Lavoro' },
  { name: 'TrendingUp', label: 'Investimenti & ETF', group: 'Finanza & Lavoro' },
  { name: 'CreditCard', label: 'Abbonamenti & Carte', group: 'Finanza & Lavoro' },
  { name: 'Gift', label: 'Regali & Donazioni', group: 'Finanza & Lavoro' },
  { name: 'Smartphone', label: 'Telefono & App', group: 'Finanza & Lavoro' },
  { name: 'Package', label: 'Vendite & Pacchi', group: 'Finanza & Lavoro' },
  { name: 'Tag', label: 'Categoria Generale', group: 'Finanza & Lavoro' },
  { name: 'HelpCircle', label: 'Altro & Varie', group: 'Finanza & Lavoro' }
];

export const renderCategoryIcon = (iconName, className = "w-4 h-4", strokeWidth = 1.75) => {
  const IconComp = CATEGORY_ICONS_MAP[iconName] || CATEGORY_ICONS_MAP.Tag || Tag;
  return <IconComp className={className} strokeWidth={strokeWidth} />;
};

export const IconPicker = ({ 
  selectedIcon, 
  onSelectIcon, 
  onSelect,
  color,
  currentColor
}) => {
  const handleSelect = onSelectIcon || onSelect || (() => {});
  const safeSelectedIcon = typeof selectedIcon === 'string' ? selectedIcon : '';

  return (
    <div 
      className="space-y-2"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block">
          Icona Vettoriale Monocromatica ({COMMON_CATEGORY_ICONS.length} icone SF Symbols)
        </label>
        {safeSelectedIcon && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
            Selezionata: {renderCategoryIcon(safeSelectedIcon, "w-3.5 h-3.5 text-neutral-900 dark:text-white")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 bg-neutral-100/70 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 max-h-48 overflow-y-auto">
        {COMMON_CATEGORY_ICONS.map((item) => {
          const isSelected = safeSelectedIcon === item.name;
          const IconComp = (typeof item.name === 'string' && CATEGORY_ICONS_MAP[item.name]) ? CATEGORY_ICONS_MAP[item.name] : Tag;

          return (
            <button
              key={item.name}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item.name);
              }}
              title={item.label}
              className={`h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer select-none ${
                isSelected 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm scale-105' 
                  : 'bg-white/80 dark:bg-neutral-700/50 hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700'
              }`}
            >
              <IconComp className="w-4 h-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
