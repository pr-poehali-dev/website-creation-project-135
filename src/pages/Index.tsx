import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import HeroSection from "@/sections/HeroSection";
import CatalogSection, { CatalogItem, Game, GAMES, catalogItems } from "@/sections/CatalogSection";
import ReviewsSection from "@/sections/ReviewsSection";
import SupportSection from "@/sections/SupportSection";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";
const USD_TO_RUB_DEFAULT = 81.91;

export default function Index() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("Главная");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dbPrices, setDbPrices] = useState<Record<string, number>>({});
  const [dbStock, setDbStock] = useState<Record<string, number>>({});
  const [dbCatalog, setDbCatalog] = useState<CatalogItem[]>([]);
  const [dbGames, setDbGames] = useState<Game[]>([]);
  const [usdRate, setUsdRate] = useState(USD_TO_RUB_DEFAULT);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(true);

    function loadUsdRate() {
      fetch(`${ORDERS_URL}?action=usd_rate`)
        .then(r => r.json())
        .then(d => { if (d.rate) setUsdRate(d.rate); })
        .catch(() => {});
    }

    function loadGames() {
      fetch(`${ORDERS_URL}?action=games`)
        .then(r => r.json())
        .then(d => { if (d.games && d.games.length > 0) setDbGames(d.games); })
        .catch(() => {});
    }

    function loadCatalog() {
      fetch(`${ORDERS_URL}?action=catalog`)
        .then(r => r.json())
        .then(d => {
          if (d.items && d.items.length > 0) {
            setDbCatalog(d.items.filter((i: { available?: boolean }) => i.available !== false).map((i: { id: number; name: string; price_usd: number; stock: number; emoji: string; game: string; category?: string; image?: string | null; available?: boolean }) => ({
              id: i.id,
              name: i.name,
              priceUsd: i.price_usd,
              stock: i.stock,
              emoji: i.emoji,
              game: i.game,
              category: i.category,
              image: i.image || null,
              available: i.available !== false,
            })));
          }
        })
        .catch(() => {});
    }

    function loadPrices() {
      fetch(`${ORDERS_URL}?action=prices`)
        .then(r => r.json())
        .then(d => { if (d.prices) setDbPrices(d.prices); })
        .catch(() => {});
    }

    function loadStock() {
      fetch(`${ORDERS_URL}?action=stock_public`)
        .then(r => r.json())
        .then(d => { if (d.stock) setDbStock(d.stock); })
        .catch(() => {});
    }

    loadUsdRate();
    loadGames();
    loadCatalog();
    loadPrices();
    loadStock();

    const stockInterval = setInterval(loadStock, 60000);
    const rateInterval = setInterval(loadUsdRate, 30 * 60 * 1000);
    return () => { clearInterval(stockInterval); clearInterval(rateInterval); };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0F1923" }}>
      <HeroSection
        loaded={loaded}
        activeSection={activeSection}
        mobileMenuOpen={mobileMenuOpen}
        user={user}
        onScrollTo={scrollTo}
        onToggleMobile={() => setMobileMenuOpen(v => !v)}
        onOpenReviews={() => setReviewModalOpen(true)}
      />

      <CatalogSection
        dbCatalog={dbCatalog}
        dbGames={dbGames}
        dbPrices={dbPrices}
        dbStock={dbStock}
        usdRate={usdRate}
        selectedGame={selectedGame}
        onSelectGame={setSelectedGame}
        onOpenSupport={() => setSupportModalOpen(true)}
      />

      <ReviewsSection />

      <SupportSection
        onOpenSupport={() => setSupportModalOpen(true)}
        onScrollTo={scrollTo}
        reviewModalOpen={reviewModalOpen}
        supportModalOpen={supportModalOpen}
        onCloseReviews={() => setReviewModalOpen(false)}
        onCloseSupport={() => setSupportModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4" style={{ background: "#0B1520" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-white/25 text-xs text-center sm:text-left">
            © 2026 CambeckSHOP · Петров (самозанятый, ИНН 236400944070)
          </p>
          <div className="flex items-center gap-5">
            <a href="/oferta" className="font-body text-white/35 hover:text-white/70 text-xs transition-colors">
              Публичная оферта
            </a>
            <a href="/privacy" className="font-body text-white/35 hover:text-white/70 text-xs transition-colors">
              Политика конфиденциальности
            </a>
            <a href="mailto:cambeckshop@gmail.com" className="font-body text-white/35 hover:text-white/70 text-xs transition-colors">
              cambeckshop@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}