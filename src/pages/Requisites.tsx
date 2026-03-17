import { Link } from "react-router-dom";

const Requisites = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Вернуться в магазин
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Реквизиты</h1>

        <div className="space-y-6">
          <section className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Продавец</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">Статус</span>
                <span className="font-medium">Самозанятый</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">ИНН</span>
                <span className="font-medium">236400944070</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">Наименование</span>
                <span className="font-medium">CambeckSHOP</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">Сайт</span>
                <a href="https://cambeck.shop" className="font-medium hover:underline">cambeck.shop</a>
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Контакты</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">Email поддержки</span>
                <a href="mailto:cambeckshop@gmail.com" className="font-medium hover:underline">
                  cambeckshop@gmail.com
                </a>
              </div>
              <div className="flex justify-between pb-3">
                <span className="text-muted-foreground">Telegram поддержка</span>
                <a href="https://t.me/TanksCrypto" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                  @TanksCrypto
                </a>
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Оплата и доставка</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Оплата производится банковской картой через защищённый платёжный сервис ЮKassa.</p>
              <p>Товар (цифровой контент) передаётся покупателю сразу после подтверждения оплаты в личном кабинете.</p>
              <p>Возврат денежных средств осуществляется по запросу в течение 14 дней с момента покупки при условии, что товар не был активирован.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Requisites;
