export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: "#0F1923" }}>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <a href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-body mb-8 transition-colors">
          ← Вернуться на главную
        </a>

        <h1 className="font-display font-bold text-white text-3xl mb-2">Политика конфиденциальности</h1>
        <p className="font-body text-white/40 text-sm mb-10">Редакция от 18 марта 2026 г.</p>

        <div className="prose prose-invert max-w-none font-body text-white/70 leading-relaxed space-y-8">

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и
              защиты персональных данных пользователей сайта <strong>cambeckshop.ru</strong> (далее — «Сайт»).
            </p>
            <p>
              Оператором персональных данных является Петров (самозанятый, ИНН&nbsp;236400944070,
              далее — «Оператор»).
            </p>
            <p>
              Используя Сайт или оформляя заказ, вы выражаете согласие с условиями настоящей Политики.
              Если вы не согласны с её условиями — пожалуйста, воздержитесь от использования Сайта.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">2. Какие данные мы собираем</h2>
            <p>Оператор может собирать и обрабатывать следующие персональные данные:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Имя (никнейм), указанное при регистрации или в чате</li>
              <li>Адрес электронной почты</li>
              <li>Игровой никнейм (Roblox и иные платформы) — при указании в заказе</li>
              <li>Данные об операциях и заказах (суммы, даты, статусы)</li>
              <li>Технические данные: IP-адрес, тип браузера, время посещения (в целях аналитики и безопасности)</li>
            </ul>
            <p>Мы не собираем номера банковских карт и иные платёжные реквизиты — оплата обрабатывается платёжными системами.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">3. Цели обработки данных</h2>
            <p>Персональные данные обрабатываются в следующих целях:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Идентификация пользователя и ведение личного кабинета</li>
              <li>Оформление, обработка и исполнение заказов</li>
              <li>Связь с пользователем по вопросам заказов и поддержки</li>
              <li>Обеспечение безопасности и предотвращение мошенничества</li>
              <li>Улучшение работы Сайта и пользовательского опыта</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">4. Правовые основания обработки</h2>
            <p>
              Обработка персональных данных осуществляется на основании:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Согласия субъекта персональных данных (ст. 9 Федерального закона № 152-ФЗ)</li>
              <li>Исполнения договора, стороной которого является пользователь (оферта)</li>
              <li>Законных интересов Оператора в части обеспечения безопасности</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">5. Передача данных третьим лицам</h2>
            <p>
              5.1. Оператор не продаёт и не передаёт персональные данные третьим лицам в коммерческих целях.
            </p>
            <p>
              5.2. Данные могут передаваться третьим лицам исключительно в следующих случаях:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Платёжным системам (СБП, криптовалютные сервисы) — в объёме, необходимом для проведения платежа</li>
              <li>По требованию уполномоченных государственных органов в соответствии с законодательством РФ</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">6. Хранение и защита данных</h2>
            <p>
              6.1. Персональные данные хранятся на защищённых серверах на территории Российской Федерации.
            </p>
            <p>
              6.2. Оператор принимает технические и организационные меры для защиты данных от
              несанкционированного доступа, изменения, раскрытия или уничтожения.
            </p>
            <p>
              6.3. Данные хранятся в течение срока, необходимого для достижения целей обработки, но не
              более 3 лет с момента последнего взаимодействия пользователя с Сайтом, либо до момента
              отзыва согласия.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">7. Права пользователя</h2>
            <p>В соответствии с Федеральным законом № 152-ФЗ вы вправе:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Получить информацию об обработке ваших персональных данных</li>
              <li>Потребовать уточнения, блокировки или уничтожения данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Обжаловать действия Оператора в Роскомнадзоре</li>
            </ul>
            <p>
              Для реализации своих прав обратитесь по адресу:{" "}
              <a href="mailto:cambeckshop@gmail.com" className="text-blue-400 hover:text-blue-300">
                cambeckshop@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">8. Cookies</h2>
            <p>
              Сайт использует файлы cookie для корректной работы, сохранения сессии и аналитики.
              Используя Сайт, вы соглашаетесь с использованием cookies. Вы можете отключить их в настройках
              браузера, однако это может повлиять на функциональность Сайта.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">9. Изменение Политики</h2>
            <p>
              Оператор вправе вносить изменения в настоящую Политику. Актуальная версия всегда размещена
              на Сайте. Продолжение использования Сайта после изменений означает согласие с новой редакцией.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-xl mb-3">10. Контакты</h2>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p><span className="text-white/40">Оператор:</span> Петров (самозанятый)</p>
              <p><span className="text-white/40">ИНН:</span> 236400944070</p>
              <p><span className="text-white/40">Email:</span> <a href="mailto:cambeckshop@gmail.com" className="text-blue-400 hover:text-blue-300">cambeckshop@gmail.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
