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
            setDbCatalog(d.items.map((i: { id: number; name: string; price_usd: number; stock: number; emoji: string; category: string; game: string; image?: string | null }) => ({
              id: i.id,
              name: i.name,
              priceUsd: i.price_usd,
              stock: i.stock,
              emoji: i.emoji,
              category: i.category as "lucky" | "other",
              game: i.game,
              image: i.image || null,
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
    </div>
  );
}