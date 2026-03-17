-- Обновляем статус существующих аккаунтов: помечаем как не проданные (сброс для теста)
UPDATE stock_accounts SET is_sold = FALSE, order_id = NULL, sold_at = NULL WHERE item_id = 11;
